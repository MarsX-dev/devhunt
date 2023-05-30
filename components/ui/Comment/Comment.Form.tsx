import mergeTW from '@/utils/mergeTW'
import { HTMLAttributes, ReactNode } from 'react'

interface Props extends HTMLAttributes<HTMLFormElement> {
  children: ReactNode
  className?: string
}

export const CommentForm = ({ children, className, ...props }: Props) => (
  <form {...props} className={mergeTW(`${className}`)}>
    {children}
  </form>
)
