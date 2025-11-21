export const metadata = {
  title: 'AGI-CAD Core',
  description: 'Symbolic-Neural Design Environment',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-black text-white min-h-screen p-8">
        <div className="mb-4 text-sm text-gray-500">
          AGI-CAD Core - Minimal Layout Active
        </div>
        {children}
      </body>
    </html>
  )
}
