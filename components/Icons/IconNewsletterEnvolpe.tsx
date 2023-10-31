import mergeTW from '@/utils/mergeTW';

export const IconNewsletterEnvolpe = ({ className = '' }: { className?: string }) => (
  <svg
    className={mergeTW('mx-auto border border-slate-700 rounded-full', className)}
    width="60"
    height="60"
    viewBox="0 0 60 60"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="60" height="60" rx="30" fill="#0F172A" />
    <path
      d="M9 23.34V40.5C9 42.0913 9.63214 43.6174 10.7574 44.7426C11.8826 45.8679 13.4087 46.5 15 46.5H45C46.5913 46.5 48.1174 45.8679 49.2426 44.7426C50.3679 43.6174 51 42.0913 51 40.5V23.34L33.144 34.326C32.1985 34.9077 31.1101 35.2157 30 35.2157C28.8899 35.2157 27.8015 34.9077 26.856 34.326L9 23.34Z"
      fill="url(#paint0_linear_248_446)"
    />
    <path
      d="M51 19.816V19.5C51 17.9087 50.3679 16.3826 49.2426 15.2574C48.1174 14.1321 46.5913 13.5 45 13.5H15C13.4087 13.5 11.8826 14.1321 10.7574 15.2574C9.63214 16.3826 9 17.9087 9 19.5V19.816L28.428 31.772C28.9008 32.0629 29.4449 32.2168 30 32.2168C30.5551 32.2168 31.0992 32.0629 31.572 31.772L51 19.816Z"
      fill="url(#paint1_linear_248_446)"
    />
    <defs>
      <linearGradient id="paint0_linear_248_446" x1="30" y1="23.34" x2="30" y2="46.5" gradientUnits="userSpaceOnUse">
        <stop stop-color="#334155" />
        <stop offset="1" stop-color="#64748B" stop-opacity="0" />
      </linearGradient>
      <linearGradient id="paint1_linear_248_446" x1="30" y1="13.5" x2="30" y2="32.2168" gradientUnits="userSpaceOnUse">
        <stop stop-color="#334155" />
        <stop offset="1" stop-color="#64748B" stop-opacity="0" />
      </linearGradient>
    </defs>
  </svg>
);
