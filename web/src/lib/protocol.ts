// Miroir des trames de la passerelle du service de chat. Toute trame porte la meme
// enveloppe, { event, data }.

export type AuthorType = 'customer' | 'advisor';

export interface ChatMessage {
  id: string;
  conversationId: string;
  seq: number;
  authorType: AuthorType;
  authorId: string;
  body: string;
  sentAt: string;
}

export interface Conversation {
  id: string;
  customerId: string;
  advisorId: string | null;
  reservationRef: string | null;
  topic: string;
  status: string;
  lastSeq: number;
}

export type ServerFrame =
  | { event: 'welcome'; data: { instance: string } }
  | { event: 'synced'; data: { conversation: Conversation; messages: ChatMessage[]; instance: string } }
  | { event: 'sent'; data: { seq: number } }
  | { event: 'message'; data: { message: ChatMessage; instance: string } }
  | { event: 'error'; data: { reason: string | string[] } };

export function parseFrame(raw: string): ServerFrame | null {
  try {
    const frame: unknown = JSON.parse(raw);
    if (typeof frame === 'object' && frame !== null && 'event' in frame) return frame as ServerFrame;
  } catch {
    return null;
  }
  return null;
}
