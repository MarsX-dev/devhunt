import mergeTW from '@/utils/mergeTW'
import { ReactNode } from 'react'

export const CommentDate = ({ className, children }: { className?: string; children?: ReactNode }) => (
  <span className={mergeTW(`block text-xs text-slate-400 ${className}`)}>{children}</span>
)
