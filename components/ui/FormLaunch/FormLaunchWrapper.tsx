import mergeTW from '@/utils/mergeTW'
import { HTMLAttributes, ReactNode } from 'react'

interface Props extends HTMLAttributes<HTMLFormElement> {
  children: ReactNode
  className?: string
}

export const FormLaunchWrapper = ({ children, className = '', ...props }: Props) => (
  <form {...props}>
    <ul className={`space-y-10 ${mergeTW(className)}`}>{children}</ul>
  </form>
)
