import mergeTW from '@/utils/mergeTW'
import { ReactNode } from 'react'

export default ({ className, children }: { className?: string; children?: ReactNode }) => (
  <span className={mergeTW(`text-sm font-medium text-red-500 block ${className}`)}>{children}</span>
)
