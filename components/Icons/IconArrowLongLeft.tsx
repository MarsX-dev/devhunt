import mergeTW from '@/utils/mergeTW'

export const IconArrowLongLeft = ({ className = '' }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className={mergeTW(`w-5 h-5 ${className}`)}
  >
    <path
      fillRule="evenodd"
      d="M18 10a.75.75 0 01-.75.75H4.66l2.1 1.95a.75.75 0 11-1.02 1.1l-3.5-3.25a.75.75 0 010-1.1l3.5-3.25a.75.75 0 111.02 1.1l-2.1 1.95h12.59A.75.75 0 0118 10z"
      clipRule="evenodd"
    />
  </svg>
)
