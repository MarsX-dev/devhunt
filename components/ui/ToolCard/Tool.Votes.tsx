import { IconVote } from '@/components/Icons'
import mergeTW from '@/utils/mergeTW'

export default ({ count, className = '' }: { count?: number; className?: string }) => (
  <div className={mergeTW(`text-center text-slate-400 ${className}`)}>
    <IconVote className="w-6 h-6 mx-auto" />
    <span className="text-sm">{count}</span>
  </div>
)
