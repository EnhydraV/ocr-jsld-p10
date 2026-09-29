import Image from 'next/image';
import styles from './Avatar.module.scss';

export type AvatarKind = 'brand' | 'person';

interface Props {
  kind: AvatarKind;
}

// Purement decoratif : le nom de l'interlocuteur est juste a cote, donc l'image n'a pas
// d'alternative textuelle et la silhouette est masquee aux lecteurs d'ecran.
export function Avatar({ kind }: Props) {
  if (kind === 'brand') {
    return (
      <Image className={styles.avatar} src="/avatar-ycyw.png" alt="" width={40} height={40} priority />
    );
  }
  return (
    <span className={`${styles.avatar} ${styles.person}`} aria-hidden="true">
      <svg viewBox="0 0 24 24" width="24" height="24" focusable="false">
        <path
          fill="currentColor"
          d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.4 0-8 2.5-8 5.5V22h16v-2.5c0-3-3.6-5.5-8-5.5Z"
        />
      </svg>
    </span>
  );
}
