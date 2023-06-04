import mergeTW from '@/utils/mergeTW';

export const GalleryImage = ({
  src = '',
  alt = '',
  className = '',
  imgClassName = '',
  ...props
}: {
  src: string;
  alt?: string;
  className?: string;
  imgClassName?: string;
}) => (
  <li {...props} className={mergeTW(`flex-none snap-normal snap-start py-3 pointer-events-none ${className}`)}>
    <img src={src} alt={alt} className={`max-w-md rounded-lg ${imgClassName}`} />
  </li>
);
