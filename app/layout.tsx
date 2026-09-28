import Navbar from '@/components/ui/Navbar';
import InstantNav from '@/components/ui/InstantNav';
import './globals.css';
import './prismjs-theme.css';
import { Inter, JetBrains_Mono } from 'next/font/google';
import Script from 'next/script';
import { Suspense } from 'react';

import SupabaseProvider from '@/components/supabase/provider';
import type { Database } from '@/utils/supabase/types';
import type { SupabaseClient } from '@supabase/auth-helpers-nextjs';
import Footer from '@/components/ui/Footer/Footer';
import Banner from '@/components/ui/Banner';
import ModalBannerCodeClient from '@/components/ui/ModalBannerCode/ModalBannerCodeClient';

import dynamic from 'next/dynamic';
import ProfileFormModal from '@/components/ui/ProfileFormModal';
import Analytics from '@/components/Analytics';
import SponsorRails, { SponsorStrip } from '@/components/ui/Sponsors/SponsorRails';
import AdResume from '@/components/ui/Sponsors/AdResume';

const ChatWindow = dynamic(() => import('@/components/ui/ChatWindow'), { ssr: false });

export type TypedSupabaseClient = SupabaseClient<Database>;

const { title, description, ogImage } = {
  title: 'Dev Hunt – The best new Dev Tools every day.',
  description: 'A launchpad for dev tools, built by developers for developers, open source, and fair.',
  ogImage: 'https://devhunt.org/devhuntog.png?v=2',
};

export const metadata = {
  title,
  description,
  metadataBase: new URL('https://devhunt.org'),
  openGraph: {
    title,
    description,
    images: [ogImage],
    url: 'https://devhunt.org',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [ogImage],
  },
};

const inter = Inter({ subsets: ['latin'] });
const mono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', display: 'swap' });

// No per-user data here: the session is read in the browser (SupabaseProvider), so pages can be
// cached by the CDN. Reading cookies in this layout made every page render on every request.
export default function RootLayout({ children }: { children: React.ReactNode }) {

  return (
    <html lang="en" className="bg-slate-900">
      <head>
        {process.env.VERCEL_ENV === 'production' && (
          <>
            <Script
              src="https://analytic-api.marsx.dev/script.js"
              strategy="afterInteractive"
              data-website-id="505062d1-c921-4a96-ad67-63bcb082bdb2"
            />
            <Script
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
    (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", "ic87ytbm3p");
`,
              }}
            />
          </>
        )}
        <meta httpEquiv="Content-Language" content="en" />
        <meta property="og:locale" content="en_US" />
        <meta name="language" content="English" />
        <meta name="twitter:card" content="summary_large_image" />
      </head>
      <body className={`${inter.className} ${mono.variable} antialiased`} id="root">
        <main className="overflow-x-clip">
          <ChatWindow />
          <SupabaseProvider>
            <ProfileFormModal />
            <Banner />
            <SponsorStrip />
            <Navbar />
            <Suspense fallback={null}>
              <InstantNav />
            </Suspense>
            {/* It reads useSearchParams: without a Suspense boundary, every static page (home, the-story, ...)
                skipped server rendering entirely and was built in the browser (empty HTML for search engines). */}
            <Suspense fallback={null}>
              <ModalBannerCodeClient />
            </Suspense>
            {/* Rails sit in the side gutters and stick while scrolling, but stop at the footer; the min height
                keeps all 3 cards clear of it on short pages. From 1000 to 1179px the padding narrows the page
                content so 112px cards fit beside it. */}
            <div className="relative min-[1000px]:min-h-[660px] min-[1000px]:max-[1179px]:px-32">
              <SponsorRails />
              {children}
            </div>
            <Footer />
            <Analytics />
            <AdResume />
          </SupabaseProvider>
        </main>

        <Script
          src="https://tiny.devhunt.org/scripts/v2.0/main.js?v1"
          data-site-id="67d9308722e24b2f06e9986b"
          strategy="afterInteractive"
          async
        />
      </body>
    </html>
  );
}
