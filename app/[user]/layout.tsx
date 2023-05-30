import { TabLink, Tabs } from '@/components/ui/TabsLink'
import { ReactNode } from 'react'
import ProfileService from '@/utils/supabase/services/profile'
import { createBrowserClient } from '@/utils/supabase/browser'
import Page404 from '@/components/ui/Page404'
import Avatar from '@/components/ui/Avatar/Avatar'

const DahboardLayout = async ({ params: { user }, children }: { params: { user: string }; children: ReactNode }) => {
  const username = decodeURIComponent(user).slice(1)
  const profileService = new ProfileService(createBrowserClient())
  const profile = await profileService.getByUsername(username)

  const tabs = [
    {
      name: 'Profile',
      href: `/${decodeURIComponent(user)}`,
    },
    {
      name: 'Activity',
      href: `/${decodeURIComponent(user)}/activity`,
    },
    {
      name: 'Upvotes',
      href: `/${decodeURIComponent(user)}/upvotes`,
    },
  ]

  return profile ? (
    <div className="mb-32 min-h-screen">
      <Tabs ulClassName="container-custom-screen" className="sticky pt-2 top-[3.75rem] z-10 bg-slate-900">
        {tabs.map((item, idx) => (
          <TabLink href={item.href} key={idx}>
            {item.name}
          </TabLink>
        ))}
      </Tabs>
      <section className="container-custom-screen mt-20">
        <div className="items-center gap-x-6 sm:flex">
          <Avatar
            className="w-20 h-20 flex-none"
            src={profile?.avatar_url as string}
            alt={profile?.full_name as string}
          />
          <div className="mt-4 sm:mt-0">
            <h1 className="text-2xl text-slate-50 font-medium">{profile?.full_name}</h1>
            <p className="mt-1 text-sm text-slate-400">{profile?.headline}</p>
          </div>
        </div>
        {children}
      </section>
    </div>
  ) : (
    <Page404 />
  )
}

export default DahboardLayout
