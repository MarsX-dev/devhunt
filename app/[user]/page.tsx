import Avatar from '@/components/ui/Avatar/Avatar'
import { createBrowserClient } from '@/libs/supabase/browser'
import ProfileService from '@/libs/supabase/services/profile'

export default async ({ params: { user } }: { params: { user: string } }) => {
  const username = decodeURIComponent(user).slice(1)
  const profileService = new ProfileService(createBrowserClient())
  const profile = await profileService.getByUsername(username)

  return (
    <div className="container-custom-screen">
      <div className="flex flex-col items-center gap-6 sm:flex-row">
        <Avatar
          className="w-20 h-20 flex-none"
          src={profile?.avatar_url as string}
          alt={profile?.full_name as string}
        />
        <div>
          <h1 className="text-2xl text-slate-50 font-medium">{profile?.full_name}</h1>
          <p className="mt-1 text-sm text-slate-500">{profile?.headline}</p>
        </div>
      </div>
      <p className="mt-6 text-slate-400">{profile?.about}</p>
    </div>
  )
}
