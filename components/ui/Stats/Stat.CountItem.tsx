import mergeTW from '@/utils/mergeTW'
import { type ReactNode } from 'react'

export const StatCountItem = ({ children, className }: { children: ReactNode; className?: string }) => (
  <span className={mergeTW(`text-lg text-slate-100 font-medium ${className}`)}>{children}</span>
)
