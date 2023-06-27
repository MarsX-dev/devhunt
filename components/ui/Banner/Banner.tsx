import Image from 'next/image';
import upLogo from '../../../public/up-logo.svg';

export default () => (
  <div className="bg-gray-800 dark:bg-gray-900 border-b border-gray-800">
    <div className="custom-screen flex items-start gap-x-6 py-2 sm:items-center">
      <a href="https://www.marsx.dev/" target="_blank" className="flex-none pt-1">
        <Image src={upLogo} width={30} height={30} alt="Unicorn platform AI" />
      </a>
      <div className="flex-1 sm:text-center">
        <p className="text-white text-sm font-medium">
          Unicorn Platform for building landing pages is now live on{' '}
          <a
            href="https://www.producthunt.com/posts/unicorn-platform-ai"
            target="_blank"
            className="inline-flex items-center text-blue-400 hover:text-blue-600 duration-150"
          >
            Product hunt
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path
                fillRule="evenodd"
                d="M5 10a.75.75 0 01.75-.75h6.638L10.23 7.29a.75.75 0 111.04-1.08l3.5 3.25a.75.75 0 010 1.08l-3.5 3.25a.75.75 0 11-1.04-1.08l2.158-1.96H5.75A.75.75 0 015 10z"
                clipRule="evenodd"
              />
            </svg>
          </a>
        </p>
      </div>
    </div>
  </div>
);
