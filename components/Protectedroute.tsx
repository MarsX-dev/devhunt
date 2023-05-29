import { useSupabase } from '@/components/supabase/provider'
import { ReactNode } from 'react'
import LoginPage from './ui/LoginPage'

export default ({ children }: { children: ReactNode }) => {
  const { session } = useSupabase()
  const user = session && session.user

  return user ? <>{children}</> : <LoginPage />
}
