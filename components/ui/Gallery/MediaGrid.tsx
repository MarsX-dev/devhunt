'use client';

import { ChevronLeft, ChevronRight, Play, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type TouchEvent } from 'react';
import { createPortal } from 'react-dom';
import extractVideoId from '@/utils/extractVideoId';
import { usableVideoUrl } from '@/utils/demoVideo';
import mergeTW from '@/utils/mergeTW';

type Media = { kind: 'image'; src: string } | { kind: 'youtube'; id: string; embed: string } | { kind: 'video'; src: string };

const MAX_TILES = 3;

// Uploaded screenshots are imgix URLs; older ones were saved with "&fit=max&w=750" baked in.
const fullRes = (url: string) => url.replaceAll('&fit=max&w=750', '');
const sized = (url: string, w: number) => {
  const base = fullRes(url);
  return `${base}${base.includes('?') ? '&' : '?'}w=${w}`;
};
const isVideoFile = (url: string) => /\.(mp4|webm|mov|m4v|ogg)(\?|#|$)/i.test(url);

const toMedia = (images: string[], video?: string | null): Media[] => {
  const items: Media[] = [];
  const src = usableVideoUrl(video);
  if (src) {
    const yt = extractVideoId(src);
    items.push(yt ? { kind: 'youtube', id: yt.id, embed: yt.embed } : { kind: 'video', src });
  }
  images.filter(Boolean).forEach(src => items.push({ kind: 'image', src }));
  return items;
};

const PlayBadge = ({ large = false }: { large?: boolean }) => (
  <span
    className={`absolute inset-0 m-auto flex items-center justify-center rounded-full bg-orange-600 text-white shadow-lg shadow-black/40 ring-4 ring-white/20 duration-200 group-hover:scale-110 group-hover:bg-orange-500 ${
      large ? 'h-16 w-16' : 'h-11 w-11'
    }`}
  >
    <Play className={`${large ? 'h-7 w-7' : 'h-5 w-5'} translate-x-[1px] fill-current`} aria-hidden="true" />
  </span>
);

const YouTubeThumb = ({ id, alt }: { id: string; alt: string }) => {
  // maxresdefault doesn't exist for every video; hqdefault always does.
  const [src, setSrc] = useState(`https://img.youtube.com/vi/${id}/maxresdefault.jpg`);
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className="absolute inset-0 h-full w-full object-cover duration-300 group-hover:scale-[1.02]"
      onLoad={e => {
        // A missing maxres thumbnail comes back as a 120x90 placeholder, not an error.
        if (e.currentTarget.naturalWidth <= 120 && src.includes('maxres')) setSrc(`https://img.youtube.com/vi/${id}/hqdefault.jpg`);
      }}
      onError={() => {
        if (src.includes('maxres')) setSrc(`https://img.youtube.com/vi/${id}/hqdefault.jpg`);
      }}
    />
  );
};

const Tile = ({
  item,
  alt,
  index,
  total,
  big,
  more,
  className,
  onOpen,
}: {
  item: Media;
  alt: string;
  index: number;
  total: number;
  big: boolean;
  more: number;
  className?: string;
  onOpen: (idx: number) => void;
}) => {
  const label =
    item.kind === 'image'
      ? `Open media ${index + 1} of ${total}${more ? ` (+${more} more)` : ''}`
      : `Play demo video${more ? ` (+${more} more)` : ''}`;
  return (
    <button
      type="button"
      onClick={() => {
        onOpen(index);
      }}
      aria-label={label}
      className={mergeTW(
        `group relative block w-full overflow-hidden rounded-xl bg-slate-800/60 ring-1 ring-slate-800 cursor-zoom-in duration-200 hover:ring-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${className}`,
      )}
    >
      {item.kind === 'image' ? (
        <img
          src={sized(item.src, big ? 1200 : 750)}
          alt={alt}
          loading={index === 0 ? 'eager' : 'lazy'}
          className="absolute inset-0 h-full w-full object-cover object-top duration-300 group-hover:scale-[1.02]"
        />
      ) : item.kind === 'youtube' ? (
        <YouTubeThumb id={item.id} alt={`${alt} demo video`} />
      ) : (
        <span className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-950" />
      )}
      {item.kind !== 'image' && (
        <>
          <span className="absolute inset-0 bg-black/20 duration-200 group-hover:bg-black/10" />
          <PlayBadge large={big} />
        </>
      )}
      {more > 0 ? (
        <span className="absolute inset-0 flex items-center justify-center bg-slate-950/70 text-2xl font-semibold text-white duration-200 group-hover:bg-slate-950/60">
          +{more}
        </span>
      ) : (
        <span className="absolute inset-0 bg-slate-950/0 duration-200 group-hover:bg-slate-950/10" />
      )}
    </button>
  );
};

