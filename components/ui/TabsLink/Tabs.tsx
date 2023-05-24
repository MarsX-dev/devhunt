import mergeTW from '@/libs/mergeTW'
import { ReactNode } from 'react'

export const Tabs = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={mergeTW(`border-b border-slate-800 text-sm text-slate-400 font-medium ${className}`)}>
    <ul className="container-custom-screen flex items-center gap-x-4 overflow-auto w-full">{children}</ul>
  </div>
)
