import mergeTW from '@/utils/mergeTW'
import { ReactNode } from 'react'

export const TagsGroup = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <ul className={mergeTW(`flex flex-wrap items-center gap-3 ${className}`)}>{children}</ul>
)
