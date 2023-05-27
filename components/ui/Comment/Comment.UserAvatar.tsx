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
  <div className="flex-none">
    <img src={src} alt={alt} className={mergeTW(`w-10 h-10 object-cover rounded-full ${className}`)} />
  </div>
)
