import mergeTW from '@/utils/mergeTW'
import { ReactNode } from 'react'

export const CommentUserName = ({ className, children }: { className?: string; children?: ReactNode }) => (
  <span className={mergeTW(`block text-sm text-slate-200 font-medium ${className}`)}>{children}</span>
)
