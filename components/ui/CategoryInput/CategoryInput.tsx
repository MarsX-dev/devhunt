import React, { ChangeEventHandler, MouseEventHandler, useState } from 'react'
import { IconXmark } from '@/components/Icons'

type Props = {
  className?: string
  categories?: string[]
  setCategory?: (e: string[]) => void
}

export default ({ className, categories = [], setCategory = () => [] }: Props) => {
  const [items] = useState(['Apple', 'Laravel', 'Front-End', 'Back-end'])
  const [newItems, setNewItems] = useState<string[]>([])

  const [isActive, setIsActive] = useState(false)
  const [value, setValue] = useState('')

  const handleBlur = () => {
    setTimeout(() => setIsActive(false), 200)
  }

  const handleKeydown = (e: { key: string }) => {
    const tagsLen = categories.length
    if (e.key === 'Backspace' && tagsLen > 0 && !value) {
      setCategory(categories.slice(0, tagsLen - 1))
    }
  }

  const handleSearch: ChangeEventHandler = e => {
    const inputValue = (e.target as HTMLInputElement).value
    setValue(inputValue)
    const getResults: string[] = items.filter(item => item.toLowerCase().includes(inputValue.toLowerCase()))

    setNewItems(getResults)
  }

  return (
    <div className={`relative ${className}`}>
      <ul className="flex flex-wrap items-center gap-2 w-full px-3 py-2 border border-slate-800 rounded-lg">
        {categories.map((item, idx) => (
          <li
            key={idx}
            className="flex-none inline-flex items-center px-3 py-2 bg-slate-800 rounded-lg font-medium text-xs text-slate-300"
          >
            {item}
            <button onClick={() => setCategory(categories.filter((_, i) => i !== idx))}>
              <IconXmark className="w-3 h-3 ml-2" />
            </button>
          </li>
        ))}
        <li>
          <input
            type="text"
            value={value}
            placeholder="Add a skill"
            className="text-sm text-slate-500 placeholder-slate-500 py-2 border-0 outline-none bg-transparent appearance-none"
            onFocus={() => setIsActive(true)}
            onBlur={handleBlur}
            onKeyDown={handleKeydown}
            onChange={handleSearch}
          />
        </li>
      </ul>
      {isActive && (
        <div className="absolute z-10 top-14 w-full rounded-lg bg-slate-800 shadow-md border border-slate-800 text-sm text-slate-400">
          <div className="p-2">
            {value ? (
              newItems.length > 0 ? (
                newItems.map((item, idx) => (
                  <button
                    key={idx}
                    className="w-full text-left p-2 hover:bg-slate-700 active:bg-slate-600 rounded-lg duration-150"
                    onClick={() => setCategory([...categories, item])}
                  >
                    {item}
                  </button>
                ))
              ) : (
                <div className="text-sm text-slate-300 p-2">No categories found</div>
              )
            ) : (
              items.map((item, idx) => (
                <button
                  key={idx}
                  className="w-full text-left p-2 hover:bg-slate-700 active:bg-slate-600 rounded-lg duration-150"
                  onClick={() => setCategory([...categories, item])}
                >
                  {item}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
