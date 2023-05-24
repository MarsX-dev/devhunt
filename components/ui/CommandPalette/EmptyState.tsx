export default () => (
  <div className="space-y-2 text-center text-sm py-10 text-slate-300">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-6 h-6 mx-auto"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
      />
    </svg>
    <h4 className="font-medium">No results found</h4>
    <p className="text-slate-400">No products found for this search term.</p>
    <a href="/" className="inline-block bg-slate-800/70 hover:bg-slate-800 rounded-md px-4 py-2 duration-150">
      Find more tools
    </a>
  </div>
)
