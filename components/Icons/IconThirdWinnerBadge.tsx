import mergeTW from '@/utils/mergeTW';

export const IconThirdWinnerBadge = ({
  w = '60',
  h = '60',
  className = '',
}: {
  w?: string | number;
  h?: string | number;
  className?: string;
}) => (
  <svg className={mergeTW(className)} width={w} height={h} viewBox="0 0 123 222" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g filter="url(#filter0_d_3_133)">
      <path
        d="M4.74213 8.1304C4.74213 4.35744 7.80072 1.29886 11.5737 1.29886H100.826C104.599 1.29886 107.657 4.35745 107.657 8.13041V21.8187C107.657 25.5916 104.599 28.6502 100.826 28.6502H95.1489V14.2792H17.2506V28.6502H11.5737C7.80072 28.6502 4.74213 25.5916 4.74213 21.8187V8.1304Z"
        fill="#FFEEB0"
      />
      <path
        d="M4.74213 9.85284C4.74213 6.07988 7.80072 3.0213 11.5737 3.0213H100.826C104.599 3.0213 107.657 6.07989 107.657 9.85285V23.5411C107.657 27.3141 104.599 30.3727 100.826 30.3727H95.1489V16.0016H17.2506V30.3727H11.5737C7.80072 30.3727 4.74213 27.3141 4.74213 23.5411V9.85284Z"
        fill="#F4CC3F"
      />
      <path d="M17.2589 15.8418H95.1407V70.9967L56.1998 98.3182L17.2589 70.9967V15.8418Z" fill="#2874BA" />
      <mask id="mask0_3_133" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="17" y="15" width="79" height="84">
        <path d="M17.4235 15.8418H95.2693V71.0058L56.3464 98.3182L17.4235 71.0058V15.8418Z" fill="#2874BA" />
      </mask>
      <g mask="url(#mask0_3_133)">
        <rect x="41.4398" y="-16.8963" width="29.8133" height="115.214" fill="#2D4071" />
      </g>
      <rect x="49.7095" y="83.8596" width="12.5167" height="21.3248" rx="6.25836" fill="#C09525" />
      <circle cx="55.9679" cy="155.148" r="54.9345" fill="url(#paint0_linear_3_133)" />
      <circle cx="55.9679" cy="155.148" r="42.8814" fill="#705100" />
      <mask id="mask1_3_133" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="15" y="117" width="87" height="87">
        <circle cx="58.5639" cy="160.037" r="42.9812" fill="#C28B37" />
      </mask>
      <g mask="url(#mask1_3_133)">
        <circle cx="55.9679" cy="155.148" r="42.9812" fill="#E3A504" />
      </g>
      <circle cx="56.5482" cy="155.457" r="35.3099" fill="#C18222" />
      <path
        d="M56.5481 127.037L64.8732 143.974L81.5234 146.091L70.0903 159.133L73.1983 177.848L56.5481 169.38L39.8979 177.848L43.0337 159.133L31.5728 146.091L48.223 143.974L56.5481 127.037Z"
        fill="url(#paint1_linear_3_133)"
      />
      <path
        d="M56.9968 126.816L56.5481 125.903L56.0994 126.816L47.893 143.512L31.5097 145.595L30.5757 145.714L31.1972 146.421L42.5013 159.284L39.4048 177.766L39.241 178.744L40.1246 178.294L56.5481 169.941L72.9716 178.294L73.8537 178.743L73.6915 177.767L70.6223 159.284L81.8994 146.421L82.5192 145.714L81.5865 145.595L65.2032 143.512L56.9968 126.816Z"
        stroke="#A36D1D"
        stroke-opacity="0.2"
      />
      <path
        opacity="0.5"
        d="M95.5178 50.3882L17.147 50.3882L17.147 15.9396L95.5178 15.9396L95.5178 50.3882Z"
        fill="url(#paint2_linear_3_133)"
      />
    </g>
    <defs>
      <filter
        id="filter0_d_3_133"
        x="0.249888"
        y="0.515361"
        width="122.405"
        height="221.32"
        filterUnits="userSpaceOnUse"
        color-interpolation-filters="sRGB"
      >
        <feFlood flood-opacity="0" result="BackgroundImageFix" />
        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
        <feOffset dx="5.48449" dy="5.48449" />
        <feGaussianBlur stdDeviation="3.13399" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.3 0" />
        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_3_133" />
        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_3_133" result="shape" />
      </filter>
      <linearGradient id="paint0_linear_3_133" x1="55.9679" y1="100.214" x2="55.9679" y2="210.083" gradientUnits="userSpaceOnUse">
        <stop stop-color="#FFE176" />
        <stop offset="1" stop-color="#FFD12D" />
      </linearGradient>
      <linearGradient id="paint1_linear_3_133" x1="56.5481" y1="127.037" x2="56.5481" y2="177.848" gradientUnits="userSpaceOnUse">
        <stop stop-color="white" />
        <stop offset="0.0001" stop-color="#FFFFFD" />
        <stop offset="1" stop-color="#FFE86D" />
      </linearGradient>
      <linearGradient id="paint2_linear_3_133" x1="56.3324" y1="50.3882" x2="56.3324" y2="15.9396" gradientUnits="userSpaceOnUse">
        <stop stop-color="#1D62A2" stop-opacity="0" />
        <stop offset="1" stop-color="#14275A" />
      </linearGradient>
    </defs>
  </svg>
);
