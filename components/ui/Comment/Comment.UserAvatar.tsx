import mergeTW from '@/utils/mergeTW'
import Avatar from '../Avatar/Avatar'

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
      <Avatar src={src} alt={alt} className={className} />
    ) : (
      <div
        className={mergeTW(
          `w-10 h-10 rounded-full bg-gradient-to-l from-sky-500 via-indigo-500 to-indigo-500 ${className}`
        )}
      ></div>
    )}
  </div>
)
