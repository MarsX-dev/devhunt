import mergeTW from '@/libs/mergeTW'

export const CommentUserAvatar = ({
  src = '',
  alt = '',
  className = '',
}: {
  src: string
  alt?: string
  className?: string
}) => (
  <div className="flex-none relative">
    {src ? (
      <img src={src} alt={alt} className={mergeTW(`w-10 h-10 object-cover rounded-full ${className}`)} />
    ) : (
      <div
        className={mergeTW(
          `w-10 h-10 rounded-full bg-gradient-to-l from-sky-500 via-indigo-500 to-indigo-500 ${className}`
        )}
      ></div>
    )}
  </div>
)
