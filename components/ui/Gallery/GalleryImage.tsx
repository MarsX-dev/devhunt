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
  src += '&w=750';

  return (
    <li {...props} className={mergeTW(`flex-none snap-normal snap-start py-3 pointer-events-none ${className}`)}>
      <img src={src} alt={alt} className={`w-[459px] h-auto rounded-lg object-contain ${imgClassName}`} />
    </li>
  );
};
