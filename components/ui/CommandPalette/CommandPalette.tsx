import { IconSearch } from '@/components/Icons'
import BlurBackground from '../BlurBackground/BlurBackground'
import { IProductResult } from '@/type'
import SearchItem from './SearchItem'
import EmptyState from './EmptyState'
import { useEffect } from 'react'

type ITrend = {
  name: string
  href: string
}

type Props = {
  isCommandActive: boolean
  searchResult?: IProductResult[]
  trend?: ITrend[]
  searchValue?: string
  setCommandActive?: (val: boolean) => void
  setSearch?: (val: string) => void
}

export default ({
  isCommandActive,
  searchResult = [],
  searchValue = '',
  setCommandActive = () => false,
  setSearch = () => '',
  trend = [],
}: Props) => {
  useEffect(() => {
    isCommandActive ? document.body.classList.add('overflow-hidden') : document.body.classList.remove('overflow-hidden')
  }, [isCommandActive])
  return isCommandActive ? (
    <div className="fixed z-30 w-full h-full inset-0 rounded-xl flex items-center justify-center px-4">
      <BlurBackground isActive={true} setActive={setCommandActive} />
      <div className="flex-1 max-w-xl rounded-xl bg-slate-900 bg-gradient-to-l from-slate-900 to-indigo-800/10 shadow-lg relative z-30">
        <div className="flex gap-x-3 items-center p-5 border-b border-slate-800">
          <IconSearch className="flex-none text-slate-400" />
          <input
            type="text"
            onChange={e => setSearch(e.target.value)}
            value={searchValue}
            placeholder="Search for tools"
            className="flex-1 text-slate-400 text-sm outline-none bg-transparent"
          />
        </div>
        <ul className="py-4 px-2 h-full max-h-[300px] overflow-auto">
          {searchValue ? (
            searchResult.length > 0 ? (
              searchResult.map((item, idx) => (
                <li key={idx}>
                  <SearchItem item={item} />
                </li>
              ))
            ) : (
              <EmptyState />
            )
          ) : (
            <div>
              <h3 className="text-sm font-medium text-slate-500 p-3">What most people search for</h3>
              <ul className="text-sm">
                {trend.map((item, idx) => (
                  <li key={idx}>
                    <button
                      onClick={() => setSearch(item.name)}
                      className="block w-full px-3 py-2 rounded-lg text-left text-slate-400 from-indigo-900/20 to-indigo-800/10 hover:bg-gradient-to-l duration-150"
                    >
                      {item.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </ul>
      </div>
    </div>
  ) : (
    <></>
  )
}
