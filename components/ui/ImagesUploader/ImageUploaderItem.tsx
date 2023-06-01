import { IconXmark } from '@/components/Icons'
import mergeTW from '@/utils/mergeTW'

export const ImageUploaderItem = ({
  className = '',
  src,
  onRemove,
}: {
  className?: string
  src: string
  onRemove: () => void
}) => (
  <div
    className={mergeTW(
      `relative flex-none w-full max-w-[13rem] h-36 rounded-md overflow-hidden border border-slate-700 group duration-150 ${className}`
    )}
  >
    <img src={src} className="w-full h-full object-cover" loading="lazy" />
    <button
      type="button"
      onClick={onRemove}
      className="opacity-0 w-7 h-7 rounded-full flex items-center justify-center absolute inset-0 m-auto text-slate-800 bg-slate-50 hover:text-red-500 group-hover:opacity-100 duration-150"
    >
      <IconXmark className="w-6 h-6" />
    </button>
  </div>
)
