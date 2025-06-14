// Since we have a `[locale]` folder, this layout is required
// but it should just pass children through
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
