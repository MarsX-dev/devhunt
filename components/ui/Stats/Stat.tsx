import mergeTW from '@/utils/mergeTW'
import { type ReactNode } from 'react'

export const Stat = ({ children, className }: { children: ReactNode; className?: string }) => (
  <li className={mergeTW(`flex-1 w-full pl-6 border-l border-slate-700 ${className}`)}>{children}</li>
)
