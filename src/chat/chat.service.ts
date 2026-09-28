// Regles du chat. Ne connait ni HTTP ni SQL : le transport appelle ce service, qui s'appuie
// sur le depot.
import { Injectable, NotFoundException } from '@nestjs/common';
import { ChatRepository, ConversationNotFound } from './chat.repository';
import { ChatEvents } from './chat.events';
import type { SendMessageInput } from './chat.schemas';
import type { Conversation, Message } from '../generated/prisma/client';

export interface ConversationWithMessages {
  conversation: Conversation;
  messages: Message[];
}

@Injectable()
export class ChatService {
  constructor(
    private readonly repository: ChatRepository,
    private readonly events: ChatEvents,
  ) {}

  async history(conversationId: string, afterSeq?: number): Promise<ConversationWithMessages> {
    const conversation = await this.repository.findConversation(conversationId);
    if (conversation === null) throw new NotFoundException(`Conversation introuvable : ${conversationId}`);
    const messages = await this.repository.messagesAfter(conversationId, afterSeq);
    return { conversation, messages };
  }

  async send(conversationId: string, input: SendMessageInput): Promise<Message> {
    let message: Message;
    try {
      message = await this.repository.appendMessage(conversationId, input.authorType, input.authorId, input.body);
    } catch (error) {
      if (error instanceof ConversationNotFound) throw new NotFoundException(error.message);
      throw error;
    }
    this.events.publish(message);
    return message;
  }
}
