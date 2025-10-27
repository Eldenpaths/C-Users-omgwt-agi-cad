export const metadata = {
  title: "AGI-CAD Forge",
  description: "Knowledge Graph Integration Environment",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#0a0a0a", color: "#f5f5f5" }}>
        {children}
      </body>
    </html>
  );
}
