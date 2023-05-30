'use client'

import Link from 'next/link'
import React, { useEffect, useState } from 'react'

interface Props extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  hash?: string
  href?: string
  className?: string
  linkClassName?: string
  isActive?: boolean
}

export const TabLink = ({ children, hash, href, className = '', linkClassName, isActive, ...props }: Props) => {
  const [isLinkActive, setLinkActive] = useState(isActive)

  const customClassName = `inline-block rounded-full py-2 px-3 target:bg-slate-800 ${
    isLinkActive ? 'bg-slate-800' : ''
  } hover:bg-slate-800 duration-150 ${linkClassName}`

  const handlehashUpdate = () => {
    const currentHash = window.location.hash

    if (!currentHash) {
      if (hash === '#') {
        setLinkActive(true)
      } else {
        setLinkActive(false)
      }
    } else {
      if (currentHash === hash) {
        setLinkActive(true)
      } else {
        setLinkActive(false)
      }
    }
  }

  const handlePathUpdate = () => {
    const pathname = window.location.pathname
    if (pathname == href) setLinkActive(true)
  }

  useEffect(() => {
    if (!href) {
      handlehashUpdate()
      window.addEventListener('hashchange', handlehashUpdate)
    } else {
      handlePathUpdate()
    }
  }, [])

  return (
    <li
      className={`flex-none inline-block py-2 border-b ${
        isLinkActive ? 'border-slate-600 text-slate-200' : ' border-transparent'
      } ${className}`}
    >
      {href ? (
        <Link href={href} className={customClassName}>
          {children}
        </Link>
      ) : (
        <a {...props} href={`${window.location.pathname}${hash}`} className={customClassName}>
          {children}
        </a>
      )}
    </li>
  )
}
