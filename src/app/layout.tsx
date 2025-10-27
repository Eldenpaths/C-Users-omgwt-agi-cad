// CLAUDE-EDIT: Import global styles for Tailwind + Forge theme
import '../../styles/globals.css'

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
      <body>{children}</body>
    </html>
  )
}
