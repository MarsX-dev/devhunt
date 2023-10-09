'use client';

import extractVideoId from '@/utils/extractVideoId';
import mergeTW from '@/utils/mergeTW';
import { type ReactNode, useState } from 'react';
import BlurBackground from '../BlurBackground/BlurBackground';
import { ButtonHandler } from './ButtonHandler';
import { IconChevronLeft } from '@/components/Icons/IconChevronLeft';
import { IconChevronRight } from '@/components/Icons/IconChevronRight';
import { IconXmark } from '@/components/Icons';
import VideoThumbnail from './VideoThumbnail';

export const Gallery = ({
  children,
  className,
  src,
  assets,
  alt,
}: {
  children: ReactNode;
  className?: string;
  src?: string;
  alt?: string;
  assets: string[];
}) => {
  const [media, setMedia] = useState(src ? [src, ...assets] : assets);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [isZoomActive, setZoomActive] = useState(false);

  const handleLeftSide = () => {
    if (currentIdx === 0) {
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
        onClick={() => {
          setZoomActive(true);
        }}
      >
        {src ? (
          <li className={mergeTW(`flex-none w-[459px] h-[220px] snap-start pointer-events-none ${className}`)}>
            {media[0].includes('youtube') || media[0].includes('youtu.be') ? (
              <VideoThumbnail src={`https://img.youtube.com/vi/${extractVideoId(src as string)?.id}/mqdefault.jpg`} />
            ) : (
              <video controls className="w-[459px] h-[220px] rounded-lg">
                <source src={src} />
              </video>
            )}
          </li>
        ) : (
          ''
        )}
        {children}
      </ul>
      {isZoomActive ? (
        <div>
          <div className="fixed z-40 inset-0 px-4 flex items-center justify-center w-full h-full zoom">
            <ButtonHandler
              className="absolute z-20 top-4 bg-white text-slate-800 right-4 my-auto md:right-8"
              onClick={() => {
                setZoomActive(false);
              }}
            >
              <IconXmark />
            </ButtonHandler>
            <ul className="relative flex-1 max-w-5xl">
              <li className="h-full">
                {(currentIdx === 0 && media[currentIdx].includes('youtube')) ||
                media[0].includes('youtu.be') ||
                media[currentIdx].includes('.mp4') ? (
                  media[0].includes('youtube') || media[0].includes('youtu.be') ? (
                    <iframe
                      loading="lazy"
                      src={extractVideoId(src as string)?.embed as string}
                      className="rounded-lg w-full h-full aspect-[3/2]"
                    ></iframe>
                  ) : (
                    <video controls className="w-full">
                      <source src={src} />
                    </video>
                  )
                ) : (
                  <img
                    src={media[currentIdx].replaceAll('&fit=max&w=750', '')}
                    alt={alt}
                    loading="eager"
                    className="w-full object-contain rounded-lg"
                  />
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
          <BlurBackground
            className="z-30"
            isActive={isZoomActive}
            setActive={() => {
              setZoomActive(false);
            }}
          />
        </div>
      ) : (
        ''
      )}
    </>
  );
};
