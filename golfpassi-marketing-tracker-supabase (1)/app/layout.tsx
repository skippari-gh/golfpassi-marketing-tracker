import './globals.css'

export const metadata = {
  title: 'Golfpassi Marketing Tracker',
  description: 'Matkojen markkinointikalenteri ja nostosuositukset'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fi">
      <body>{children}</body>
    </html>
  )
}
