import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AgentConsole from './ui';

export default async function AgentPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const [{ data: products }, { data: tasks }, { data: posts }] = await Promise.all([
    supabase.from('products').select('id,name,category,source_url,status,ai_score,created_at').order('created_at',{ascending:false}).limit(20),
    supabase.from('agent_tasks').select('id,title,status,created_at,error').order('created_at',{ascending:false}).limit(10),
    supabase.from('content_posts').select('id,title,channel,status,created_at').order('created_at',{ascending:false}).limit(12),
  ]);
  return <AgentConsole email={user.email ?? ''} products={products ?? []} tasks={tasks ?? []} posts={posts ?? []}/>;
}
