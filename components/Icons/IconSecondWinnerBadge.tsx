import mergeTW from '@/utils/mergeTW';

export const IconSecondWinnerBadge = ({
  w = '60',
  h = '60',
  className = '',
}: {
  w?: string | number;
  h?: string | number;
  className?: string;
}) => (
  <svg className={mergeTW(className)} width={w} height={h} viewBox="0 0 198 297" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g filter="url(#filter0_d_3_203)">
      <rect x="87.6223" y="145.834" width="12.1035" height="53.9156" fill="#BF7F02" />
      <path
        d="M32.2348 223.386C32.2348 215.002 39.0316 208.205 47.416 208.205H140.334C148.718 208.205 155.515 215.002 155.515 223.386V271.796H32.2348V223.386Z"
        fill="#243B6D"
      />
      <path
        d="M79.92 205.481C79.92 201.708 82.9786 198.649 86.7516 198.649H100.596C104.369 198.649 107.428 201.708 107.428 205.481V208.552H79.92V205.481Z"
        fill="#DCAE0C"
      />
      <rect x="49.9697" y="226.31" width="88.5093" height="30.1924" fill="#F9B50E" stroke="#FFEC86" stroke-width="3.91749" />
      <path d="M55.7132 224.351H97.5253L130.535 258.461H88.7227L55.7132 224.351Z" fill="#FFEC86" />
      <rect x="24.4759" y="271.796" width="137.936" height="13.2038" fill="#DE9300" />
      <path
        d="M93.5311 8.74832L121.244 64.1747L122.082 65.8501L123.941 66.0825L179.013 72.9665L141.091 115.49L139.972 116.745L140.252 118.403L150.619 179.772L95.0963 152.01L93.5311 151.227L91.9659 152.01L36.454 179.766L46.9117 118.408L47.1952 116.745L46.0709 115.487L8.05895 72.9653L63.1215 66.0825L64.9802 65.8501L65.8179 64.1747L93.5311 8.74832Z"
        fill="#FFEC86"
        stroke="#FFB802"
        stroke-width="7"
      />
      <path
        d="M93.5311 42.6655L112.316 80.2345L149.885 84.9306L124.087 113.859L131.1 155.373L93.5311 136.588L55.9621 155.373L63.0376 113.859L37.1776 84.9306L74.7466 80.2345L93.5311 42.6655Z"
        fill="#DE9300"
      />
      <path
        d="M93.9485 136.588L131.796 155.372C131.796 155.372 128.767 131.828 98.0143 113.859C67.2621 95.8899 75.0249 80.2344 75.0249 80.2344L37.1776 84.9306L63.2291 113.859L56.1012 155.372L93.9485 136.588Z"
        fill="#CB8600"
      />
      <path
        d="M125.256 236.728L130.856 224.402L125.256 212.076L137.582 217.676L149.908 212.076L144.307 224.402L149.908 236.728L137.582 231.127L125.256 236.728Z"
        fill="white"
      />
    </g>
    <defs>
      <filter
        id="filter0_d_3_203"
        x="0.216502"
        y="0.138591"
        width="197.598"
        height="296.614"
        filterUnits="userSpaceOnUse"
        color-interpolation-filters="sRGB"
      >
        <feFlood flood-opacity="0" result="BackgroundImageFix" />
        <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha" />
        <feOffset dx="5.48449" dy="5.48449" />
        <feGaussianBlur stdDeviation="3.13399" />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.3 0" />
        <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_3_203" />
        <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_3_203" result="shape" />
      </filter>
    </defs>
  </svg>
);
