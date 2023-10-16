import mergeTW from '@/utils/mergeTW';
import { CheckCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { ReactNode } from 'react';

export default ({
  icon,
  context,
  className = '',
  variant = 'info',
}: {
  variant?: 'info' | 'success' | 'danger' | 'warning';
  icon?: ReactNode;
  context: ReactNode | string | HTMLElement;
  className?: string;
}) => {
  const parentVariant = {
    info: 'border-l-blue-500',
    success: 'border-l-green-500',
    danger: 'border-l-red-500',
    warning: 'border-l-amber-500',
  };

  const colorsVariant = {
    info: 'text-blue-500',
    success: 'text-green-500',
    danger: 'text-red-500',
    warning: 'text-amber-500',
  };

  const iconVariant = {
    info: <InformationCircleIcon className={`w-6 h-6 ${colorsVariant.info}`} />,
    success: <CheckCircleIcon className={`w-6 h-6 ${colorsVariant.success}`} />,
    danger: <XCircleIcon className={`w-6 h-6 ${colorsVariant.danger}`} />,
    warning: <ExclamationTriangleIcon className={`w-6 h-6 ${colorsVariant.warning}`} />,
  };

  return (
    <div
      className={mergeTW(
        `flex justify-between p-4 rounded-md bg-slate-800 border border-slate-700 border-l-4 ${parentVariant[variant]} ${className}`,
      )}
    >
      <div className="flex gap-3">
        <div>{icon || iconVariant[variant]}</div>
        <p className={`${colorsVariant[variant]} sm:text-sm`} dangerouslySetInnerHTML={{ __html: context as any }}></p>
      </div>
    </div>
  );
};
