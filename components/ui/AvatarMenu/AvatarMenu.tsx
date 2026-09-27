import { useEffect, useRef, useState } from 'react';
import Button from '../Button/Button';
import LinkItem from '../Link/LinkItem';
import { Session } from '@supabase/supabase-js';
import Avatar from '../Avatar/Avatar';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/components/supabase/provider';
import { prefetchRoute } from '@/utils/prefetch';

type Props = {
  onLogout?: () => void;
  session: Session | null;
};

// Zenvoice page where makers download invoices for their paid launches.
const INVOICE_URL = 'https://zenvoice.io/p/65d6370232047df47b4c142b';

// Avtar with darpdown menu
export default ({ onLogout, session }: Props) => {
  const [state, setState] = useState(false);
  const profileRef = useRef<HTMLButtonElement>(null);
  const isLoggin = session && session.user;

  const { user, supabase } = useSupabase();
  const router = useRouter();
  // "Download invoice" for makers who paid for a launch. Checked once, when the menu first opens
  // (not on every page view).
  const [hasPaid, setHasPaid] = useState<boolean | null>(null);
  useEffect(() => {
    if (!state || hasPaid !== null || !session?.user.id) return;
    void supabase
      .from('products')
      .select('id')
      .eq('owner_id', session.user.id)
      .eq('isPaid', true)
      .limit(1)
      .then(({ data }) => setHasPaid(!!data?.length));
  }, [state, hasPaid, session?.user.id]);
  // The menu's links are hidden until it opens, so Next never prefetched them: do it on hover/focus,
  // and on open for touch screens (no hover).
  const prefetchMenu = () => navigation.forEach(item => item.path && prefetchRoute(router, item.path));

  const navigation = [
    { title: 'Profile', path: isLoggin && user ? `/@${user.username}` : '' },
    { title: 'My tools', path: '/account/tools' },
    { title: 'Edit profile', path: '/account/details' },
  ];

  useEffect(() => {
    const handleDropDown = (e: MouseEvent) => {
      if (profileRef.current && !(profileRef.current as HTMLElement).contains(e.target as Node)) setState(false);
    };
    document.addEventListener('click', handleDropDown);
  }, []);

  return isLoggin ? (
    <div className="relative">
      <button
        ref={profileRef}
        className=" outline-none rounded-full ring-offset-2 ring-slate-700 lg:focus:ring-2"
        onClick={() => {
          if (!state) prefetchMenu();
          setState(!state);
        }}
        onMouseEnter={prefetchMenu}
        onFocus={prefetchMenu}
      >
        {user?.avatar_url ? (
          <Avatar src={user.avatar_url} className="h-8 w-8" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-l from-sky-500 via-indigo-500 to-indigo-500"></div>
        )}
      </button>
      <ul className={`bg-slate-800 top-10 right-0 absolute rounded-lg w-52 shadow-md mt-1 space-y-0 overflow-hidden ${state ? '' : 'hidden'}`}>
        {navigation.map((item, idx) => (
          <li key={idx}>
            <LinkItem
              href={item.path}
              className="block w-full py-2 px-3 font-normal text-slate-300 text-left rounded-none hover:bg-slate-700"
            >
              {item.title}
            </LinkItem>
          </li>
        ))}
        {hasPaid && (
          <li>
            <a
              href={INVOICE_URL}
              target="_blank"
              rel="noopener"
              className="block w-full py-2 px-3 font-normal text-slate-300 text-left rounded-none hover:bg-slate-700"
            >
              Download invoice ↗
            </a>
          </li>
        )}
        <Button
          onClick={onLogout}
          className="block w-full py-2 px-3 font-normal text-slate-300 text-left rounded-none border-t border-slate-700 bg-transparent hover:bg-slate-700"
        >
          Logout
        </Button>
      </ul>
    </div>
  ) : (
    <></>
  );
};
