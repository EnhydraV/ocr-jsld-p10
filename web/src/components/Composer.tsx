'use client';

import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import styles from './Composer.module.scss';

interface Props {
  onSend: (body: string) => void;
  disabled: boolean;
}

/** Hauteur maximale du champ avant qu'il ne defile, environ cinq lignes. */
const MAX_HEIGHT_PX = 132;

export function Composer({ onSend, disabled }: Props) {
  const [draft, setDraft] = useState('');
  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const fieldId = useId();
  const hintId = useId();

  // Le champ grandit avec le texte : sans cela, le multiligne se saisit a l'aveugle.
  useEffect(() => {
    const field = fieldRef.current;
    if (field === null) return;
    field.style.height = 'auto';
    field.style.height = `${Math.min(field.scrollHeight, MAX_HEIGHT_PX)}px`;
  }, [draft]);

  function send(): void {
    const body = draft.trim();
    if (body === '') return;
    onSend(body);
    setDraft('');
  }

  function submit(event: FormEvent): void {
    event.preventDefault();
    send();
  }

  function keyDown(event: KeyboardEvent<HTMLTextAreaElement>): void {
    if (event.key !== 'Enter') return;
    // Une touche morte ou une saisie en cours de composition termine par Entree : l'envoi
    // attendrait le message a moitie ecrit.
    if (event.nativeEvent.isComposing) return;
    if (event.shiftKey || event.altKey) return;
    event.preventDefault();
    send();
  }

  return (
    <form className={styles.composer} onSubmit={submit}>
      <label className={styles.hidden} htmlFor={fieldId}>
        Votre message
      </label>
      <p className={styles.hidden} id={hintId}>
        Entrée envoie le message, Maj plus Entrée ou Alt plus Entrée passe à la ligne.
      </p>
      <textarea
        id={fieldId}
        ref={fieldRef}
        className={styles.field}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={keyDown}
        placeholder={disabled ? 'Connexion en cours' : 'Écrire un message'}
        disabled={disabled}
        aria-describedby={hintId}
        rows={1}
      />
      <button className={styles.send} type="submit" disabled={disabled || draft.trim() === ''}>
        Envoyer
      </button>
    </form>
  );
}
