export default () => {
  return (
    <div className="py-14">
      <div className="max-w-screen-xl mx-auto px-4 md:px-8">
        <div className="max-w-2xl xl:mx-auto xl:text-center">
          <h3 className="text-white text-3xl font-semibold sm:text-4xl">Best Dev Tool Startups Are on DevHunt</h3>
          <p className="mt-3 text-gray-300">YCombinator, VC backed, Bootstrapped, Solo founded, all here.</p>
        </div>
        <div className="mt-6 stroke-white">
          <ul className="flex gap-y-6 flex-wrap items-center justify-center [&>*]:px-12  lg:divide-x">
            {/* LOGO 1 */}
            <li className="flex-none border-slate-800">
              <svg viewBox="0 0 62 18" fill="none" aria-hidden="true" class="h-[1.125rem]">
                <ellipse cx="8.99999" cy="9" rx="2.81249" ry="2.8125" class="fill-[var(--light,#654BF6)_var(--dark,#fff)]"></ellipse>
                <path
                  d="M14.0674 15.6591C14.3067 15.8984 14.2827 16.2945 14.0015 16.4829C12.571 17.4411 10.8504 17.9999 8.9993 17.9999C7.14818 17.9999 5.42758 17.4411 3.99704 16.4829C3.71589 16.2945 3.69186 15.8984 3.93115 15.6591L5.98648 13.6037C6.17225 13.418 6.46042 13.3886 6.69424 13.5084C7.3856 13.8626 8.16911 14.0624 8.9993 14.0624C9.82948 14.0624 10.613 13.8626 11.3044 13.5084C11.5382 13.3886 11.8263 13.418 12.0121 13.6037L14.0674 15.6591Z"
                  class="fill-[var(--light,#654BF6)_var(--dark,#fff)]"
                ></path>
                <path
                  d="M14.0022 1.51706C14.2834 1.70539 14.3074 2.10155 14.0681 2.34084L12.0128 4.39619C11.827 4.58195 11.5388 4.61129 11.305 4.49151C10.6136 4.13733 9.83014 3.9375 8.99996 3.9375C6.20403 3.9375 3.93748 6.20406 3.93748 9C3.93748 9.83018 4.13731 10.6137 4.49149 11.3051C4.61127 11.5389 4.58193 11.827 4.39617 12.0128L2.34083 14.0682C2.10154 14.3074 1.70538 14.2834 1.51705 14.0023C0.558857 12.5717 0 10.8511 0 9C0 4.02944 4.02942 0 8.99996 0C10.8511 0 12.5717 0.55886 14.0022 1.51706Z"
                  fill-opacity="0.5"
                  class="fill-[var(--light,#654BF6)_var(--dark,#fff)]"
                ></path>
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M29.3906 1.82813C29.3906 1.75046 29.4535 1.6875 29.5312 1.6875H31.6406C31.7182 1.6875 31.7812 1.75046 31.7812 1.82813V16.1719C31.7812 16.2495 31.7182 16.3125 31.6406 16.3125H29.5312C29.4535 16.3125 29.3906 16.2495 29.3906 16.1719V1.82813ZM26.4137 13.2701C26.3577 13.2217 26.2739 13.2253 26.2201 13.2761C25.8913 13.5864 25.5063 13.8347 25.0843 14.0078C24.6215 14.1979 24.1239 14.2936 23.622 14.2891C23.1982 14.3016 22.7762 14.2291 22.3821 14.076C21.988 13.9229 21.63 13.6925 21.3303 13.3989C20.7859 12.8431 20.4726 12.0496 20.4726 11.1037C20.4726 9.2101 21.7324 7.91491 23.622 7.91491C24.1289 7.90793 24.631 8.01058 25.0926 8.21543C25.5111 8.40122 25.8869 8.66683 26.1982 8.99629C26.2514 9.05264 26.3398 9.05916 26.3985 9.00842L27.8225 7.7762C27.8807 7.72586 27.8877 7.63797 27.8364 7.58065C26.7653 6.38368 25.0872 5.76563 23.4914 5.76563C20.2783 5.76563 18 7.93299 18 11.1217C18 12.6988 18.5662 14.0268 19.5211 14.9645C20.476 15.9023 21.8363 16.4531 23.4059 16.4531C25.3741 16.4531 26.9582 15.6984 27.8869 14.7302C27.9414 14.6734 27.9354 14.583 27.8758 14.5315L26.4137 13.2701ZM43.401 11.8056C43.3931 11.876 43.3332 11.9287 43.2623 11.9287H35.8731C35.7833 11.9287 35.7164 12.012 35.7398 12.0986C36.1074 13.4614 37.2035 14.286 38.6995 14.286C39.2038 14.2966 39.7037 14.1928 40.1605 13.9827C40.5862 13.787 40.9639 13.5038 41.2682 13.1528C41.305 13.1104 41.3691 13.1041 41.4122 13.1401L42.8978 14.4335C42.9547 14.483 42.9626 14.5687 42.9138 14.6262C42.0169 15.6843 40.5637 16.4531 38.5695 16.4531C35.5016 16.4531 33.1874 14.3286 33.1874 11.1009C33.1874 9.51732 33.7326 8.18944 34.6412 7.25179C35.1209 6.76963 35.6959 6.38911 36.3307 6.13368C36.9656 5.87826 37.6469 5.75332 38.3327 5.76658C41.4422 5.76658 43.453 7.95343 43.453 10.973C43.4491 11.2512 43.4317 11.5291 43.401 11.8056ZM35.7842 9.84589C35.7581 9.93268 35.8251 10.0172 35.9158 10.0172H40.829C40.9198 10.0172 40.9869 9.93217 40.9617 9.84491C40.6268 8.68592 39.7772 7.91244 38.4577 7.91244C38.0696 7.90013 37.6834 7.97039 37.3254 8.11832C36.9675 8.26633 36.6462 8.48856 36.3836 8.76977C36.1075 9.08283 35.9034 9.44988 35.7842 9.84589ZM50.7639 5.76717C50.8422 5.76632 50.9061 5.82952 50.9061 5.90779V8.26951C50.9061 8.35135 50.8365 8.41586 50.7548 8.40981C50.5269 8.39291 50.3114 8.37856 50.1701 8.37856C48.3301 8.37856 47.2499 9.67359 47.2499 11.3735V16.1719C47.2499 16.2495 47.1869 16.3125 47.1092 16.3125H44.9999C44.9222 16.3125 44.8592 16.2495 44.8592 16.1719V6.05379C44.8592 5.97613 44.9222 5.91317 44.9999 5.91317H47.1092C47.1869 5.91317 47.2499 5.97613 47.2499 6.05379V7.47394C47.2499 7.48196 47.2563 7.48845 47.2644 7.48845C47.2689 7.48845 47.2733 7.48627 47.276 7.48261C48.1006 6.38146 49.3176 5.76892 50.6033 5.76892L50.7639 5.76717ZM56.4778 11.9525C56.4864 11.9432 56.4985 11.938 56.5112 11.938C56.5269 11.938 56.5415 11.9461 56.5498 11.9595L59.217 16.2462C59.2426 16.2874 59.2878 16.3125 59.3364 16.3125L61.7342 16.3125C61.8445 16.3125 61.9118 16.1915 61.8538 16.0978L58.1947 10.1939C58.1616 10.1406 58.1679 10.0719 58.21 10.0254L61.7355 6.13573C61.8174 6.04534 61.7533 5.90066 61.6313 5.90066H59.1298C59.0904 5.90066 59.0528 5.91719 59.0261 5.94622L54.9472 10.3925C54.8605 10.487 54.7029 10.4257 54.7029 10.2974V1.82812C54.7029 1.75046 54.64 1.6875 54.5623 1.6875H52.453C52.3753 1.6875 52.3123 1.75046 52.3123 1.82812V16.1719C52.3123 16.2495 52.3753 16.3125 52.453 16.3125L54.5623 16.3125C54.64 16.3125 54.7029 16.2495 54.7029 16.1719V13.9147C54.7029 13.8792 54.7164 13.8449 54.7406 13.8189L56.4778 11.9525Z"
                  class="fill-[var(--light,theme(colors.gray.950))_var(--dark,#fff)]"
                ></path>
              </svg>
            </li>

            {/* LOGO 2 */}
            <li className="flex-none text-white border-slate-800">
              SwiperJS
            </li>

            <li className="flex-none border-slate-800">
              <a class="flex items-center space-x-2 font-bold text-slate-800 no-underline dark:text-white" href="/">
                <div class="flex h-8 w-8 items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" width="45" height="45" fill="none">
                    <path
                      fill-rule="evenodd"
                      clip-rule="evenodd"
                      d="M447.099 231.913C405.967 244.337 367.742 264.878 334.682 292.323C320.832 268.71 298.796 251.002 272.754 242.557C313.865 205.575 362.202 177.525 414.709 160.178C467.216 142.832 522.751 136.567 577.803 141.781C632.855 146.994 686.227 163.571 734.544 190.465C746.769 197.27 758.603 204.698 770.004 212.711C770.394 212.542 770.785 212.376 771.179 212.213C785.976 206.085 802.259 204.482 817.967 207.607C833.676 210.733 848.105 218.446 859.429 229.771C870.754 241.096 878.465 255.525 881.589 271.233C884.712 286.941 883.107 303.223 876.976 318.018C870.845 332.814 860.464 345.459 847.146 354.355C833.828 363.252 818.171 367.999 802.154 367.997C791.52 367.997 780.991 365.902 771.167 361.833C761.343 357.763 752.417 351.799 744.898 344.28C737.379 336.76 731.415 327.834 727.347 318.01C723.279 308.186 721.186 297.657 721.187 287.024C721.187 282.871 721.506 278.742 722.135 274.672C713.657 268.849 704.889 263.426 695.859 258.426C658.269 237.612 616.889 224.541 574.163 219.988C531.437 215.434 488.232 219.489 447.099 231.913ZM319.489 348.564C319.489 363.809 315.185 378.728 307.094 391.613L323.693 420.326C307.59 439.476 285.501 452.638 260.995 457.683L244.582 429.298C237.31 429.844 229.959 429.408 222.73 427.971C207.024 424.848 192.597 417.138 181.273 405.816C169.949 394.495 162.237 380.069 159.112 364.365C155.986 348.661 157.588 332.382 163.715 317.588C169.841 302.794 180.217 290.149 193.531 281.251C206.845 272.354 222.498 267.604 238.511 267.601C249.145 267.6 259.674 269.693 269.499 273.761C279.324 277.829 288.251 283.793 295.77 291.311C303.29 298.829 309.255 307.755 313.325 317.578C317.394 327.402 319.489 337.931 319.489 348.564ZM260.998 457.685L400.599 699.132L442.692 772.036L484.794 699.132L537.279 608.237L589.621 698.805L631.691 771.687L673.783 698.794L744.391 576.462H859.708C861.079 564.36 861.767 552.19 861.769 540.01C861.771 527.83 861.08 515.66 859.697 503.558H702.288L694.971 516.229L631.67 625.857L579.327 535.278L537.235 462.374L495.208 535.289L442.692 626.184L323.7 420.328C307.596 439.478 285.506 452.64 260.998 457.685ZM861.77 540.003C861.768 552.183 861.08 564.353 859.709 576.455H937.128V503.551H859.709C861.088 515.653 861.776 527.823 861.77 540.003ZM937.154 503.558H938.332C939.411 515.563 940 527.721 940 540.01C940 760.902 760.967 940 540.027 940C319.088 940 140 760.924 140 540.031C139.942 500.879 145.66 461.933 156.968 424.449C175.493 444.394 200.696 456.845 227.794 459.44C221.851 485.163 218.231 515.061 218.231 540.01C218.231 717.668 362.259 861.764 540.038 861.764C705.462 861.764 841.629 736.99 859.731 576.462H937.154V503.558Z"
                      fill="currentColor"
                    ></path>
                  </svg>
                </div>
                <span class="xl:block">WunderGraph</span>
              </a>
            </li>

            <li className="flex-none border-slate-800">
              <img
                alt=""
                loading="lazy"
                src="https://assets-global.website-files.com/63a478b78ec7275316525948/63ee8be4389b3c7a9f796ba1_fastgen_logo_dual-tone_vector.svg"
                className="w-28"
              />
            </li>

            <li className="flex-none text-white border-slate-800">
              OpenStatus
            </li>

            <li className="flex-none border-slate-800">
              <img
                src="https://assets-global.website-files.com/659480aa07716c37f0fd8dee/6594816605419798d19c9e22_logo%201.svg"
                loading="lazy"
                alt=""
                style={{ filter: 'invert(1)' }}
              ></img>
            </li>

            <li className="flex-none border-slate-800">
              <img
                alt="Papermark Logo"
                loading="lazy"
                width="119"
                height="32"
                decoding="async"
                data-nimg="1"
                style={{ filter: 'invert(1)' }}
                src="https://www.papermark.io/_next/static/media/papermark-logo.d2fc4f5c.svg"
              ></img>
            </li>

            <li className="flex-none border-slate-800">
              <svg
                data-node-id="RvKAA-USW6ZGz6lHvuaWS"
                data-id="0.0.0.0.0.0.0.0.0"
                data-component="logo2024"
                class="ftaNwg"
                xmlns="http://www.w3.org/2000/svg"
                height="24"
                viewBox="0 0 869 156"
              >
                <path
                  data-node-id="kkPf8xmgSRrocBP9yur20"
                  data-id="0.0.0.0.0.0.0.0.0.0"
                  data-component="logo2024"
                  class="ftaNwg"
                  d="M124 20C124 8.95431 132.954 0 144 0V0C155.046 0 164 8.95431 164 20V20C164 31.0457 155.046 40 144 40V40C132.954 40 124 31.0457 124 20V20Z"
                  fill="#1CD688"
                ></path>
                <rect
                  data-node-id="0-PoHPnCspxSNbD_oiyQr"
                  data-id="0.0.0.0.0.0.0.0.0.1"
                  data-component="logo2024"
                  class="ftaNwg"
                  rx="20"
                  fill="#3586FF"
                  width="110"
                  height="40"
                ></rect>
                <rect
                  data-node-id="v82u6TSMm3Z4rLkhXKhY0"
                  data-id="0.0.0.0.0.0.0.0.0.2"
                  data-component="logo2024"
                  class="ftaNwg"
                  x="57"
                  y="58"
                  rx="20"
                  fill="#F43F5E"
                  width="146"
                  height="40"
                ></rect>
                <rect
                  data-node-id="0QkAe9Z5ocroIPUnxWv-K"
                  data-id="0.0.0.0.0.0.0.0.0.3"
                  data-component="logo2024"
                  class="ftaNwg"
                  x="30"
                  y="116"
                  rx="20"
                  fill="#FBCC26"
                  width="94"
                  height="40"
                ></rect>
                <path
                  data-node-id="VfLZlrJSWt-tv8RHZ478T"
                  data-id="0.0.0.0.0.0.0.0.0.4"
                  data-component="logo2024"
                  class="ftaNwg"
                  d="M776.676 108.234V90.7839H846.011L843.211 95.4497C843.211 95.0765 843.211 94.6721 843.211 94.2366C843.211 93.7389 843.211 93.3346 843.211 93.0235C843.211 88.7309 842.247 84.7183 840.318 80.9856C838.39 77.1907 835.466 74.1424 831.547 71.8406C827.627 69.4766 822.651 68.2945 816.616 68.2945C810.644 68.2945 805.449 69.5699 801.032 72.1205C796.677 74.609 793.287 78.2172 790.861 82.9453C788.497 87.6733 787.315 93.3345 787.315 99.9289C787.315 106.71 788.465 112.558 790.767 117.472C793.069 122.325 796.429 126.058 800.845 128.671C805.325 131.221 810.768 132.496 817.176 132.496C821.531 132.496 825.294 132.092 828.467 131.283C831.64 130.475 834.222 129.386 836.213 128.017C838.266 126.586 839.79 125.062 840.785 123.445C841.843 121.827 842.465 120.21 842.651 118.592H867.1C866.727 122.76 865.327 126.835 862.901 130.817C860.537 134.736 857.209 138.313 852.916 141.548C848.624 144.721 843.398 147.272 837.239 149.2C831.142 151.067 824.175 152 816.336 152C805.698 152 796.397 149.822 788.434 145.468C780.471 141.113 774.25 135.047 769.771 127.271C765.354 119.494 763.146 110.598 763.146 100.582C763.146 90.3173 765.385 81.3278 769.864 73.6136C774.406 65.8994 780.689 59.896 788.714 55.6035C796.74 51.2487 805.947 49.0713 816.336 49.0713C827.036 49.0713 836.275 51.2487 844.051 55.6035C851.89 59.9582 857.924 66.0238 862.155 73.8002C866.385 81.5144 868.5 90.5039 868.5 100.769C868.5 102.075 868.469 103.475 868.407 104.968C868.345 106.461 868.251 107.55 868.127 108.234H776.676Z"
                  fill="white"
                ></path>
                <path
                  data-node-id="rFNACkWnBD1zwcnICMJdx"
                  data-id="0.0.0.0.0.0.0.0.0.5"
                  data-component="logo2024"
                  class="ftaNwg"
                  d="M742.432 4V149.854H718.263V20C718.263 11.1635 725.426 4 734.263 4H742.432Z"
                  fill="white"
                ></path>
                <path
                  data-node-id="V3Nlbf7TtJSIw-tIFyUnC"
                  data-id="0.0.0.0.0.0.0.0.0.6"
                  data-component="logo2024"
                  class="ftaNwg"
                  d="M636.814 151.907C628.664 151.907 621.105 149.947 614.138 146.028C607.232 142.047 601.695 136.199 597.527 128.485C593.359 120.77 591.275 111.283 591.275 100.023C591.275 89.0738 593.39 79.8043 597.62 72.2146C601.913 64.6248 607.512 58.8703 614.417 54.951C621.385 51.0317 628.85 49.072 636.814 49.072C644.59 49.072 651.775 51.0006 658.37 54.8577C664.964 58.6525 670.252 63.9405 674.234 70.7215C678.215 77.5025 680.206 85.2789 680.206 94.0507C680.206 94.2995 680.206 94.5484 680.206 94.7972C680.206 95.0461 680.206 95.2949 680.206 95.5438L668.075 95.8237C668.075 95.6371 668.075 95.4504 668.075 95.2638C668.075 95.015 668.075 94.7972 668.075 94.6106C668.075 89.6959 666.83 85.4033 664.342 81.7329C661.916 78.0624 658.743 75.2007 654.824 73.1477C650.967 71.0326 646.861 69.975 642.506 69.975C635.352 69.975 629.255 72.4012 624.216 77.2537C619.177 82.0439 616.657 89.6337 616.657 100.023C616.657 110.35 619.177 117.971 624.216 122.886C629.255 127.8 635.352 130.258 642.506 130.258C647.047 130.258 651.247 129.169 655.104 126.992C658.961 124.814 662.071 121.828 664.435 118.033C666.862 114.176 668.075 109.759 668.075 104.782L680.206 105.342C680.206 114.052 678.246 121.952 674.327 129.044C670.47 136.074 665.275 141.642 658.743 145.748C652.211 149.854 644.901 151.907 636.814 151.907ZM668.075 149.854V20C668.075 11.1635 675.238 4 684.075 4H692.71V149.854H668.075Z"
                  fill="white"
                ></path>
                <path
                  data-node-id="BX_NQjKBR271NfuYQZPm8"
                  data-id="0.0.0.0.0.0.0.0.0.7"
                  data-component="logo2024"
                  class="ftaNwg"
                  d="M515.611 151.907C507.461 151.907 499.903 149.947 492.935 146.028C486.03 142.047 480.493 136.199 476.325 128.485C472.157 120.77 470.073 111.283 470.073 100.023C470.073 89.0738 472.188 79.8043 476.418 72.2146C480.711 64.6248 486.31 58.8703 493.215 54.951C500.183 51.0317 507.648 49.072 515.611 49.072C523.387 49.072 530.573 51.0006 537.167 54.8577C543.762 58.6525 549.05 63.9405 553.031 70.7215C557.013 77.5025 559.003 85.2789 559.003 94.0507C559.003 94.2995 559.003 94.5484 559.003 94.7972C559.003 95.0461 559.003 95.2949 559.003 95.5438L546.872 95.8237C546.872 95.6371 546.872 95.4504 546.872 95.2638C546.872 95.015 546.872 94.7972 546.872 94.6106C546.872 89.6959 545.628 85.4033 543.14 81.7329C540.713 78.0624 537.541 75.2007 533.621 73.1477C529.764 71.0326 525.658 69.975 521.303 69.975C514.149 69.975 508.052 72.4012 503.013 77.2537C497.974 82.0439 495.455 89.6337 495.455 100.023C495.455 110.35 497.974 117.971 503.013 122.886C508.052 127.8 514.149 130.258 521.303 130.258C525.845 130.258 530.044 129.169 533.901 126.992C537.758 124.814 540.869 121.828 543.233 118.033C545.659 114.176 546.872 109.759 546.872 104.782L559.003 105.342C559.003 114.052 557.044 121.952 553.124 129.044C549.267 136.074 544.073 141.642 537.541 145.748C531.008 149.854 523.699 151.907 515.611 151.907ZM546.872 149.854V20C546.872 11.1635 554.036 4 562.872 4H571.508V149.854H546.872Z"
                  fill="white"
                ></path>
                <path
                  data-node-id="6UCujzLJG1Zh7gpzhLTup"
                  data-id="0.0.0.0.0.0.0.0.0.8"
                  data-component="logo2024"
                  class="ftaNwg"
                  d="M401.056 151.813C390.605 151.813 381.397 149.636 373.434 145.281C365.471 140.864 359.219 134.767 354.678 126.991C350.198 119.214 347.959 110.318 347.959 100.302C347.959 90.224 350.198 81.3589 354.678 73.7069C359.219 65.9927 365.471 59.9582 373.434 55.6035C381.397 51.2487 390.605 49.0713 401.056 49.0713C411.507 49.0713 420.715 51.2487 428.678 55.6035C436.641 59.9582 442.862 65.9927 447.341 73.7069C451.883 81.3589 454.153 90.224 454.153 100.302C454.153 110.318 451.883 119.214 447.341 126.991C442.862 134.767 436.641 140.864 428.678 145.281C420.715 149.636 411.507 151.813 401.056 151.813ZM401.056 131.75C406.717 131.75 411.663 130.444 415.893 127.831C420.124 125.218 423.421 121.578 425.785 116.913C428.149 112.185 429.331 106.648 429.331 100.302C429.331 93.9567 428.149 88.4821 425.785 83.8785C423.421 79.2126 420.124 75.6044 415.893 73.0537C411.663 70.503 406.717 69.2277 401.056 69.2277C395.457 69.2277 390.511 70.503 386.219 73.0537C381.988 75.6044 378.691 79.2126 376.327 83.8785C373.963 88.4821 372.781 93.9567 372.781 100.302C372.781 106.648 373.963 112.185 376.327 116.913C378.691 121.578 381.988 125.218 386.219 127.831C390.511 130.444 395.457 131.75 401.056 131.75Z"
                  fill="white"
                ></path>
                <path
                  data-node-id="CEdl0Ch_0kKpmN8-lALpz"
                  data-id="0.0.0.0.0.0.0.0.0.9"
                  data-component="logo2024"
                  class="ftaNwg"
                  d="M313.497 151.72C309.951 151.72 306.343 151.378 302.672 150.694C299.002 150.01 295.642 148.734 292.594 146.868C289.546 145.002 287.088 142.264 285.222 138.656C283.356 135.048 282.423 130.289 282.423 124.379C282.423 123.01 282.423 121.641 282.423 120.273C282.423 118.842 282.423 117.38 282.423 115.887V70.3482H259V50.7517H268.518C271.753 50.7517 274.304 50.6273 276.17 50.3784C278.037 50.0674 279.405 49.383 280.276 48.3255C281.147 47.2679 281.707 45.6193 281.956 43.3797C282.267 41.0779 282.423 37.9051 282.423 33.8614V33.8614C282.423 25.1515 289.483 18.0908 298.193 18.0908H307.058V50.7517H336.546V70.3482H307.058V110.101C307.058 111.283 307.058 112.465 307.058 113.647C307.058 114.767 307.058 115.856 307.058 116.913C307.058 121.517 307.618 125.218 308.738 128.018C309.858 130.818 312.502 132.217 316.67 132.217C318.661 132.217 320.527 132.031 322.269 131.657C324.073 131.284 325.41 130.911 326.281 130.538V149.761C325.099 150.196 323.389 150.632 321.149 151.067C318.909 151.503 316.359 151.72 313.497 151.72Z"
                  fill="white"
                ></path>
              </svg>
            </li>

            <li className="flex-none border-slate-800 text-white flex gap-1">
              <img
                class="avatar mr-2 d-none d-md-block"
                alt="Owner avatar"
                src="https://avatars.githubusercontent.com/u/119600397?s=48&amp;v=4"
                width="24"
                height="24"
              ></img> Twenty CRM
            </li>

            <li className="flex-none border-slate-800">
              <img
                class="alignnone wp-image-64733 rl-rl-lazyloaded"
                src="https://cfw42.rabbitloader.xyz/eyJjIjp0cnVlLCJoIjoibGlmZXRpbW8uY29tIiwidiI6Mjk1ODgxMTI4NX0/wp-content/uploads/2023/11/ShipFast-Lifetime-Deal-Logo.jpg"
                alt="Shipfast Lifetime Deal Logo"
                width="179"
                height="67"
                data-rl-src="https://cfw42.rabbitloader.xyz/eyJjIjp0cnVlLCJoIjoibGlmZXRpbW8uY29tIiwidiI6Mjk1ODgxMTI4NX0/wp-content/uploads/2023/11/ShipFast-Lifetime-Deal-Logo.jpg"
              ></img>
            </li>

            <li className="flex-none text-white border-slate-800">
              <svg viewBox="0 0 62 18" fill="none" aria-hidden="true" class="h-[1.125rem]">
                <ellipse cx="8.99999" cy="9" rx="2.81249" ry="2.8125" class="fill-[var(--light,#654BF6)_var(--dark,#fff)]"></ellipse>
                <path
                  d="M14.0674 15.6591C14.3067 15.8984 14.2827 16.2945 14.0015 16.4829C12.571 17.4411 10.8504 17.9999 8.9993 17.9999C7.14818 17.9999 5.42758 17.4411 3.99704 16.4829C3.71589 16.2945 3.69186 15.8984 3.93115 15.6591L5.98648 13.6037C6.17225 13.418 6.46042 13.3886 6.69424 13.5084C7.3856 13.8626 8.16911 14.0624 8.9993 14.0624C9.82948 14.0624 10.613 13.8626 11.3044 13.5084C11.5382 13.3886 11.8263 13.418 12.0121 13.6037L14.0674 15.6591Z"
                  class="fill-[var(--light,#654BF6)_var(--dark,#fff)]"
                ></path>
                <path
                  d="M14.0022 1.51706C14.2834 1.70539 14.3074 2.10155 14.0681 2.34084L12.0128 4.39619C11.827 4.58195 11.5388 4.61129 11.305 4.49151C10.6136 4.13733 9.83014 3.9375 8.99996 3.9375C6.20403 3.9375 3.93748 6.20406 3.93748 9C3.93748 9.83018 4.13731 10.6137 4.49149 11.3051C4.61127 11.5389 4.58193 11.827 4.39617 12.0128L2.34083 14.0682C2.10154 14.3074 1.70538 14.2834 1.51705 14.0023C0.558857 12.5717 0 10.8511 0 9C0 4.02944 4.02942 0 8.99996 0C10.8511 0 12.5717 0.55886 14.0022 1.51706Z"
                  fill-opacity="0.5"
                  class="fill-[var(--light,#654BF6)_var(--dark,#fff)]"
                ></path>
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M29.3906 1.82813C29.3906 1.75046 29.4535 1.6875 29.5312 1.6875H31.6406C31.7182 1.6875 31.7812 1.75046 31.7812 1.82813V16.1719C31.7812 16.2495 31.7182 16.3125 31.6406 16.3125H29.5312C29.4535 16.3125 29.3906 16.2495 29.3906 16.1719V1.82813ZM26.4137 13.2701C26.3577 13.2217 26.2739 13.2253 26.2201 13.2761C25.8913 13.5864 25.5063 13.8347 25.0843 14.0078C24.6215 14.1979 24.1239 14.2936 23.622 14.2891C23.1982 14.3016 22.7762 14.2291 22.3821 14.076C21.988 13.9229 21.63 13.6925 21.3303 13.3989C20.7859 12.8431 20.4726 12.0496 20.4726 11.1037C20.4726 9.2101 21.7324 7.91491 23.622 7.91491C24.1289 7.90793 24.631 8.01058 25.0926 8.21543C25.5111 8.40122 25.8869 8.66683 26.1982 8.99629C26.2514 9.05264 26.3398 9.05916 26.3985 9.00842L27.8225 7.7762C27.8807 7.72586 27.8877 7.63797 27.8364 7.58065C26.7653 6.38368 25.0872 5.76563 23.4914 5.76563C20.2783 5.76563 18 7.93299 18 11.1217C18 12.6988 18.5662 14.0268 19.5211 14.9645C20.476 15.9023 21.8363 16.4531 23.4059 16.4531C25.3741 16.4531 26.9582 15.6984 27.8869 14.7302C27.9414 14.6734 27.9354 14.583 27.8758 14.5315L26.4137 13.2701ZM43.401 11.8056C43.3931 11.876 43.3332 11.9287 43.2623 11.9287H35.8731C35.7833 11.9287 35.7164 12.012 35.7398 12.0986C36.1074 13.4614 37.2035 14.286 38.6995 14.286C39.2038 14.2966 39.7037 14.1928 40.1605 13.9827C40.5862 13.787 40.9639 13.5038 41.2682 13.1528C41.305 13.1104 41.3691 13.1041 41.4122 13.1401L42.8978 14.4335C42.9547 14.483 42.9626 14.5687 42.9138 14.6262C42.0169 15.6843 40.5637 16.4531 38.5695 16.4531C35.5016 16.4531 33.1874 14.3286 33.1874 11.1009C33.1874 9.51732 33.7326 8.18944 34.6412 7.25179C35.1209 6.76963 35.6959 6.38911 36.3307 6.13368C36.9656 5.87826 37.6469 5.75332 38.3327 5.76658C41.4422 5.76658 43.453 7.95343 43.453 10.973C43.4491 11.2512 43.4317 11.5291 43.401 11.8056ZM35.7842 9.84589C35.7581 9.93268 35.8251 10.0172 35.9158 10.0172H40.829C40.9198 10.0172 40.9869 9.93217 40.9617 9.84491C40.6268 8.68592 39.7772 7.91244 38.4577 7.91244C38.0696 7.90013 37.6834 7.97039 37.3254 8.11832C36.9675 8.26633 36.6462 8.48856 36.3836 8.76977C36.1075 9.08283 35.9034 9.44988 35.7842 9.84589ZM50.7639 5.76717C50.8422 5.76632 50.9061 5.82952 50.9061 5.90779V8.26951C50.9061 8.35135 50.8365 8.41586 50.7548 8.40981C50.5269 8.39291 50.3114 8.37856 50.1701 8.37856C48.3301 8.37856 47.2499 9.67359 47.2499 11.3735V16.1719C47.2499 16.2495 47.1869 16.3125 47.1092 16.3125H44.9999C44.9222 16.3125 44.8592 16.2495 44.8592 16.1719V6.05379C44.8592 5.97613 44.9222 5.91317 44.9999 5.91317H47.1092C47.1869 5.91317 47.2499 5.97613 47.2499 6.05379V7.47394C47.2499 7.48196 47.2563 7.48845 47.2644 7.48845C47.2689 7.48845 47.2733 7.48627 47.276 7.48261C48.1006 6.38146 49.3176 5.76892 50.6033 5.76892L50.7639 5.76717ZM56.4778 11.9525C56.4864 11.9432 56.4985 11.938 56.5112 11.938C56.5269 11.938 56.5415 11.9461 56.5498 11.9595L59.217 16.2462C59.2426 16.2874 59.2878 16.3125 59.3364 16.3125L61.7342 16.3125C61.8445 16.3125 61.9118 16.1915 61.8538 16.0978L58.1947 10.1939C58.1616 10.1406 58.1679 10.0719 58.21 10.0254L61.7355 6.13573C61.8174 6.04534 61.7533 5.90066 61.6313 5.90066H59.1298C59.0904 5.90066 59.0528 5.91719 59.0261 5.94622L54.9472 10.3925C54.8605 10.487 54.7029 10.4257 54.7029 10.2974V1.82812C54.7029 1.75046 54.64 1.6875 54.5623 1.6875H52.453C52.3753 1.6875 52.3123 1.75046 52.3123 1.82812V16.1719C52.3123 16.2495 52.3753 16.3125 52.453 16.3125L54.5623 16.3125C54.64 16.3125 54.7029 16.2495 54.7029 16.1719V13.9147C54.7029 13.8792 54.7164 13.8449 54.7406 13.8189L56.4778 11.9525Z"
                  class="fill-[var(--light,theme(colors.gray.950))_var(--dark,#fff)]"
                ></path>
              </svg>
            </li>

            <li className="flex-none border-slate-800"></li>
          </ul>
        </div>
      </div>
    </div>
  );
};
