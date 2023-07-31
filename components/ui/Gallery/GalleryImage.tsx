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
}) => {
    return (
        <li {...props}
            className={mergeTW(`flex-none snap-normal snap-start py-3 pointer-events-none w-[400px] aspect-[4/3] ${className}`)}>
            <img src={src} alt={alt} className={`w-full h-full object-cover rounded-lg ${imgClassName}`}/>
        </li>
    )
};
