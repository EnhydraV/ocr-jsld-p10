'use client';

import { useEffect, useRef } from 'react';
import type { AuthorType, ChatMessage } from '@/lib/protocol';
import styles from './MessageList.module.scss';

interface Props {
  messages: ChatMessage[];
  /** Point de vue de la fenetre : ses propres messages sont a droite. */
  self: AuthorType;
}

const heure = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' });

export function MessageList({ messages, self }: Props) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages]);

  return (
    <div className={styles.scroller}>
      <ol className={styles.list} role="log" aria-live="polite" aria-relevant="additions" aria-label="Messages">
        {messages.map((message) => {
          const mine = message.authorType === self;
          const auteur = message.authorType === 'customer' ? 'Client' : 'Conseiller';
          return (
            <li key={message.seq} className={mine ? styles.mine : styles.theirs}>
              <div className={styles.bubble}>
                <span className={styles.author}>{auteur}</span>
                <p className={styles.body}>{message.body}</p>
              </div>
              <time className={styles.time} dateTime={message.sentAt}>
                {heure.format(new Date(message.sentAt))}
              </time>
            </li>
          );
        })}
      </ol>
      <div ref={endRef} />
    </div>
  );
}
