import mergeTW from '@/libs/mergeTW'
import { ReactNode } from 'react'

type Props = {
  children: ReactNode
  className?: string
}

export default ({ children, className = '', ...props }: Props) => (
  <button
    {...props}
    className={mergeTW(
      `py-3 px-4 rounded-lg duration-150 font-medium text-center text-sm text-white bg-indigo-500 ${className}`
    )}
  >
    {children}
  </button>
)
