'use client'

import { IconEllipsisVertical } from '@/components/Icons'
import { ReactNode, useEffect, useRef, useState } from 'react'

export const CommentActionMenu = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState(false)
  const menuBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const handleDropDown = (e: MouseEvent) => {
      if (menuBtnRef.current && !(menuBtnRef.current as HTMLElement).contains(e.target as Node)) setState(false)
    }
    document.addEventListener('click', handleDropDown)
  }, [])

  return (
    <div className="relative">
      <button
        ref={menuBtnRef}
        onClick={() => setState(!state)}
        className="py-1 px-0.5 rounded-md text-slate-400 hover:bg-slate-800 active:bg-slate-700 duration-150"
      >
        <IconEllipsisVertical className="" />
      </button>
      <ul
        className={`bg-slate-800 top-10 right-0 absolute rounded-lg w-32 shadow-md space-y-0 overflow-hidden ${
          state ? '' : 'hidden'
        }`}
      >
        {children}
      </ul>
    </div>
  )
}
