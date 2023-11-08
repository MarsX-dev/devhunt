import { createServerClient } from '@/utils/supabase/server';
import ProductsService from '@/utils/supabase/services/products';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { username } = await req.json();
  console.log(username);

  //   const browserService = createServerClient();
  //   const profileService = new ProductsService(browserService);
  //   const profile = await profileService.getByUsername(username);

  //   if (profile) {
  //     const tools = await new ProductsService(browserService).getUserProductsById(profile?.id);

  //     const activity = await profileService.getUserActivityById(profile?.id);
  //     const votedTools = await profileService.getUserVoteTools(profile?.id);

  //     return NextResponse.json({ profile, tools, activity, votedTools });
  //   } else {
  //     return NextResponse.json({ profile: false });
  //   }
}
