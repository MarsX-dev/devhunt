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
      {/* Fixed 16:10 frame: the gallery keeps its size while screenshots of any shape load. */}
      <img src={src} alt={alt} className={`aspect-[16/10] w-[459px] rounded-lg bg-slate-800/40 object-contain ${imgClassName}`} />
    </li>
  );
};
