import mergeTW from '@/utils/mergeTW';

const regexPattern = /w=\d+/g;
const replacement = 'w=128';

export default ({ src, className, imgClassName, alt }: { src: string; className?: string; imgClassName?: string; alt?: string }) => (
  <div className={mergeTW(`flex-none  ${className}`)}>
    <img
      src={src.replace(regexPattern, replacement)}
      alt={alt as string}
      className={mergeTW(`rounded-full w-16 h-16 object-cover  ${imgClassName}`)}
      loading="lazy"
    />
  </div>
);
