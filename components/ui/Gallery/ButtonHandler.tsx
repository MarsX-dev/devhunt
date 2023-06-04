import mergeTW from '@/utils/mergeTW';
import { HTMLAttributes, ReactNode } from 'react';

interface Props extends HTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
}

export const ButtonHandler = ({ children, className, ...props }: Props) => (
  <button
    {...props}
    className={mergeTW(
      `w-12 h-12 flex items-center justify-center rounded-full bg-black/50 text-white/75 backdrop-blur-lg transition hover:bg-black/75 hover:text-white focus:outline-none ${className}`,
    )}
  >
    {children}
  </button>
);
