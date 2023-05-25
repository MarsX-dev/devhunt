'use client'

import { IconVote, IconChatBubbleLeft, IconChartBar, IconArrowTopRight } from '@/components/Icons'
import Button from '@/components/ui/Button/Button'
import ButtonUpvote from '@/components/ui/ButtonUpvote'
import {
  CommentForm,
  CommentTextarea,
  CommentUserAvatar,
  CommentFormWrapper,
  Comments,
  Comment,
  CommentUserName,
  CommentDate,
  CommentContext,
  CommentLike,
} from '@/components/ui/Comment'
import { Gallery, GalleryImage } from '@/components/ui/Gallery'
import LinkShiny from '@/components/ui/LinkShiny'
import ProductLogo from '@/components/ui/ProductCard/Product.Logo'
import ProductTitle from '@/components/ui/ProductCard/Product.Title'
import { Stat, StatsWrapper, StatCountItem, StatItem } from '@/components/ui/Stats'
import { TabLink, Tabs } from '@/components/ui/TabsLink'
import { Tag, TagsGroup } from '@/components/ui/TagsGroup'
import Link from 'next/link'
//
import Logo from '@/components/ui/ProductCard/Product.Logo'
import Name from '@/components/ui/ProductCard/Product.Name'
import Tags from '@/components/ui/ProductCard/Product.Tags'
import Title from '@/components/ui/ProductCard/Product.Title'
import Votes from '@/components/ui/ProductCard/Product.Votes'
import ProductCard from '@/components/ui/ProductCard/ProductCard'
import mockproducts from '@/mockproducts'

