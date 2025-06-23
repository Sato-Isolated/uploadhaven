import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'UploadHaven - Privacy-First File Sharing',
  description: 'Zero-knowledge, anonymous file sharing platform. Your files are encrypted in your browser - the server cannot decrypt them.',
  keywords: ['file sharing', 'privacy', 'zero-knowledge', 'encryption', 'anonymous', 'secure'],
  authors: [{ name: 'UploadHaven Community' }],
  openGraph: {
    title: 'UploadHaven - Privacy-First File Sharing',
    description: 'Zero-knowledge, anonymous file sharing platform',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-background">
          {children}
        </div>
      </body>
    </html>
  );
}
