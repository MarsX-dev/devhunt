import mergeTW from '@/utils/mergeTW'
import { type ReactNode } from 'react'

export const StatsWrapper = ({ children, className }: { children: ReactNode; className?: string }) => (
  <ul className={mergeTW(`gap-6 grid grid-cols-2 lg:grid-cols-4 ${className}`)}>{children}</ul>
)
