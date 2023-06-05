import mergeTW from '@/utils/mergeTW'

export default ({
  src,
  className,
  imgClassName,
  alt,
}: {
  src: string
  className?: string
  imgClassName?: string
  alt?: string
}) => (
  <div className={mergeTW(`flex-none  ${className}`)}>
    <img src={src} alt={alt} className={mergeTW(`bg-slate-300 w-16 h-16 rounded-full  ${imgClassName}`)} />
  </div>
)
