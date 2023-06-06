export default async ({ params: { user, slug } }: { params: { user: string; slug: string } }) => {
  console.log(slug);

  // const profileService = new ProfileService(createServerClient())
  // const profile = await profileService.getByUsername(slug)
  // const activity = await profileService.getByUsername(slug)
  return <div className="mt-12 text-slate-50 font-medium text-2xl">...In progress</div>
}
