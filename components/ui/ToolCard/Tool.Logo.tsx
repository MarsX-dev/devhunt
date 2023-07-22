import mergeTW from '@/utils/mergeTW';
import Image from 'next/image';

export default ({ src, className, imgClassName, alt }: { src: string; className?: string; imgClassName?: string; alt?: string }) => (
  <div className={mergeTW(`flex-none  ${className}`)}>
    <Image src={src} alt={alt as string} className={mergeTW(`rounded-full object-fill  ${imgClassName}`)} width={65} height={65} priority />
  </div>
);
