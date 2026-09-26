import mergeTW from '@/utils/mergeTW';

const regexPattern = /w=\d+/g;
const replacement = 'w=128';

export default ({ src, className, imgClassName, alt }: { src: string; className?: string; imgClassName?: string; alt?: string }) => (
  <div className={mergeTW(`flex-none  ${className}`)}>
    <img
      src={src.replace(regexPattern, replacement)}
      alt={alt as string}
      className={mergeTW(`rounded-xl w-14 h-14 object-cover bg-slate-800 ring-1 ring-slate-800  ${imgClassName}`)}
      loading="lazy"
    />
  </div>
);
