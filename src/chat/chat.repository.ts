// Acces aux tables conversation et message. Seul endroit du service qui parle a la base.
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Conversation, Message, MessageAuthor } from '../generated/prisma/client';

@Injectable()
export class ChatRepository {
  constructor(private readonly prisma: PrismaService) {}

  findConversation(id: string): Promise<Conversation | null> {
    return this.prisma.conversation.findUnique({ where: { id } });
  }

  /** Messages posterieurs a un numero d'ordre, dans l'ordre : c'est la resynchronisation. */
  messagesAfter(conversationId: string, afterSeq = 0): Promise<Message[]> {
    return this.prisma.message.findMany({
      where: { conversationId, seq: { gt: afterSeq } },
      orderBy: { seq: 'asc' },
    });
  }

  /**
   * Ajoute un message et lui attribue son numero d'ordre dans la meme transaction. La ligne
   * de la conversation est verrouillee le temps de l'increment, ce qui serialise les
   * ecritures d'une meme conversation, y compris entre plusieurs instances du service.
   */
  appendMessage(conversationId: string, authorType: MessageAuthor, authorId: string, body: string): Promise<Message> {
    return this.prisma.$transaction(async (tx) => {
      const [row] = await tx.$queryRaw<{ last_seq: number }[]>`
        SELECT last_seq FROM conversation WHERE id = ${conversationId}::uuid FOR UPDATE`;
      if (row === undefined) throw new ConversationNotFound(conversationId);
      const seq = row.last_seq + 1;
      await tx.conversation.update({ where: { id: conversationId }, data: { lastSeq: seq } });
      return tx.message.create({
        data: { conversationId, seq, authorType, authorId, body },
      });
    });
  }
}

export class ConversationNotFound extends Error {
  constructor(id: string) {
    super(`Conversation introuvable : ${id}`);
    this.name = 'ConversationNotFound';
  }
}
