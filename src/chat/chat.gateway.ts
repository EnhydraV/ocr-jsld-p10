// Transport WebSocket du chat, deuxieme porte d'entree apres le controleur HTTP. Il valide
// l'entree, appelle ChatService et rend le resultat ; aucune regle metier ici. Les messages
// echanges suivent l'enveloppe de Nest, { "event": ..., "data": ... }.
import { Logger, type OnModuleInit } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  type OnGatewayConnection,
  type OnGatewayDisconnect,
} from '@nestjs/websockets';
import type { WebSocket } from 'ws';
import type { ZodType } from 'zod';
import { ChatService } from './chat.service';
import { ChatSubscribers } from './chat.subscribers';
import { ChatEvents } from './chat.events';
import { socketSendSchema, subscribeSchema } from './chat.schemas';
import { loadConfig } from '../config';
import type { Message } from '../generated/prisma/client';

function push(socket: WebSocket, event: string, data: unknown): void {
  socket.send(JSON.stringify({ event, data }));
}

/** Rend la valeur validee, ou signale l'erreur au client et rend undefined. */
function validate<T>(schema: ZodType<T>, value: unknown, socket: WebSocket): T | undefined {
  const result = schema.safeParse(value);
  if (result.success) return result.data;
  push(socket, 'error', { reason: result.error.issues.map((i) => `${i.path.join('.')} : ${i.message}`) });
  return undefined;
}

@WebSocketGateway()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
  private readonly logger = new Logger(ChatGateway.name);
  private readonly instanceName = loadConfig().instanceName;

  constructor(
    private readonly chat: ChatService,
    private readonly subscribers: ChatSubscribers,
    private readonly events: ChatEvents,
  ) {}

  onModuleInit(): void {
    this.events.onMessage((message) => {
      this.broadcast(message.conversationId, message);
    });
  }

  // L'instance est annoncee des la connexion : c'est ce qui rend visible, depuis deux
  // fenetres, qu'elles ne parlent pas au meme processus.
  handleConnection(socket: WebSocket): void {
    push(socket, 'welcome', { instance: this.instanceName });
  }

  handleDisconnect(socket: WebSocket): void {
    this.subscribers.forget(socket);
  }

  @SubscribeMessage('subscribe')
  async subscribe(@MessageBody() body: unknown, @ConnectedSocket() socket: WebSocket): Promise<void> {
    const input = validate(subscribeSchema, body, socket);
    if (input === undefined) return;
    try {
      const { conversation, messages } = await this.chat.history(input.conversationId, input.afterSeq);
      this.subscribers.add(input.conversationId, socket);
      // Les messages posterieurs au dernier numero connu du client sont sa resynchronisation.
      push(socket, 'synced', { conversation, messages, instance: this.instanceName });
    } catch (error) {
      push(socket, 'error', { reason: error instanceof Error ? error.message : 'Erreur inconnue' });
    }
  }

  @SubscribeMessage('send')
  async send(@MessageBody() body: unknown, @ConnectedSocket() socket: WebSocket): Promise<void> {
    const input = validate(socketSendSchema, body, socket);
    if (input === undefined) return;
    let message: Message;
    try {
      message = await this.chat.send(input.conversationId, input);
    } catch (error) {
      push(socket, 'error', { reason: error instanceof Error ? error.message : 'Erreur inconnue' });
      return;
    }
    push(socket, 'sent', { seq: message.seq });
  }

  private broadcast(conversationId: string, message: Message): void {
    const sockets = this.subscribers.of(conversationId);
    for (const socket of sockets) push(socket, 'message', { message, instance: this.instanceName });
    this.logger.log(`Message ${message.seq} diffuse a ${sockets.length} connexion(s)`);
  }
}
