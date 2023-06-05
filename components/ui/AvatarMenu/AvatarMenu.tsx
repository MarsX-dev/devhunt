import { useEffect, useRef, useState } from 'react';
import Button from '../Button/Button';
import LinkItem from '../Link/LinkItem';
import { Session } from '@supabase/supabase-js';
import Avatar from '../Avatar/Avatar';
import { useSupabase } from '@/components/supabase/provider';

type Props = {
  onLogout?: () => void;
  session: Session | null;
};

// Avtar with darpdown menu
export default ({ onLogout, session }: Props) => {
  const [state, setState] = useState(false);
  const profileRef = useRef<HTMLButtonElement>(null);
  const isLoggin = session && session.user;

  const { user } = useSupabase();

  const navigation = [
    { title: 'Profile', path: isLoggin ? `/@${user.username}` : '' },
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
        onClick={() => setState(!state)}
      >
        {user.avatar_url ? (
          <Avatar src={user.avatar_url} />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-l from-sky-500 via-indigo-500 to-indigo-500"></div>
        )}
      </button>
      <ul className={`bg-slate-800 top-14 right-0 absolute rounded-lg w-52 shadow-md space-y-0 overflow-hidden ${state ? '' : 'hidden'}`}>
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
