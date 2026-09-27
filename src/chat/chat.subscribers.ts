// Registre des connexions ouvertes sur cette instance, par conversation. Il repond a une
// seule question : a qui pousser un message. Une connexion peut suivre plusieurs
// conversations, et disparait du registre des qu'elle se ferme.
import { Injectable } from '@nestjs/common';
import type { WebSocket } from 'ws';

@Injectable()
export class ChatSubscribers {
  private readonly byConversation = new Map<string, Set<WebSocket>>();

  add(conversationId: string, socket: WebSocket): void {
    const sockets = this.byConversation.get(conversationId) ?? new Set<WebSocket>();
    sockets.add(socket);
    this.byConversation.set(conversationId, sockets);
  }

  forget(socket: WebSocket): void {
    for (const [conversationId, sockets] of this.byConversation) {
      sockets.delete(socket);
      if (sockets.size === 0) this.byConversation.delete(conversationId);
    }
  }

  of(conversationId: string): WebSocket[] {
    return [...(this.byConversation.get(conversationId) ?? [])];
  }

  count(conversationId: string): number {
    return this.byConversation.get(conversationId)?.size ?? 0;
  }
}
