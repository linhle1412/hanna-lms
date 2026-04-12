import type { Metadata } from 'next'
import '../styles/globals.css'
import '@fortawesome/fontawesome-free/css/all.min.css'
import { ToastProvider } from '@/contexts/ToastContext'

export const metadata: Metadata = {
  title: 'LMS System - Learning Management System',
  description: 'LMS System Learning Management System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}