export default function Page() {
  const product_images = [
    '/product/maxresdefault-1.jpg',
    '/product/maxresdefault-2.jpg',
    '/product/maxresdefault.jpg',
    '/product/wundergraph-opengraph.png',
    '/product/neonwundergraph-1.webp',
    '/product/wunderGraphtt.jpeg',
  ]
  const tabs = [
    {
      name: 'About product',
      hash: '#',
    },
    {
      name: 'Comments',
      hash: '#comments',
    },
    {
      name: 'Launch details',
      hash: '#details',
    },
    {
      name: 'Related launches',
      hash: '#launches',
    },
  ]

  const comments = [
    {
      user: {
        name: 'Andreas',
        avatar: '/images/random-user.jpg',
      },
      date: 'Commented May 21',
      context:
        "Kudos to the team behind WunderGraph for crafting a tool that strikes the perfect balance between simplicity and sophistication. It's refreshing to use a graphing tool that doesn't overwhelm with unnecessary complexity, yet still delivers stunning results.",
    },
    {
      user: {
        name: 'Sidi jeddou',
        avatar: '/images/sidi.jpeg',
      },
      date: 'Commented May 21',
      context:
        'WunderGraph has become my go-to tool for visualizing complex data sets. Its ability to handle large datasets without compromising performance is impressive. I can explore and analyze my data effortlessly, thanks to its robust capabilities.',
    },
    {
      user: {
        name: 'Steven landor',
        avatar: '/images/random-user-3.jpg',
      },
      date: 'Commented May 21',
      context:
        "WunderGraph's customer support is top-notch. Whenever I've had a question or needed assistance, their team has been quick to respond and incredibly helpful. It's refreshing to know that they genuinely care about their users' experience.",
    },
    {
      user: {
        name: 'Karim',
        avatar: '/images/random-user-2.jpg',
      },
      date: 'Commented May 21',
      context:
        "WunderGraph has revolutionized the way I present data. The customization options are mind-blowing, allowing me to tailor every aspect of my graphs to match my branding or desired style. It's like having a personal graphic designer at my fingertips!",
    },
  ]

  const stats = [
    {
      count: 490,
      icon: <IconVote />,
      label: 'Upvotes',
    },
    {
      count: 70,
      icon: <IconChatBubbleLeft />,
      label: 'Comments',
    },
    {
      count: '#3',
      icon: <IconChartBar />,
      label: 'Day rank',
    },
    {
      count: '#14',
      icon: <IconChartBar />,
      label: 'Week rank',
    },
  ]

  return (
    <section className="mt-20 pb-10 space-y-20">
      <div className="container-custom-screen" id="about">
        <ProductLogo
          src="/images/wundergraph.png"
          alt="WunderGraph the next generation Backend For Frontend framework"
        />
        <h1 className="mt-3 text-slate-100 font-medium">WunderGraph</h1>
        <ProductTitle className="mt-1">WunderGraph the next generation Backend For Frontend framework</ProductTitle>
        <div className="text-sm mt-3 flex items-center gap-x-3">
          <LinkShiny href="" target="_balnk" className="flex items-center gap-x-2">
            Live preview
            <IconArrowTopRight />
          </LinkShiny>
          <ButtonUpvote count={490} />
        </div>
      </div>
      <div>
        <Tabs className="sticky top-[3.75rem] z-30 bg-slate-900 md:top-[4.3rem]">
          {tabs.map((item, idx) => (
            <TabLink hash={item.hash} key={idx}>
              {item.name}
            </TabLink>
          ))}
        </Tabs>
        <div className="relative overflow-hidden pb-12">
          <div className="absolute top-0 w-full h-[100px] opacity-40 bg-[linear-gradient(180deg,_rgba(124,_58,_237,_0.06)_0%,_rgba(72,_58,_237,_0)_100%)]"></div>
          <div className="relative container-custom-screen mt-12">
            <div className="prose text-slate-100">
              <p>
                WunderGraph is an open source API developer platform with a focus on developer experience. At its core,
                WunderGraph combines the API gateway pattern with the Backend for Frontend (BFF) patternto create the
                perfect developer experience for working with APIs.
              </p>
              <p>
                WunderGraph can combine all of your services, databases such as Fauna, file storage, identity providers
                (IdPs), and third-party APIs into your own developer toolkit without experiencing vendor lock-in.
              </p>
            </div>
            <div className="mt-6 flex flex-wrap gap-3 items-center">
              <h3 className="text-sm text-slate-400 font-medium">Classified in</h3>
              <TagsGroup>
                <Tag>Dev Tools</Tag>
                <Tag>Open Source</Tag>
                <Tag>Framework</Tag>
              </TagsGroup>
            </div>
          </div>
          <div className="max-w-screen-2xl mt-10 mx-auto sm:px-8">
            <Gallery>
              {product_images.map((item, idx) => (
                <GalleryImage key={idx} src={item} alt="" />
              ))}
            </Gallery>
          </div>
        </div>
      </div>
      <div className="container-custom-screen" id="comments">
        <h3 className="text-slate-50 font-medium">Support and give a Feedback</h3>
        <CommentForm className="mt-12">
          <CommentFormWrapper>
            <CommentUserAvatar src="/images/random-user.jpg" />
            <CommentTextarea placeholder="Write your feedback" />
          </CommentFormWrapper>
          <div className="mt-3 flex justify-end">
            <Button className="text-sm bg-slate-800 hover:bg-slate-700">Comment</Button>
          </div>
        </CommentForm>
        <div className="mt-6">
          <Comments>
            {comments.map((item, idx) => (
              <Comment key={idx}>
                <CommentUserAvatar src={item.user.avatar} />
                <div>
                  <CommentUserName>{item.user.name}</CommentUserName>
                  <CommentDate>{item.date}</CommentDate>
                  <CommentContext className="mt-3">{item.context}</CommentContext>
                  <CommentLike className="mt-2" count={1} />
                </div>
              </Comment>
            ))}
          </Comments>
        </div>
      </div>
      <div className="container-custom-screen" id="details">
        <h3 className="text-slate-50 font-medium">About this launch</h3>
        <p className="text-slate-300 mt-6">
          WunderGraph was hunted by Alexander Isora 🦄 in Design Tools, Developer Tools. Made by Sidi jeddou. Featured
          on March 24th, 2023.
        </p>
        <div className="mt-10">
          <StatsWrapper>
            {stats.map((item, idx) => (
              <Stat key={idx} className="py-4">
                <StatCountItem>{item.count}</StatCountItem>
                <StatItem className="mt-2">
                  {item.icon}
                  {item.label}
                </StatItem>
              </Stat>
            ))}
          </StatsWrapper>
        </div>
      </div>
      <div className="container-custom-screen" id="launches">
        <h3 className="text-slate-50 font-medium">Related launches</h3>
        <ul className="mt-6 grid divide-y divide-slate-800/60 md:grid-cols-2 md:divide-y-0">
          {mockproducts.map((item, idx) => (
            <li key={idx} className="py-3">
              <ProductCard href={item.slug}>
                <Logo src={item.logo} alt={item.title} imgClassName="w-14 h-14" />
                <div className="space-y-1">
                  <Name>{item.name}</Name>
                  <Title className="line-clamp-1 sm:line-clamp-2">{item.title}</Title>
                  <Tags items={['Free', 'Developer Tools']} />
                </div>
              </ProductCard>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
