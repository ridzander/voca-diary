import type { Metadata } from 'next';
import { Inter, Quicksand, Monoton } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const quicksand = Quicksand({
  subsets: ['latin'],
  variable: '--font-quicksand',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const monoton = Monoton({
  subsets: ['latin'],
  variable: '--font-monoton',
  weight: '400',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Voca Diary',
  description: 'Voice-first journal for symptoms and workouts',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${quicksand.variable} ${monoton.variable} light`}>
      <head>
        {/* Material Symbols Outlined */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
      <body className="font-body antialiased">
        {children}
        <Toaster position="bottom-center" />
      </body>
    </html>
  );
}
