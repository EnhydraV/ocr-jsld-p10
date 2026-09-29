import type { Metadata, Viewport } from 'next';
import { Roboto } from 'next/font/google';
import './globals.scss';

// Telechargee au build et servie par l'application : aucune requete du navigateur vers un
// tiers, donc aucun flux de donnees a couvrir.
const roboto = Roboto({ subsets: ['latin'], display: 'swap', variable: '--font-roboto' });

export const metadata: Metadata = {
  title: 'Chat Your Car Your Way',
  description: 'Preuve de concept du chat en temps réel',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={roboto.variable}>
      <body>{children}</body>
    </html>
  );
}
