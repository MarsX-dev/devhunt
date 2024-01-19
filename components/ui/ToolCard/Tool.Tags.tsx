export default ({ items }: { items: any[] }) => (
  <div className="flex flex-wrap items-center gap-x-3 text-sm text-slate-400">
    {items.slice(0, 3).map((item, idx) => (
      <>
        <span className="flex-none">{item}</span>
        <span className="block flex-none w-1 h-1 bg-slate-500 rounded-full"></span>
      </>
    ))}
  </div>
);
