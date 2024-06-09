import Pricing from './pricing';
import Stats from './stats';
import Logos from './logos';

export const metadata = {
  title: 'The Story - Pragya',
};

// this way of writing static pages with content is not professional, we gonna use MDX later.
export default () => {
  return (
    <div className="">
      <article className="container-custom-screen mt-12 prose prose-invert">
        <h1>About Pragya</h1>
        {/*<p>*/}
        {/*  Welcome to <strong>DevHunt</strong>! We're a group of cool, young developers who came together with one mission: to create an*/}
        {/*  awesome platform specifically for launching developer tools. We believe in collaboration and making the internet better for devs*/}
        {/*  everywhere.*/}
        {/*</p>*/}
        {/*<h2>The Team</h2>*/}
        {/*<p>We're lucky to have some amazing contributors on board:</p>*/}
        {/*<ul>*/}
        {/*  <li>*/}
        {/*    <a href="https://twitter.com/johnrushx">Praveen Kumar</a>*/}
        {/*  </li>*/}
        {/*</ul>*/}
        {/*<h2>Our Story</h2>*/}
        {/*<p>*/}
        {/*  We realized that launching dev tools wasn't always easy or fair on platforms like Product Hunt. So we thought, &quot;Why not build*/}
        {/*  our own platform just for devs?&quot; And so, DevHunt was born!*/}
        {/*</p>*/}
        {/*<p>*/}
        {/*  Our project is all about being open and collaborative - that's why we've made it super simple to list your dev tool. Plus, users*/}
        {/*  can only vote or comment after logging in with their GitHub accounts, keeping things genuine and focused.*/}
        {/*</p>*/}
        {/*<h2>Perks for the Winners</h2>*/}
        {/*<p>*/}
        {/*  <ul>*/}
        {/*    <li>A feature in our weekly newsletter reaching thousands of DevHunt developers.</li>*/}
        {/*    <li>A dedicated post and mention on our social media channels.</li>*/}
        {/*    <li>An exclusive winner badge to show off your win!</li>*/}
        {/*    <li>Exclusive discounts and free credits from our partner products.</li>*/}
        {/*  </ul>*/}
        {/*</p>*/}
        {/*<h2>What Tools Can Launch Here?</h2>*/}
        {/*<ul>*/}
        {/*  <li>*/}
        {/*    <strong>Open Source Tools:</strong> Got a project that can help devs? Share it here.*/}
        {/*  </li>*/}
        {/*  <li>*/}
        {/*    <strong>APIs & SDKs:</strong> If your tool makes coding easier, launch it with us!*/}
        {/*  </li>*/}
        {/*  <li>*/}
        {/*    <strong>Frameworks & Libraries:</strong> Created something to save fellow devs some time? We'd love to see it.*/}
        {/*  </li>*/}
        {/*  <li>*/}
        {/*    <strong>IDEs & Code Editors:</strong>Built an environment where devs can write and debug code efficiently? Bring it on!*/}
        {/*  </li>*/}
        {/*  <li>*/}
        {/*    <strong>Testing Tools: </strong>All tools related to testing are welcome here.*/}
        {/*  </li>*/}
        {/*  <li>*/}
        {/*    <strong>Monitoring/Performance tracking Tools: </strong> Real-time system performance or app health monitoring tools - all*/}
        {/*    game-changers welcomed!{' '}*/}
        {/*  </li>*/}
        {/*</ul>*/}
        {/*<h2>Join Us!</h2>*/}
        {/*<p>*/}
        {/*  Want to be part of the fun? Awesome! You can contribute directly through our GitHub repository or spread the word among fellow*/}
        {/*  developers who might want in on this adventure too.*/}
        {/*</p>*/}
        <p>Together as a community, we'll create something truly special – let's do this! 🚀</p>

      

        
      </article>
      <hr className='border-slate-600 mt-10'/>
      <Stats/>
      <Logos/>
      <Pricing />
    </div>
  );
};
