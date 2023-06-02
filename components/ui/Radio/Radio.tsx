import mergeTW from '@/utils/mergeTW';
import { HTMLAttributes } from 'react';

interface Props extends HTMLAttributes<HTMLInputElement> {
  className?: string;
  id?: string;
  name?: string;
  checked?: boolean;
  validate?: {};
  required?: boolean;
  value?: any;
}

export default ({ className = '', validate, ...props }: Props) => (
  <input
    {...props}
    {...validate}
    type="radio"
    className={mergeTW(
      `form-radio border-gray-700 text-orange-500 ring-offset-gray-400 ring-gray-800 focus:ring-orange-500 bg-gray-700 checked:bg-gray-700 duration-150 ${className}`,
    )}
  />
);
