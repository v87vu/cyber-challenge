import type { Metadata, Viewport } from 'next';
import { Cairo } from 'next/font/google';
import './globals.css';

const cairo = Cairo({
  subsets: ['arabic'],
  weight: ['600', '700', '900'],
  variable: '--font-ar',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'تحدي الوعي الرقمي — Digital Awareness Challenge',
  description:
    'لعبة توعوية من 20 سؤالاً لرفع وعي الطلبة بمخاطر الجرائم الإلكترونية. توقف .. تحقق .. ثم تصرف. | A 20-question game on cybercrime awareness.',
};

export const viewport: Viewport = {
  themeColor: '#cfe8fb',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
