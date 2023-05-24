import mergeTW from '@/libs/mergeTW'
import { ReactNode } from 'react'

export default ({ className, children }: { className?: string; children?: ReactNode }) => (
  <h3 className={mergeTW(`text-slate-100 font-medium ${className}`)}>{children}</h3>
)
