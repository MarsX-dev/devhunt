import { IconVote } from '@/components/Icons'

export default ({ count }: { count?: number }) => (
  <div className="text-center text-slate-400">
    <IconVote className="w-6 h-6 mx-auto" />
    <span className="text-sm">{count}</span>
  </div>
)
