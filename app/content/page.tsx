import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ContentManager from './ui';

export default async function ContentPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data, error } = await supabase
    .from('content_posts')
    .select('id,title,body,channel,format,status,scheduled_at,published_at,created_at,product_id')
    .order('created_at', { ascending: false })
    .limit(100);

  return <ContentManager email={user.email ?? ''} initialPosts={data ?? []} loadError={error?.message ?? null} />;
}
