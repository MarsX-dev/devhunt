'use client';

import { IconPlus } from '@/components/Icons';
import mergeTW from '@/utils/mergeTW';
import { ChangeEvent, ReactNode, useRef } from 'react';

export const ImagesUploader = ({
  children,
  className = '',
  onChange,
  max = 3,
  files = [],
  required = false,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
  files: File[] | [];
  required?: boolean;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={mergeTW(`flex flex-wrap gap-3 ${className}`)}>
      {children}
      {files?.length < max ? (
        <label
          htmlFor="image-upload"
          className="flex-none flex items-center justify-center w-full max-w-[13rem] h-36 rounded-md overflow-hidden border border-dashed border-slate-700 cursor-pointer"
        >
          <div className="text-sm text-slate-300 space-y-1">
            <IconPlus className="mx-auto w-6 h-6" />
            Upload
          </div>
        </label>
      ) : (
        ''
      )}
      <input
        ref={inputRef}
        required={required}
        id="image-upload"
        name="file-upload"
        type="file"
        className="sr-only"
        accept="image/*"
        onChange={onChange}
      />
    </div>
  );
};
