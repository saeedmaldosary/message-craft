import './globals.css'

export const metadata = {
  title: 'Message Queue Learning App',
  description: 'Learn message queues with NATS, Spring Boot, and Next.js',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}