const Lightbox = ({
  items,
  alt,
  index,
  setIndex,
  close,
}: {
  items: Media[];
  alt: string;
  index: number;
  setIndex: (i: number) => void;
  close: () => void;
}) => {
  const closeRef = useRef<HTMLButtonElement>(null);
  const touchX = useRef<number | null>(null);
  const many = items.length > 1;
  const go = useCallback(
    (step: number) => {
      setIndex((index + step + items.length) % items.length);
    },
    [index, items.length, setIndex],
  );

  // Capture phase so the tool preview modal behind doesn't also react (← → switch tools there).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight' && many) go(1);
      else if (e.key === 'ArrowLeft' && many) go(-1);
      else return;
      e.preventDefault();
      e.stopPropagation();
    };
    window.addEventListener('keydown', onKey, true);
    return () => {
      window.removeEventListener('keydown', onKey, true);
    };
  }, [close, go, many]);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus?.({ preventScroll: true });
    };
  }, []);

  const item = items[index];
  const onTouchStart = (e: TouchEvent) => {
    touchX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: TouchEvent) => {
    if (touchX.current === null || !many) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
  };
  const stop = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
  };
  const navBtn =
    'absolute top-1/2 z-10 -translate-y-1/2 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20 backdrop-blur duration-150 hover:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500';

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${alt} media`}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 backdrop-blur-sm"
      onClick={close}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <button
        ref={closeRef}
        type="button"
        aria-label="Close"
        onClick={close}
        className="absolute right-3 top-3 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-900 shadow-lg duration-150 hover:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 sm:right-5 sm:top-5"
      >
        <X className="h-7 w-7" strokeWidth={2.5} aria-hidden="true" />
      </button>
      {many && (
        <div
          className="absolute left-1/2 top-5 z-20 -translate-x-1/2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium tabular-nums text-white ring-1 ring-white/15"
          aria-live="polite"
        >
          {index + 1} / {items.length}
        </div>
      )}
      {many && (
        <button
          type="button"
          aria-label="Previous"
          onClick={e => {
            stop(e);
            go(-1);
          }}
          className={`${navBtn} left-2 sm:left-5`}
        >
          <ChevronLeft className="h-8 w-8" aria-hidden="true" />
        </button>
      )}
      {many && (
        <button
          type="button"
          aria-label="Next"
          onClick={e => {
            stop(e);
            go(1);
          }}
          className={`${navBtn} right-2 sm:right-5`}
        >
          <ChevronRight className="h-8 w-8" aria-hidden="true" />
        </button>
      )}
      <div className="flex h-full w-full items-center justify-center px-2 pb-6 pt-20 sm:px-24 sm:pb-10">
        {item.kind === 'image' ? (
          <img
            key={item.src}
            src={fullRes(item.src)}
            alt={alt}
            onClick={stop}
            className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
          />
        ) : item.kind === 'youtube' ? (
          <div className="aspect-video w-full max-w-6xl max-h-full" onClick={stop}>
            <iframe
              key={item.id}
              src={`${item.embed}?autoplay=1&rel=0`}
              title={`${alt} demo video`}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              className="h-full w-full rounded-lg bg-black"
            />
          </div>
        ) : isVideoFile(item.src) ? (
          <video
            key={item.src}
            src={item.src}
            controls
            autoPlay
            playsInline
            onClick={stop}
            className="max-h-full max-w-full rounded-lg bg-black"
          />
        ) : (
          <a
            href={item.src}
            target="_blank"
            rel="noopener noreferrer nofollow"
            onClick={stop}
            className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-5 py-3 font-medium text-white hover:bg-orange-500"
          >
            <Play className="h-5 w-5 fill-current" aria-hidden="true" /> Watch the demo video
          </a>
        )}
      </div>
    </div>,
    document.body,
  );
};

// Tool media: up to 3 tiles (demo video first), a "+N" on the last one when there are more.
// Every item opens in a full-screen lightbox.
export const MediaGrid = ({ images, video, alt }: { images: string[]; video?: string | null; alt: string }) => {
  const items = toMedia(images ?? [], video);
  const [open, setOpen] = useState<number | null>(null);
  const close = useCallback(() => {
    setOpen(null);
  }, []);
  if (!items.length) return null;

  const shown = items.slice(0, MAX_TILES);
  const more = items.length - shown.length;
  const tile = (idx: number, className: string, big: boolean) => (
    <Tile
      key={idx}
      item={shown[idx]}
      alt={alt}
      index={idx}
      total={items.length}
      big={big}
      more={idx === shown.length - 1 ? more : 0}
      className={className}
      onOpen={setOpen}
    />
  );

  return (
    <>
      {shown.length === 1 ? (
        tile(0, 'aspect-video', true)
      ) : shown.length === 2 ? (
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {tile(0, 'aspect-[16/10]', false)}
          {tile(1, 'aspect-[16/10]', false)}
        </div>
      ) : (
        // Phones: big tile on top, two below. Wider: big tile ~70%, two stacked in the remaining ~30%.
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-[7fr_3fr] sm:grid-rows-2 sm:gap-3">
          {tile(0, 'col-span-2 aspect-[16/10] sm:col-span-1 sm:row-span-2', true)}
          {tile(1, 'aspect-[16/10] sm:aspect-auto sm:h-full', false)}
          {tile(2, 'aspect-[16/10] sm:aspect-auto sm:h-full', false)}
        </div>
      )}
      {open !== null && <Lightbox items={items} alt={alt} index={open} setIndex={setOpen} close={close} />}
    </>
  );
};

export default MediaGrid;
