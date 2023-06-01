'use client'

import Protectedroute from '@/components/ProtectedRoute'
import { ReactNode } from 'react'

export default ({ children }: { children: ReactNode }) => (
  <Protectedroute>
    <div className="mt-10 mb-32">{children}</div>
  </Protectedroute>
)
