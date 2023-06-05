export const metadata = {
  title: 'About - Dev Hunt',
};

// this way of writing static pages with content is not professional, we gonna use MDX later.
export default () => {
  return (
    <div className="">
      <article className="container-custom-screen mt-12 prose prose-invert">
        <h1>About DevHunt</h1>
        <p>
          Welcome to <strong>DevHunt</strong>! We're a group of cool, young developers who came together with one mission: to create an
          awesome platform specifically for launching developer tools. We believe in collaboration and making the internet better for devs
          everywhere.
        </p>
        <h2>The Team</h2>
        <p>We're lucky to have some amazing contributors on board:</p>
        <ul>
          <li>
            <a href="https://twitter.com/johnrushx">John Rush</a>
          </li>
          <li>
            <a href="https://twitter.com/sidi_jeddou_dev">Sidi Jeddou</a>
          </li>
          <li>
            <a href="https://twitter.com/vitalik_may">Vitalik May</a>
          </li>
          <li>
            <a href="https://twitter.com/BotanMan">Igor Boky</a>
          </li>
          <li>
            <a href="https://twitter.com/joshmo_dev">Josh</a>
          </li>
          <li>
            <a href="https://twitter.com/ahmadubahh">Ahmad Ubah</a>
          </li>
          <li>
            <a href="https://twitter.com/andrenoari">Ariful Islam Khan</a>
          </li>
        </ul>
        <h2>Our Story</h2>
        <p>
          We realized that launching dev tools wasn't always easy or fair on platforms like Product Hunt. So we thought, &quot;Why not build
          our own platform just for devs?&quot; And so, DevHunt was born!
        </p>
        <p>
          Our project is all about being open and collaborative - that's why we've made it super simple to list your dev tool. Plus, users
          can only vote or comment after logging in with their GitHub accounts, keeping things genuine and focused.
        </p>
        <h2>Join Us!</h2>
        <p>
          Want to be part of the fun? Awesome! You can contribute directly through our GitHub repository or spread the word among fellow
          developers who might want in on this adventure too.
        </p>
        <p>Together as a community, we'll create something truly special – let's do this! 🚀</p>
      </article>
    </div>
  );
};
