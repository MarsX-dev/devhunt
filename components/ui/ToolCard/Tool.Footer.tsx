import mergeTW from '@/utils/mergeTW';
import { ReactNode } from 'react';

export default ({ className, children }: { className?: string; children?: ReactNode }) => (
  <div className={mergeTW(`flex items-center gap-x-3 pt-1 ${className}`)}>{children}</div>
);
