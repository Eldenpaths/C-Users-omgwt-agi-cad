// CLAUDE-EDIT: Import global styles for Tailwind + Forge theme
import '../../styles/globals.css'
import { AuthProvider } from '@/lib/auth/AuthContext'
import Topbar from '@/components/Topbar'

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
      <body>
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <Topbar />
            <div className="flex-1">{children}</div>
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
