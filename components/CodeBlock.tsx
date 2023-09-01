import Prism from 'prismjs';
import 'prismjs/components/prism-jsx';
import { MouseEventHandler, useEffect, useState } from 'react';
import { IconClipboard } from './Icons';

type Props = {
  children?: string;
  onCopy?: () => void;
};

export default (props: Props) => {
  const { children, onCopy = () => {} } = props;

  const [copyState, setCopyState] = useState<boolean>(false);

  // Copy the link
  const handleCopy: MouseEventHandler<HTMLButtonElement> = () => {
    navigator.clipboard.writeText(children || '').then(
      function () {
        setCopyState(true);
        onCopy();
      },
      function (err) {
        console.error('Async: Could not copy text: ', err);
      },
    );
  };

  useEffect(() => {
    Prism.highlightAll();
  }, []);

  useEffect(() => {
    if (copyState) {
      setTimeout(() => setCopyState(false), 3000);
    }
  }, [copyState]);

  return (
    <div className="relative">
      <button
        className={`absolute top-4 right-4 text-gray-300 hover:text-gray-400 duration-150 bg-slate-600 rounded-lg p-1 ${
          copyState ? 'text-orange-600 pointer-events-none' : ''
        }`}
        onClick={handleCopy}
      >
        <IconClipboard />
        {copyState ? (
          <div className="absolute -top-12 -left-3 px-2 py-1.5 rounded-xl bg-orange-600 font-semibold text-white text-[10px] after:absolute after:inset-x-0 after:mx-auto after:top-[22px] after:w-2 after:h-2 after:bg-orange-600 after:rotate-45">
            Copied
          </div>
        ) : (
          ''
        )}
      </button>
      <pre className="bg-slate-900">
        <code className="lang-jsx">{children}</code>
      </pre>
    </div>
  );
};
