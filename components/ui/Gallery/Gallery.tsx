import mergeTW from '@/libs/mergeTW'
import { ReactNode } from 'react'

export const Gallery = ({ children, className }: { children: ReactNode; className?: string }) => (
  <ul className={mergeTW(`flex items-center gap-x-3 w-full overflow-auto snap-x ${className}`)}>{children}</ul>
)
