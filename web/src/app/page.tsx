import Link from 'next/link';
import styles from './page.module.scss';

export default function Accueil() {
  return (
    <main className={styles.home}>
      <h1 className={styles.title}>Chat Your Car Your Way</h1>
      <p className={styles.lead}>
        Preuve de concept. Ouvrez les deux vues dans deux fenêtres distinctes pour voir les
        messages circuler de l&apos;une à l&apos;autre.
      </p>
      <nav className={styles.links}>
        <Link className={styles.card} href="/client">
          Vue client
          <span>Charlie, qui a réservé</span>
        </Link>
        <Link className={styles.card} href="/conseiller">
          Vue conseiller
          <span>Victor, au service client</span>
        </Link>
      </nav>
    </main>
  );
}
