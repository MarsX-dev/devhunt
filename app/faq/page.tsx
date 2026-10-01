import Link from 'next/link';
import PageHeader from '@/components/ui/PageHeader';

export const metadata = {
  title: 'DevHunt FAQ: launching, voting and pricing',
  description: 'How to launch a dev tool on DevHunt, how voting and weekly winners work, what it costs, and how DevHunt compares to Product Hunt.',
  alternates: { canonical: '/faq' },
};

// Answers are plain text so the same copy feeds the page and the FAQPage JSON-LD.
const FAQ: { q: string; a: string }[] = [
  {
    q: 'What is DevHunt?',
    a: 'DevHunt is a launchpad for developer tools, built by developers. Makers list their dev tools, each week a new batch launches on the home page, and developers vote for the ones they like. It is open source and focused only on tools for developers.',
  },
  {
    q: 'How do I launch my dev tool on DevHunt?',
    a: 'Sign in, open your account and submit your tool with its name, website, description, logo and screenshots. Every tool gets a permanent page on DevHunt. Free launches are scheduled in the launch queue; a paid launch lets you pick the week.',
  },
  {
    q: 'Is launching on DevHunt free?',
    a: 'Yes. Listing a tool is free, and free tools are given a launch week from the queue. A paid launch costs $19 once: you choose any launch week, get a spot in the newsletter, and your link becomes dofollow. For $49 it is boosted: on equal votes it is listed above $19 and free launches, on the site and in the weekly email, and gets its own post on X.',
  },
  {
    q: 'How does voting work?',
    a: 'Developers vote for tools launching that week. You have to sign in (GitHub or Google) to vote or comment, which keeps the votes from real people. The tools with the most votes at the end of the week are the winners.',
  },
  {
    q: 'What do weekly winners get?',
    a: 'Winners are featured in the weekly DevHunt newsletter, get a mention on DevHunt social channels and receive a winner badge they can show on their site.',
  },
  {
    q: 'What kinds of tools can launch on DevHunt?',
    a: 'Tools for developers: open-source projects, APIs and SDKs, frameworks and libraries, IDEs and editors, CLIs, testing, monitoring, DevOps, databases, auth, AI agents and MCP servers, and similar. Tools that are not for developers, NSFW tools, and services that sell fake engagement are not accepted.',
  },
  {
    q: 'How is DevHunt different from Product Hunt?',
    a: 'Product Hunt covers every kind of product and launches compete daily. DevHunt is only for developer tools, launches run for a whole week, voters are developers, and the platform itself is open source on GitHub.',
  },
  {
    q: 'Do I get a backlink from DevHunt?',
    a: 'Every tool page links to the tool\'s website. Links on free listings are nofollow; paid launches get a permanent dofollow link.',
  },
  {
    q: 'Can I advertise on DevHunt?',
    a: 'Yes. You can sponsor a spot on the home page or at the top of the weekly newsletter. See the Advertise page for audience numbers and prices.',
  },
  {
    q: 'Who runs DevHunt?',
    a: 'DevHunt was started by John Rush and a small group of developers. The code is public on GitHub, and contributions are welcome.',
  },
];

const STRUCTURED_DATA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
};

export default function FaqPage() {
  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(STRUCTURED_DATA) }} />
      <div className="container-custom-screen mt-10">
        <PageHeader eyebrow="FAQ" title="Frequently asked questions" />
      </div>
      <article className="container-custom-screen mt-8 prose prose-invert text-[15px] leading-7">
        {FAQ.map(({ q, a }) => (
          <section key={q}>
            <h2>{q}</h2>
            <p>{a}</p>
          </section>
        ))}
        <p>
          More questions? Read <Link href="/the-story">about DevHunt</Link>, see <Link href="/advertise">advertising options</Link>, or ask{' '}
          <a href="https://x.com/johnrush" rel="nofollow noopener">John on X</a>.
        </p>
      </article>
    </div>
  );
}
