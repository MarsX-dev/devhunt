import mergeTW from '@/utils/mergeTW'
import { HTMLAttributes } from 'react'

interface Props extends HTMLAttributes<HTMLInputElement> {
  className?: string
  value?: string
}

export default ({ className, ...props }: Props) => (
  <input
    {...props}
    type="checkbox"
    className={mergeTW(
      `class="text-blue-600 focus:ring-blue-600 form-checkbox border-slate-700 ring-offset-slate-400 ring-slate-800 bg-slate-700 checked:bg-slate-700 rounded-md duration-150 text-blue-600 focus:ring-blue-600" ${className}`
    )}
  ></input>
)
