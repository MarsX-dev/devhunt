import mergeTW from '@/utils/mergeTW'
import { ReactNode } from 'react'

export const CommentContext = ({ className, children }: { className?: string; children?: ReactNode }) => (
  <p className={mergeTW(`whitespace-pre-wrap text-slate-300 text-sm ${className}`)}>{children}</p>
)
