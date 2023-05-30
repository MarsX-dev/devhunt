'use client'

import { TabLink, Tabs } from '@/components/ui/TabsLink'
import { parseUrl } from 'next/dist/shared/lib/router/utils/parse-url'
import { useParams } from 'next/navigation'
import { ReactNode } from 'react'

const DahboardLayout = ({ children }: { children: ReactNode }) => {
  const { user } = useParams()
  const tabs = [
    {
      name: 'Profile',
      href: `${window.location.pathname}`,
    },
    {
      name: 'Activity',
      href: '/account/Activity',
    },
    {
      name: 'Upvotes',
      href: '/account/upvotes',
    },
  ]

  return (
    <div className="h-screen">
      <Tabs ulClassName="container-custom-screen" className="sticky top-[4.2rem] z-10 bg-slate-900">
        {tabs.map((item, idx) => (
          <TabLink href={item.href} key={idx}>
            {item.name}
          </TabLink>
        ))}
      </Tabs>
      <section className="mt-20">{children}</section>
    </div>
  )
}

export default DahboardLayout
