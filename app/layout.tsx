import Navbar from '@/components/ui/Navbar';
import './globals.css';
import './prismjs-theme.css';
import { Inter } from 'next/font/google';
import Script from 'next/script';

import SupabaseListener from '@/components/supabase/listener';
import SupabaseProvider from '@/components/supabase/provider';
import { createServerClient } from '@/utils/supabase/server';
import type { Database, Profile } from '@/utils/supabase/types';
import type { SupabaseClient } from '@supabase/auth-helpers-nextjs';
import Footer from '@/components/ui/Footer/Footer';
import ProfileService from '@/utils/supabase/services/profile';
import Banner from '@/components/ui/Banner';
import ModalBannerCodeClient from '@/components/ui/ModalBannerCode/ModalBannerCodeClient';

import dynamic from 'next/dynamic';
import ProfileFormModal from '@/components/ui/ProfileFormModal';

const ChatWindow = dynamic(() => import('@/components/ui/ChatWindow'), { ssr: false });

export type TypedSupabaseClient = SupabaseClient<Database>;

declare global {
  interface Window {
    usermavenQ: any; // Replace 'any' with the appropriate type of 'usermavenQ'
  }
}

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

// do not cache this layout
export const revalidate = 0;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;
  const profileService = new ProfileService(createServerClient());
  const profile = user ? await profileService.getById(user?.id) : null;
  const profileNoCache = user ? await profileService.getByIdWithNoCache(user?.id) : null;

  return (
    <html lang="en" className="bg-slate-900">
      <head>
        {process.env.USER_MAVEN_KEY && (
          <>
            <Script
              strategy="afterInteractive"
              src="https://t.usermaven.com/lib.js"
              data-key={process.env.USER_MAVEN_KEY}
              data-tracking-host="https://events.usermaven.com"
              data-autocapture="true"
              data-privacy-policy="strict"
              defer
            ></Script>
            <Script
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
            window.usermaven = window.usermaven || (function()
            {(window.usermavenQ = window.usermavenQ || []).push(arguments)})
          `,
              }}
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
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1, user-scalable=0" />
      </head>
      <body className={inter.className} id="root">
        <main>
          <ChatWindow />
          <SupabaseProvider user={profile as Profile} session={session}>
            <SupabaseListener serverAccessToken={session?.access_token} />
            <ProfileFormModal isModalOpen={user ? (profileNoCache?.social_url == null ? true : false) : false} />
            <Banner />
            <Navbar />
            <ModalBannerCodeClient />
            {children}
            <Footer />
          </SupabaseProvider>
        </main>
      </body>
    </html>
  );
}
