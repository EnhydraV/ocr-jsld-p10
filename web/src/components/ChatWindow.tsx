'use client';

import { useChatSocket } from '@/hooks/useChatSocket';
import type { AuthorType } from '@/lib/protocol';
import { Avatar, type AvatarKind } from './Avatar';
import { MessageList } from './MessageList';
import { Composer } from './Composer';
import styles from './ChatWindow.module.scss';

interface Props {
  title: string;
  url: string;
  conversationId: string;
  authorType: AuthorType;
  authorId: string;
  avatar: AvatarKind;
}

export function ChatWindow({ title, url, conversationId, authorType, authorId, avatar }: Props) {
  const chat = useChatSocket({ url, conversationId, authorType, authorId });
  const online = chat.state === 'open';

  return (
    <main className={styles.window}>
      <header className={styles.header}>
        <Avatar kind={avatar} />
        <div className={styles.identity}>
          <h1 className={styles.title}>{title}</h1>
          {chat.conversation?.reservationRef != null && (
            <p className={styles.reference}>Réservation {chat.conversation.reservationRef}</p>
          )}
        </div>
      </header>

      {chat.interrupted && (
        <p className={styles.interrupted} role="status">
          Connexion interrompue. Vos messages repartiront dès qu&apos;elle sera rétablie.
        </p>
      )}

      {chat.error !== null && (
        <p className={styles.error} role="alert">
          {chat.error}
        </p>
      )}

      <MessageList messages={chat.messages} self={authorType} />
      <Composer onSend={chat.send} disabled={!online} />
    </main>
  );
}
