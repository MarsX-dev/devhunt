import extractVideoId from '@/utils/extractVideoId';
import mergeTW from '@/utils/mergeTW';
import { ReactNode } from 'react';

export const Gallery = ({ children, className, src }: { children: ReactNode; className?: string; src?: string }) => (
  <ul className={mergeTW(`flex items-center justify-center gap-x-3 w-full overflow-auto snap-x ${className}`)}>
    {src ? (
      <li className={mergeTW(`flex-none max-w-md md:max-w-lg snap-normal snap-start py-3 ${className}`)}>
        <iframe src={extractVideoId(src) as string} className="w-full rounded-lg"></iframe>
      </li>
    ) : (
      ''
    )}
    {children}
  </ul>
);
