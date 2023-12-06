'use client';

import Brand from '../Brand/Brand';

export default () => {
  const footerNavs = [
    {
      href: '/the-story',
      name: 'About',
    },
    {
      href: 'https://github.com/MarsX-dev/devhunt',
      name: 'GitHub Repository',
    },
    {
      href: '/blog',
      name: 'Blog',
    },
    {
      href: 'https://twitter.com/johnrushx',
      name: 'Contact',
    },
    { name: 'OSS Friends', href: '/oss-friends' },
    { name: 'NextJS Starter', href: 'https://nextjsstarter.com/?' },
  ];

  const usedTools = [
    { title: 'FloatUI', url: 'https://www.floatui.com/' },
    { title: 'Sensorpro', url: 'https://sensorpro.eu/' },
    { title: 'Usermaven', url: 'https://usermaven.com/' },
    { title: 'Vercel', url: 'https://vercel.com/' },
    { title: 'Supabase', url: 'https://supabase.com/' },
    { title: 'UnicornPlatform', url: 'https://unicornplatform.com/' },
  ];

  const builtBy = [
    { title: '@johnrushx', url: 'https://twitter.com/johnrushx' },
    { title: '@sidi_jeddou_dev', url: 'https://twitter.com/sidi_jeddou_dev' },
    { title: '@vitalik_may', url: 'https://twitter.com/vitalik_may' },
    { title: '@BotanMan', url: 'https://twitter.com/BotanMan' },
    { title: '@chris_byrne', url: 'https://twitter.com/chris_byrne' },
    { title: 'see all', url: '/the-story' },
  ];

  return (
    <footer className="mt-20 text-slate-400 bg-slate-900 px-4 py-5 max-w-screen-xl mx-auto md:px-8">
      <div className="border-t border-slate-800 pt-8">
        <div className="max-w-lg sm:mx-auto sm:text-center">
          <Brand className="sm:m-auto" />
          <p className="leading-relaxed mt-3 text-slate-300 text-[15px]">
            A launchpad for dev tools, built by developers. Open-source and fair.
          </p>
        </div>
        <ul className="text-sm font-medium items-center justify-center mt-8 space-y-5 sm:flex sm:space-x-4 sm:space-y-0">
          {footerNavs.map((item, idx) => (
            <li>
              <a key={idx} href={item.href} className="block hover:text-slate-200">
                {item.name}
              </a>
            </li>
          ))}
        </ul>
        <div className="mt-8 items-center justify-between sm:flex">
          <div className="mt-4 sm:mt-0">
            &copy; 2023 Dev Hunt. Member of{' '}
            <a className=" text-slate-100 hover:text-slate-50" href="https://www.marsx.dev/">
              MarsX.Dev
            </a>{' '}
            family. <br />
            <div className="text-xs pt-2">
              Uses{' '}
              {usedTools.map((t, i) => (
                <a className=" text-slate-200 hover:text-slate-50" href={t.url} rel="nofollow noopener noreferrer" target="_blank">
                  {t.title}
                  {usedTools.length - 1 === i ? '' : ', '}
                </a>
              ))}
              {'.'}
            </div>
            <div className="text-xs pt-2">
              Built by{' '}
              {builtBy.map((t, i) => (
                <a className=" text-slate-200 hover:text-slate-50" href={t.url} rel="nofollow noopener noreferrer" target="_blank">
                  {t.title}
                  {builtBy.length - 1 === i ? '' : ', '}
                </a>
              ))}
              {'.'}
            </div>
            <div className="text-xs pt-2">
              <a href="https://devhunt.openstatus.dev/">Status page</a>
            </div>
            <a href="https://usermaven.com/?utm_source=badge" className="mt-5 block" rel="nofollow">
              <img
                className="w-32"
                src="https://usermaven.com/img/badge-dark.png"
                alt="Usermaven | Website analytics and product insights"
              />
            </a>
          </div>
          <div className="mt-6 sm:mt-0">
            <ul className="flex items-center space-x-4">
              <li>
                <a href="https://twitter.com/devhunt_">
                  <svg className="svg-icon w-6 h-6 text-slate-500 hover:text-slate-300" viewBox="0 0 20 20">
                    <path
                      fill="none"
                      d="M18.258,3.266c-0.693,0.405-1.46,0.698-2.277,0.857c-0.653-0.686-1.586-1.115-2.618-1.115c-1.98,0-3.586,1.581-3.586,3.53c0,0.276,0.031,0.545,0.092,0.805C6.888,7.195,4.245,5.79,2.476,3.654C2.167,4.176,1.99,4.781,1.99,5.429c0,1.224,0.633,2.305,1.596,2.938C2.999,8.349,2.445,8.19,1.961,7.925C1.96,7.94,1.96,7.954,1.96,7.97c0,1.71,1.237,3.138,2.877,3.462c-0.301,0.08-0.617,0.123-0.945,0.123c-0.23,0-0.456-0.021-0.674-0.062c0.456,1.402,1.781,2.422,3.35,2.451c-1.228,0.947-2.773,1.512-4.454,1.512c-0.291,0-0.575-0.016-0.855-0.049c1.588,1,3.473,1.586,5.498,1.586c6.598,0,10.205-5.379,10.205-10.045c0-0.153-0.003-0.305-0.01-0.456c0.7-0.499,1.308-1.12,1.789-1.827c-0.644,0.28-1.334,0.469-2.06,0.555C17.422,4.782,17.99,4.091,18.258,3.266"
                    ></path>
                  </svg>
                </a>
              </li>
            </ul>
          </div>
        </div>
        <style jsx>{`
          .svg-icon path,
          .svg-icon polygon,
          .svg-icon rect {
            fill: currentColor;
          }
        `}</style>
      </div>
    </footer>
  );
};
