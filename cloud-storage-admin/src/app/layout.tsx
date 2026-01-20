import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/auth-context'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Cloud Storage Admin - Platform Management',
  description: 'Admin dashboard for managing the cloud storage platform.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <style dangerouslySetInnerHTML={{
          __html: `
            * { color: #000000 !important; font-weight: 600 !important; }
            body { background: #ffffff !important; font-family: system-ui, -apple-system, sans-serif !important; }
            h1, h2, h3, h4, h5, h6 { color: #000000 !important; font-weight: 900 !important; }
            .sidebar { background: #ffffff !important; border-right: 2px solid #e5e7eb !important; }
            .sidebar * { color: #000000 !important; }
            button { color: #000000 !important; font-weight: 800 !important; }
          `
        }} />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}