'use client'

import React, { useEffect, useState } from 'react'

interface Props extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  hash: string
  className?: string
  linkClassName?: string
  isActive?: boolean
}

export const TabLink = ({ children, hash, className = '', linkClassName, isActive, ...props }: Props) => {
  const [isLinkActive, setLinkActive] = useState(isActive)

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

  useEffect(() => {
    handlehashUpdate()
    window.addEventListener('hashchange', handlehashUpdate)
  }, [])

  let url = ''
  if (typeof window !== 'undefined') {
    url = `${window.location.pathname}${hash}`
  }

  return (
    <li
      className={`flex-none inline-block py-2 border-b ${
        isLinkActive ? 'border-slate-600 text-slate-200' : ' border-transparent'
      } ${className}`}
    >
      <a
        {...props}
        href={url}
        className={`inline-block rounded-full py-2 px-3 target:bg-slate-800 ${
          isLinkActive ? 'bg-slate-800' : ''
        } hover:bg-slate-800 duration-150 ${linkClassName}`}
      >
        {children}
      </a>
    </li>
  )
}
