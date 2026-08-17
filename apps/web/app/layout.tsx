import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ServiceFlow AI — Your entire service business. One intelligent flow.',
  description:
    'AI-powered field service management for HVAC, electrical, plumbing, cleaning, and more.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-offwhite text-graphite dark:bg-forest-950 dark:text-offwhite antialiased">
        {children}
      </body>
    </html>
  );
}
