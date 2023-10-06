import { ChangeEvent, useRef } from 'react';
import Button from '../Button/Button';
import { IconLoading } from '@/components/Icons';

export default ({
  src,
  required = false,
  isLoad = false,
  onChange,
}: {
  src?: string;
  required?: boolean;
  isLoad?: boolean;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <div className="flex gap-3 items-center flex-wrap sm:gap-6">
        <label
          htmlFor="logo-upload"
          className="relative flex-none cursor-pointer w-24 h-24 rounded-full border border-slate-700 border-dashed"
        >
          {src ? <img src={src} className="w-full h-full rounded-full" /> : ''}
          {isLoad ? <IconLoading className="absolute inset-0 m-auto text-orange-500" /> : ''}
        </label>
        <div>
          <p className="text-slate-300">Tool logo</p>
          <p className="text-sm text-slate-400">Recommended size: 220x220 or 210x210 pixels</p>
        </div>
        <div className="flex items-center gap-x-2">
          <Button
            type="button"
            className=" bg-slate-800 hover:bg-slate-800/50 text-xs"
            onClick={() => (inputRef.current as HTMLElement).click()}
          >
            Select an image
          </Button>
        </div>
      </div>
      <input
        // required={required}
        ref={inputRef}
        id="logo-upload"
        name="logo-upload"
        type="file"
        className="sr-only "
        accept="image/*"
        onChange={onChange}
      />
    </div>
  );
};
