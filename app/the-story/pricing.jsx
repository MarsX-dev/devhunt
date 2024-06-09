export default () => {
  const plans = [
    {
      name: 'Skip the queue',
      desc: 'The average wait time for a free launch is 6 months',
      price: 297,
      link: 'https://buy.stripe.com/8wM6qfeEWdde1So3cr',
      isMostPop: true,
      features: ['Pick any launch week you want', 'Be on top of the launch tread on X', 'Get hand crafted launch video from us'],
    },
    {
      name: 'Newsletter ad',
      desc: 'Prominent placement on top of the newsletter.',
      price: 397,
      link: 'https://buy.stripe.com/3cs01RfJ05KM2Ws4gA',
      isMostPop: false,
      features: [
        'Your logo, brand name, and website link',
        'Sent out to all users on Tuesday',
        '10,000+ recipients',
        'Buy now, activate later',
      ],
    },
    {
      name: 'Home page ad',
      desc: 'Prominent placement on top of the home page.',
      price: 497,
      link: 'https://buy.stripe.com/eVa7ujgN48WY40w8wO',
      isMostPop: false,
      features: ['Your logo, brand name, and website link', 'Visible to all users', 'Runs for 7 days', 'Avg 10,000 impressions'],
    },
    {
      name: 'Home page + Newsletter',
      desc: 'Save money on buying the combo',
      price: 797,
      link: 'https://buy.stripe.com/14k8yn54m3CE7cIbJ1',
      isMostPop: false,
      features: ['Your logo, brand name, and website link', 'Visible to all users', 
      'Runs for 7 days', 'Avg 10,000 impressions', 'Over 10,000 recipients'],
    },
  ];

  return (
    <section className="relative py-14 bg-gray-900">
      <div
        className="absolute inset-0 blur-[118px] max-w-lg h-[800px] mx-auto sm:max-w-3xl sm:h-[400px]"
        style={{
          background:
            'linear-gradient(106.89deg, rgba(192, 132, 252, 0.11) 15.73%, rgba(14, 165, 233, 0.41) 15.74%, rgba(232, 121, 249, 0.26) 56.49%, rgba(79, 70, 229, 0.4) 115.91%)',
        }}
      ></div>
      <div className="relative max-w-screen-xl mx-auto text-gray-300 sm:px-4 md:px-8">
        <div className="max-w-xl mx-auto space-y-3 px-4 sm:text-center sm:px-0">
     
          <p className="text-white text-3xl font-semibold sm:text-4xl">Paid and Sponsor options</p>
          <div className="max-w-xl">
            <p>
              All packages are activated manually by contacting us after the purchase. Can be refunded any time until it has been activated.
            </p>
          </div>
        </div>
        <div className="mt-16 justify-center sm:flex">
          {plans.map((item, idx) => (
            <div
              key={idx}
              className={`relative flex-1 flex items-stretch flex-col mt-6 border-2 sm:mt-0 sm:rounded-xl sm:max-w-md ${
                item.isMostPop ? 'bg-gray-900 border-cyan-400 border-x-0 sm:border-x-2' : 'border-transparent'
              }`}
            >
              <div className="p-4 py-8 space-y-4 border-b border-gray-700 md:p-8">
                <span className="text-gray-200 font-medium">{item.name}</span>
                <div className="text-cyan-400 text-3xl font-semibold">
                  ${item.price}
                </div>
                <p className="text-gray-400">{item.desc}</p>
                <a
                  href={item.link}
                  className="px-3 inline-block text-center py-3 rounded-lg w-full font-semibold text-sm duration-150 text-white bg-cyan-500 hover:bg-cyan-600 active:bg-cyan-700"
                >
                  Buy now
                </a>
              </div>
              <ul className="p-4 py-8 space-y-3 md:p-8">
                {item.features.map((featureItem, idx) => (
                  <li key={idx} className="flex items-center gap-5">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className={`h-5 w-5 ${item.isMostPop ? 'text-cyan-600' : ''}`}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clip-rule="evenodd"
                      ></path>
                    </svg>
                    {featureItem}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <p className="text-slate-300 mt-8 text-center">
        Reach out to{' '}
        <a className="text-orange-500 underline" href="https://x.com/PravKumar1988">
          Praveen Kumar
        </a>{' '}
        for details and prices.
      </p>
    </section>
  );
};
