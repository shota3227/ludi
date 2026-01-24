import { AuthProvider } from '@/components/AuthProvider'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AuthProvider>{children}</AuthProvider>
}
