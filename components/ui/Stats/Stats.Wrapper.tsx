import mergeTW from '@/utils/mergeTW'
import { type ReactNode } from 'react'

export const StatsWrapper = ({ children, className }: { children: ReactNode; className?: string }) => (
  <ul className={mergeTW(`flex flex-col items-center gap-6 sm:flex-row ${className}`)}>{children}</ul>
)
