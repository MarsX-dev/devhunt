'use client'

import { HTMLAttributes, ReactNode, useEffect } from 'react'

interface Props extends HTMLAttributes<HTMLUListElement> {
  children: ReactNode
}

export const Comments = ({ children, ...props }: Props) => {
  return <ul {...props}>{children}</ul>
}
