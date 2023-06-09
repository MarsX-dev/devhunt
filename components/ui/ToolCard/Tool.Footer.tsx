import mergeTW from '@/utils/mergeTW';
import { ReactNode } from 'react';

export default ({ className, children }: { className?: string; children?: ReactNode }) => (
  <div className={mergeTW(`max-w-xs flex items-center justify-between ${className}`)}>{children}</div>
);
