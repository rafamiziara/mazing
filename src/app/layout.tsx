import type { Metadata } from 'next'
import { Fredoka } from 'next/font/google'

import './globals.css'

const fredoka = Fredoka({
  variable: '--font-fredoka',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Mazing Game',
  description: 'A Maze Game built with Matter.js and Next.js',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${fredoka.variable} antialiased`}>{children}</body>
    </html>
  )
}
