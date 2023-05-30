import mergeTW from '@/utils/mergeTW'
import { ReactNode } from 'react'

export const CommentFormWrapper = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={mergeTW(`flex gap-x-4 items-start ${className}`)}>{children}</div>
)
