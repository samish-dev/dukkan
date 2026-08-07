export const metadata = { title: 'Dukkan', description: 'Ordering for small merchants in Beirut' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
