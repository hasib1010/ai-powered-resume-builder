import './globals.css'

export const metadata = {
  title: 'AI Resume Builder',
  description: 'Create professional resumes with AI',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}