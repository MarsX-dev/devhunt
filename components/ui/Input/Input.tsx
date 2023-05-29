import mergeTW from '@/libs/mergeTW'
import { HTMLAttributes } from 'react'

interface Props extends HTMLAttributes<HTMLInputElement> {
  className?: string
  value?: string
}

export default ({ className, ...props }: Props) => (
  <input
    {...props}
    type="input"
    className={mergeTW(
      `px-3 py-2 bg-slate-800/70 hover:bg-slate-800/40 focus:bg-slate-800/40 text-sm text-slate-500 placeholder-slate-500 outline-none border border-slate-800 focus:border-slate-600 shadow-sm rounded-lg duration-200 ${className}`
    )}
  ></input>
)
