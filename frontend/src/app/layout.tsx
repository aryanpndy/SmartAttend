import type { Metadata } from 'next'
import { Syne, DM_Sans } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const syne = Syne({ subsets: ['latin'], variable: '--font-syne', display: 'swap' })
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-geist-sans', display: 'swap' })

export const metadata: Metadata = {
  title: 'SmartAttend — School Management System',
  description: 'AI-powered attendance & teaching management for primary schools',
  manifest: '/manifest.json',
  themeColor: '#1486e8',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${syne.variable} ${dmSans.variable} font-sans antialiased bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 min-h-screen`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
