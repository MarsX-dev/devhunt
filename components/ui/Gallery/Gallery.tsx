'use client';

import extractVideoId from '@/utils/extractVideoId';
import mergeTW from '@/utils/mergeTW';
import { ReactNode, useState } from 'react';
import BlurBackground from '../BlurBackground/BlurBackground';
import { ButtonHandler } from './ButtonHandler';
import { IconChevronLeft } from '@/components/Icons/IconChevronLeft';
import { IconChevronRight } from '@/components/Icons/IconChevronRight';
import { IconXmark } from '@/components/Icons';

export const Gallery = ({
  children,
  className,
  src,
  assets,
}: {
  children: ReactNode;
  className?: string;
  src?: string;
  assets: string[];
}) => {
  const [media, setMedia] = useState(src ? [src, ...assets] : assets);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [isZoomActive, setZoomActive] = useState(false);

  const handleLeftSide = () => {
    if (currentIdx == 0) {
      // If currently on the first item,
      // move to the last item (src item if it exists)
      setCurrentIdx(media.length - 1);
    } else {
      setCurrentIdx(currentIdx - 1);
    }
  };

  const handleRightSide = () => {
    if (currentIdx === media.length - 1) {
      // If currently on the last item,
      // move to the first item (src item if it exists)
      setCurrentIdx(0);
    } else {
      // Move to the next item in the carousel
      setCurrentIdx(currentIdx + 1);
    }
  };

  return (
    <>
      <ul
        className={mergeTW(`flex items-center gap-x-3 w-full overflow-auto snap-x cursor-zoom-in ${className}`)}
        onClick={() => setZoomActive(true)}
      >
        {src ? (
          <li className={mergeTW(`flex-none snap-start py-3 pointer-events-none ${className}`)}>
            <iframe src={extractVideoId(src) as string} width={448} height={252} className="rounded-lg"></iframe>
          </li>
        ) : (
          ''
        )}
        {children}
      </ul>
      {isZoomActive ? (
        <div>
          <div className="fixed z-40 inset-0 flex items-center justify-center w-full h-full zoom">
            <ul className="relative flex-1 max-w-5xl aspect-[3/2] max-h-full">
              <ButtonHandler className="absolute z-20 top-4 bg-white text-slate-800 left-4 my-auto" onClick={() => setZoomActive(false)}>
                <IconXmark />
              </ButtonHandler>
              <li className="h-full">
                {currentIdx == 0 && media[0].includes('youtube') ? (
                  <iframe src={extractVideoId(src as string) as string} className="rounded-lg w-full h-full"></iframe>
                ) : (
                  <img src={media[currentIdx]} className="w-full h-full rounded-lg object-cover" />
                )}
              </li>
              <ButtonHandler onClick={handleLeftSide} className="absolute inset-y-0 left-4 my-auto">
                <IconChevronLeft />
              </ButtonHandler>
              <ButtonHandler onClick={handleRightSide} className="absolute inset-y-0 right-4 my-auto">
                <IconChevronRight />
              </ButtonHandler>
            </ul>
          </div>
          <BlurBackground className="z-30" isActive={isZoomActive} setActive={() => setZoomActive(false)} />
        </div>
      ) : (
        ''
      )}
    </>
  );
};
