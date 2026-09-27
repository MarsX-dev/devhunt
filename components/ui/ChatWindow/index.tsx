import johnPicture from '@/public/johnrush.jpeg';
import Image from 'next/image';

// Founder badge pinned to the bottom-right corner. Sits flush with the
// viewport edge on every screen size, and clears the iOS home indicator.
export default function FounderBadge() {
  return (
    <a
      href="https://x.com/johnrush"
      target="_blank"
      rel="noopener"
      aria-label="Built by John Rush, follow on X"
      className="group fixed bottom-0 right-0 z-10 flex items-center gap-1.5 rounded-tl-xl border-l border-t border-slate-700/80 bg-slate-900/90 py-1 pl-2.5 pr-1.5 shadow-[0_-4px_24px_-8px_rgba(249,115,22,0.35)] backdrop-blur-md duration-200 hover:border-orange-500/60 hover:bg-slate-800/90"
      style={{ paddingBottom: 'max(0.25rem, env(safe-area-inset-bottom))' }}
    >
      <span className="text-[11px] font-bold text-orange-400 duration-200 group-hover:text-orange-300">John Rush</span>
      <span className="relative flex-none rounded-full p-px bg-gradient-to-br from-orange-400 to-orange-600 duration-300 group-hover:rotate-12 group-hover:scale-110">
        <Image
          src={johnPicture}
          width={40}
          height={40}
          className="h-5 w-5 rounded-full object-cover ring-1 ring-slate-900"
          alt=""
        />
        <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border-[1.5px] border-slate-900 bg-emerald-400" aria-hidden />
      </span>
    </a>
  );
}
