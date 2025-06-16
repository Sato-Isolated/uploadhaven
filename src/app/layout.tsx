import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'UploadHaven',
  description: 'Simple file uploader, built with Next.js and ShadCN',
};

// Root layout that provides the basic HTML structure
// The locale-specific layout in [locale]/layout.tsx handles providers and localization
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
