import mergeTW from '@/libs/mergeTW'
import { ReactNode } from 'react'

export const CommentContext = ({ className, children }: { className?: string; children?: ReactNode }) => (
  <p className={mergeTW(`text-slate-300 text-sm sm:text-base ${className}`)}>{children}</p>
)
