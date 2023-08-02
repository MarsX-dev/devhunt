import { IconPlay } from '@/components/Icons';

export default ({ src }: { src: string }) => (
  <div className="w-full h-full relative">
    <img src={src} className="w-full h-full object-cover rounded-lg" loading="lazy" />
    <div className="w-12 h-10 bg-orange-600 rounded-lg text-white flex items-center justify-center absolute inset-0 m-auto">
      <IconPlay />
    </div>
  </div>
);
