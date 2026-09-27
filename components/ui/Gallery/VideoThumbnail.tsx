import { IconPlay } from '@/components/Icons';

export default ({ src }: { src: string }) => (
  <div className="relative">
    <img src={src} className="aspect-video w-full rounded-lg bg-slate-800/40 object-cover" loading="lazy" />
    <div className="w-12 h-10 bg-orange-600 rounded-lg text-white flex items-center justify-center absolute inset-0 m-auto">
      <IconPlay />
    </div>
  </div>
);
