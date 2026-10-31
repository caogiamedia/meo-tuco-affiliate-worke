import { redirect } from 'next/navigation';

/**
 * The old root page was an unconnected MVP mockup with sidebar buttons that
 * only changed their selected state. Send signed-in users to the real,
 * Supabase-backed workspace instead. The middleware continues to redirect
 * signed-out visitors to /login.
 */
export default function HomePage() {
  redirect('/agent');
}
