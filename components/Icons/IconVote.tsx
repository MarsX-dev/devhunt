import mergeTW from '@/utils/mergeTW'

export const IconVote = ({ className = '' }: { className?: string }) => (
  <svg className={mergeTW(`w-5 h-5 ${className}`)} viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M3.7619 19.0001H21.7619C21.9441 18.9995 22.1228 18.9493 22.2786 18.8547C22.4344 18.7602 22.5614 18.6249 22.6461 18.4636C22.7307 18.3022 22.7698 18.1207 22.759 17.9388C22.7482 17.7569 22.688 17.5814 22.5849 17.4311L13.5849 4.43111C13.2119 3.89211 12.3139 3.89211 11.9399 4.43111L2.9399 17.4311C2.83572 17.581 2.77463 17.7567 2.76326 17.9389C2.75189 18.1211 2.79068 18.303 2.87541 18.4647C2.96014 18.6264 3.08757 18.7619 3.24386 18.8562C3.40015 18.9506 3.57932 19.0004 3.7619 19.0001Z"
      fill="currentColor"
    />
    <defs>
      <linearGradient
        id="paint0_linear_2861_8660"
        x1="12.761"
        y1="4.02686"
        x2="12.9998"
        y2="46.5"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#CBD5E1" />
        <stop offset="1" stopColor="#CBD5E1" stopOpacity="0" />
      </linearGradient>
    </defs>
  </svg>
)
