'use client';

import Logo from '@/components/ui/ToolCard/Tool.Logo';
import Name from '@/components/ui/ToolCard/Tool.Name';
import Tags from '@/components/ui/ToolCard/Tool.Tags';
import Title from '@/components/ui/ToolCard/Tool.Title';
import Votes from '@/components/ui/ToolCard/Tool.Votes';
import ToolFooter from '@/components/ui/ToolCard/Tool.Footer';
import ToolViews from '@/components/ui/ToolCard/Tool.views';

export default () => {
  return (
    <li className="py-3 animate-pulse bg-slate-800 rounded-xl p-4">
      <div className="py-4 rounded-2xl flex items-start">
        <div className="w-full flex items-center gap-x-4">
          <div className="flex-none rounded-full w-16 h-16 bg-slate-700"></div>
          <div className="w-full space-y-1">
            <div className="w-28 h-4 rounded-full bg-slate-700"></div>
            <div className="w-48 h-5 rounded-full bg-slate-700"></div>
            <ToolFooter>
              <div className="w-20 h-4 rounded-full bg-slate-700"></div>
              <div className="w-20 h-4 rounded-full bg-slate-700"></div>
              <div className="w-20 h-4 rounded-full bg-slate-700"></div>
            </ToolFooter>
          </div>
        </div>
        <div className={`flex-1 self-center flex justify-end duration-1000 delay-150`}>
          <div className="rounded-md bg-slate-700 w-9 h-9"></div>
        </div>
      </div>
    </li>
  );
};
