'use client';
import Script from 'next/script';
import { usePathname } from 'next/navigation';

export default () => {
  const pathname = usePathname();
  return pathname?.includes('/account/tools/activate-launch') ? (
    <Script strategy="lazyOnload" src="https://app.rapidforms.co/embed/index.js" />
  ) : (
    <></>
  );
};
