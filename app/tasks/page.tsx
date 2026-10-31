import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import TaskCenter from './ui';

export default async function TasksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: tasks, error: taskError }, { data: logs, error: logError }] = await Promise.all([
    supabase.from('agent_tasks')
      .select('id,title,task_type,input,output,status,error,created_at,started_at,completed_at,priority')
      .order('created_at', { ascending: false }).limit(100),
    supabase.from('agent_logs')
      .select('id,event,level,message,metadata,created_at')
      .order('created_at', { ascending: false }).limit(100),
  ]);

  return <TaskCenter email={user.email ?? ''} initialTasks={tasks ?? []}
    initialLogs={logs ?? []} loadError={taskError?.message ?? logError?.message ?? null} />;
}
