'use client';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Bot, LockKeyhole, Mail } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e: FormEvent) {
    e.preventDefault(); setBusy(true); setError('');
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) { setError(error.message); return; }
    router.replace('/agent'); router.refresh();
  }
  return <main className="auth-shell"><form className="auth-card" onSubmit={submit}>
    <div className="auth-logo"><img src="/tuco.png" alt="Mèo Tuco"/></div><span className="eyebrow">MÈO TUCO KIẾM TIỀN NUÔI SEN !</span>
    <h1>Đăng nhập Workspace</h1><p>Đăng nhập tài khoản Supabase đã được tạo cho dự án của bạn.</p>
    <label>Email<div className="auth-input"><Mail size={17}/><input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></div></label>
    <label>Mật khẩu<div className="auth-input"><LockKeyhole size={17}/><input type="password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Mật khẩu"/></div></label>
    {error&&<div className="auth-error">{error}</div>}
    <button className="primary auth-submit" disabled={busy}>{busy?'Đang đăng nhập…':'Đăng nhập'}</button>
    <small>Tài khoản được tạo trong Supabase Authentication. Không nhập API key tại đây.</small>
  </form></main>;
}
