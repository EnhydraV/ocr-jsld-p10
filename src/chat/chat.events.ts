// Bus interne du chat. Le service publie ici tout message enregistre, quelle que soit la
// porte par laquelle il est entre, HTTP ou WebSocket ; la passerelle s'y abonne pour pousser
// aux connexions ouvertes. Sans ce bus, un message cree par l'API ne parviendrait jamais aux
// participants connectes.
import { Injectable } from '@nestjs/common';
import { EventEmitter } from 'node:events';
import type { Message } from '../generated/prisma/client';

type Listener = (message: Message) => void;

@Injectable()
export class ChatEvents {
  private readonly emitter = new EventEmitter();

  publish(message: Message): void {
    this.emitter.emit('message', message);
  }

  onMessage(listener: Listener): () => void {
    this.emitter.on('message', listener);
    return () => this.emitter.off('message', listener);
  }
}
