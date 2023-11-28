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
import { IconPlay } from '@/components/Icons';

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

  return (
    <>
      <ul
        className={mergeTW(`flex items-center gap-x-3 w-full overflow-auto snap-x cursor-zoom-in ${className}`)}
        onClick={() => {
          setZoomActive(true);
        }}
      >
        {src ? (
          <li className={mergeTW(`flex-none w-[459px] h-auto rounded-lg relative snap-start pointer-events-none ${className}`)}>
            {media[0].includes('youtube') || media[0].includes('youtu.be') ? (
              <VideoThumbnail src={`https://img.youtube.com/vi/${extractVideoId(src as string)?.id}/mqdefault.jpg`} />
            ) : (
              <video controls className="w-[459px] h-auto rounded-lg">
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
            <ul className="relative z-40 flex-1 max-w-5xl">
              <li className="h-full">
                {(currentIdx === 0 && media[currentIdx].includes('youtube')) ||
                media[currentIdx].includes('youtu.be') ||
                media[currentIdx].includes('.mp4') ? (
                  media[currentIdx].includes('youtube') || media[currentIdx].includes('youtu.be') ? (
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
              <div className="w-full absolute z-50 -bottom-14 h-14 inset-x-0 mx-auto flex items-center gap-x-3 overflow-x-auto sm:justify-center">
                {media.map((src, idx) => (
                  <button
                    onClick={() => {
                      console.log(idx);
                      setCurrentIdx(idx);
                    }}
                    key={idx}
                    className="flex-none w-14 h-10 hover:scale-110 duration-200"
                  >
                    {(idx === 0 && media[idx].includes('youtube')) || media[idx].includes('youtu.be') || media[idx].includes('.mp4') ? (
                      <div className="w-full h-full bg-orange-600 rounded-lg text-white flex items-center justify-center">
                        <IconPlay />
                      </div>
                    ) : (
                      <img loading="eager" src={src + 1} className="w-full h-full rounded-lg object-cover" />
                    )}
                  </button>
                ))}
              </div>
            </ul>
            <BlurBackground
              className="z-30"
              isActive={isZoomActive}
              setActive={() => {
                setZoomActive(false);
              }}
            />
          </div>
        </div>
      ) : (
        ''
      )}
    </>
  );
};
