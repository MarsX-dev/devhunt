import { ExtendedProduct } from '@/utils/supabase/CustomTypes';

export function simpleToolApiDtoFormatter(t: ExtendedProduct) {
  return {
    id: t.id,
    email: t.email,
    name: t.name,
    description: t.description,
    logo_url: t.logo_url,
    data_added: new Date(t.created_at).toISOString().split('T')[0],
    launch_date: t.launch_date,
    votes_count: t.votes_count || '-',
    devhunt_link: `https://devhunt.org/tool/${t.slug}`,
    link: t.demo_url,
  };
}
