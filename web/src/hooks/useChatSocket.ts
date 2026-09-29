'use client';

// Connexion a la passerelle du service de chat. Le hook garde le dernier numero d'ordre
// recu et le renvoie a chaque abonnement : c'est ce qui rattrape les messages manques
// pendant une coupure, sans doublon.
import { useCallback, useEffect, useRef, useState } from 'react';
import { parseFrame, type AuthorType, type ChatMessage, type Conversation } from '@/lib/protocol';

export type ConnectionState = 'connecting' | 'open' | 'closed';

interface Options {
  url: string;
  conversationId: string;
  authorType: AuthorType;
  authorId: string;
}

export interface ChatSocket {
  messages: ChatMessage[];
  conversation: Conversation | null;
  state: ConnectionState;
  /** Vrai quand la liaison a ete etablie puis perdue, faux pendant la connexion initiale. */
  interrupted: boolean;
  error: string | null;
  send: (body: string) => void;
}

const RETRY_DELAY_MS = 2000;

export function useChatSocket({ url, conversationId, authorType, authorId }: Options): ChatSocket {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [state, setState] = useState<ConnectionState>('connecting');
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const lastSeqRef = useRef(0);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wantedRef = useRef(true);
  const [seenOpen, setSeenOpen] = useState(false);

  const merge = useCallback((incoming: ChatMessage[]) => {
    setMessages((current) => {
      const bySeq = new Map(current.map((m) => [m.seq, m]));
      for (const message of incoming) bySeq.set(message.seq, message);
      const merged = [...bySeq.values()].sort((a, b) => a.seq - b.seq);
      const last = merged.at(-1);
      if (last !== undefined) lastSeqRef.current = Math.max(lastSeqRef.current, last.seq);
      return merged;
    });
  }, []);

  const open = useCallback(() => {
    if (socketRef.current !== null) return;
    setState('connecting');
    const socket = new WebSocket(url);
    socketRef.current = socket;

    socket.addEventListener('open', () => {
      setState('open');
      setSeenOpen(true);
      setError(null);
      socket.send(
        JSON.stringify({ event: 'subscribe', data: { conversationId, afterSeq: lastSeqRef.current } }),
      );
    });

    socket.addEventListener('message', (event: MessageEvent<string>) => {
      const frame = parseFrame(event.data);
      if (frame === null) return;
      switch (frame.event) {
        case 'welcome':
          break;
        case 'synced':
          setConversation(frame.data.conversation);
          merge(frame.data.messages);
          break;
        case 'message':
          merge([frame.data.message]);
          break;
        case 'error':
          setError(Array.isArray(frame.data.reason) ? frame.data.reason.join(', ') : frame.data.reason);
          break;
        case 'sent':
          break;
      }
    });

    socket.addEventListener('close', () => {
      socketRef.current = null;
      setState('closed');
      // La reconnexion repart du dernier numero connu, donc rien n'est perdu ni redonne.
      if (wantedRef.current) retryRef.current = setTimeout(open, RETRY_DELAY_MS);
    });
  }, [url, conversationId, merge]);

  useEffect(() => {
    wantedRef.current = true;
    open();
    return () => {
      wantedRef.current = false;
      if (retryRef.current !== null) clearTimeout(retryRef.current);
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [open]);

  const send = useCallback(
    (body: string) => {
      const socket = socketRef.current;
      if (socket === null || socket.readyState !== WebSocket.OPEN) return;
      socket.send(JSON.stringify({ event: 'send', data: { conversationId, authorType, authorId, body } }));
    },
    [conversationId, authorType, authorId],
  );

  return { messages, conversation, state, interrupted: seenOpen && state !== 'open', error, send };
}
