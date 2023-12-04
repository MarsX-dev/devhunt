(function () {
  window.onload = () => {
    var scriptTag = document.querySelector('script[data-url]');
    var customUrl = (scriptTag && scriptTag.getAttribute('data-url')) || 'https://devhunt.org/';

    var divElement = document.createElement('div');

    divElement.innerHTML = `
      <div class="dh-banner">
      <div class="banner-container">
        <div class="content">
          <p>We are live on DevHunt: tool of the week contest</p>
        </div>
        <a href="${customUrl}" target="_blank" class="btn">
          check it out
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5 10a.75.75 0 01.75-.75h6.638L10.23 7.29a.75.75 0 111.04-1.08l3.5 3.25a.75.75 0 010 1.08l-3.5 3.25a.75.75 0 11-1.04-1.08l2.158-1.96H5.75A.75.75 0 015 10z"
              clipRule="evenodd"
            />
          </svg>
        </a>
      </div>
    </div>
    
  
      <style>

  
        .banner-container {
          line-height: 1.5;
          -webkit-text-size-adjust: 100%;
          -moz-tab-size: 4;
          tab-size: 4;
          font-family: ui-sans-serif, system-ui, -apple-system,
            BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial,
            "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji",
            "Segoe UI Symbol", "Noto Color Emoji";
          font-feature-settings: normal;
          font-variation-settings: normal;
        }
  
  
        .banner-container a {
          color: inherit;
          text-decoration: inherit;
        }
  
  

        .banner-container .content p {
          margin: 0;
        }
        
        .banner-container a svg {
          display: block;
          vertical-align: middle;
        }

        .dh-banner{
          border-bottom-width: 1px;
          --tw-border-opacity: 1;
          border-color: rgb(30 41 59 / var(--tw-border-opacity));
          --tw-bg-opacity: 1;
          background-color: rgb(15 23 42 / var(--tw-bg-opacity));
          --tw-text-opacity: 1;
          color: rgb(241 245 249 / var(--tw-text-opacity));
        }
        
        .dh-banner .banner-container{
          margin-left: auto;
          margin-right: auto;
          display: flex;
          max-width: 1280px;
          align-items: center;
          justify-content: center;
          column-gap: 1rem;
          padding-left: 1rem;
          padding-right: 1rem;
          padding-top: 1rem;
          padding-bottom: 1rem;
          font-size: 0.875rem;
          line-height: 1.25rem;
        }
        
        @media (min-width: 768px){
          .dh-banner .banner-container{
            padding-left: 2rem;
            padding-right: 2rem;
          }
        }
        
        .dh-banner .banner-container .content{
          display: flex;
        }
        
        @media (min-width: 640px){
          .dh-banner .banner-container .content{
            align-items: center;
          }
        }
        
        .dh-banner .banner-container .btn{
          display: inline-flex;
          flex: none;
          align-items: center;
          justify-content: center;
          font-weight: 500;
          --tw-text-opacity: 1;
          color: rgb(248 250 252 / var(--tw-text-opacity));
        }
        
        .dh-banner .banner-container .btn:hover{
          -webkit-text-decoration-line: underline;
                  text-decoration-line: underline;
        }
        
        .dh-banner .banner-container .btn svg{
          height: 1.25rem;
          width: 1.25rem;
          transition-duration: 200ms;
        }
        
        .dh-banner .banner-container .btn:hover svg {
          transform: translateX(5px);
        }
      </style>
    </div>
  `;
    document.body.prepend(divElement);
  };
})();
