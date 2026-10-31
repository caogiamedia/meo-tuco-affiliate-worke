'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  Activity, ArrowUpRight, Bot, CheckCircle2, Clock3, ExternalLink,
  FileText, Link2, ListTodo, LogOut, Package, PawPrint, Sparkles, Wallet,
} from 'lucide-react';

type Product = {
  id: string; name: string; category: string | null; source_url: string;
  status: string; ai_score: number | null; created_at: string;
};
type Task = {
  id: string; title: string; status: string; created_at: string; error: string | null;
};
type Post = {
  id: string; title: string | null; channel: string; status: string; created_at: string;
};
type Props = { email: string; products: Product[]; tasks: Task[]; posts: Post[] };

function formatDate(value: string) {
  return new Date(value).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}
function statusLabel(status: string) {
  const labels: Record<string, string> = {
    pending_approval: 'Chờ duyệt', waiting_approval: 'Chờ duyệt',
    completed: 'Hoàn thành', done: 'Hoàn thành', processing: 'Đang xử lý',
    running: 'Đang xử lý', failed: 'Có lỗi', pending: 'Đang chờ',
    approved: 'Đã duyệt', published: 'Đã đăng',
  };
  return labels[status] || status.replace(/_/g, ' ');
}
function statusClass(status: string) {
  if (['completed', 'done', 'approved', 'published'].includes(status)) return 'tuco-status success';
  if (status === 'failed') return 'tuco-status danger';
  if (['processing', 'running'].includes(status)) return 'tuco-status working';
  return 'tuco-status pending';
}

export default function AgentConsole({ email, products, tasks, posts }: Props) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('');
  const [facts, setFacts] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<any>(null);

  const pendingPosts = posts.filter(post =>
    ['pending_approval', 'pending', 'waiting_approval'].includes(post.status)
  ).length;
  const completedTasks = tasks.filter(task =>
    ['completed', 'done'].includes(task.status)
  ).length;

  async function run(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage('Tuco đang đọc thông tin sản phẩm và chuẩn bị nội dung...');
    setResult(null);
    try {
      const response = await fetch('/api/agent/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, sourceUrl: url, category, facts }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Không thể chạy AI Agent');
      setResult(data);
      setMessage('Tuco đã hoàn thành nhiệm vụ. Bản nháp đã được lưu.');
      setName(''); setUrl(''); setCategory(''); setFacts('');
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Đã xảy ra lỗi khi chạy AI.');
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace('/login');
    router.refresh();
  }

  return (
    <main className="tuco-workspace">
      <header className="tuco-topbar">
        <Link href="/agent" className="tuco-brand">
          <span className="tuco-brand-icon"><img src="/tuco.png" alt="Mèo Tuco" /></span>
          <span><strong>MÈO TUCO</strong><small>KIẾM TIỀN NUÔI SEN !</small></span>
        </Link>
        <div className="tuco-topbar-right">
          <Link href="/content" className="tuco-nav-link"><FileText size={15} /> Quản lý nội dung</Link>
          <div className="tuco-online"><span /> TUCO ĐANG TRỰC TUYẾN</div>
          <div className="tuco-account">
            <span className="tuco-account-avatar">{email.charAt(0).toUpperCase()}</span>
            <span className="tuco-account-email">{email}</span>
          </div>
          <button className="tuco-logout" onClick={logout}><LogOut size={15} />Đăng xuất</button>
        </div>
      </header>

      <div className="tuco-page">
        <section className="tuco-hero">
          <div className="tuco-hero-content">
            <div className="tuco-eyebrow"><Sparkles size={14} /> AI AFFILIATE WORKSPACE</div>
            <h1>Xin chào, sen!<br /><span>Hôm nay Tuco làm gì nào?</span></h1>
            <p>Giao nhiệm vụ cho Tuco. Mình sẽ phân tích sản phẩm, chuẩn bị nội dung và chờ sen duyệt trước khi đăng.</p>
            <div className="tuco-hero-tags">
              <span><Bot size={14} /> AI Assistant</span>
              <span><CheckCircle2 size={14} /> Chờ sen phê duyệt</span>
            </div>
          </div>
          <div className="tuco-office">
            <div className="tuco-office-window"><span /><span /><span /></div>
            <div className="tuco-office-shelf"><i /><i /><i /></div>
            <div className="tuco-office-monitor">
              <div className="tuco-monitor-top"><span /><span /><span /></div>
              <div className="tuco-monitor-content"><b>MY WORKSPACE</b><i /><i /><i /><small>AI is working...</small></div>
            </div>
            <div className="tuco-office-desk" />
            <div className="tuco-hero-cat"><img src="/tuco.png" alt="Mèo Tuco" /></div>
            <div className="tuco-speech"><span>Meow!</span>Sen giao việc đi, để Tuco lo.</div>
            <div className="tuco-office-caption"><span className="tuco-pulse" />TUCO&apos;S OFFICE · WORKING MODE</div>
          </div>
        </section>

        <section className="tuco-stats">
          <div className="tuco-stat-card"><div className="tuco-stat-icon orange"><Package size={19} /></div><div><small>Sản phẩm đã lưu</small><strong>{products.length}</strong><span>Trong danh sách gần đây</span></div></div>
          <div className="tuco-stat-card"><div className="tuco-stat-icon blue"><FileText size={19} /></div><div><small>Bản nháp nội dung</small><strong>{posts.length}</strong><span>{pendingPosts} bản đang chờ duyệt</span></div></div>
          <div className="tuco-stat-card"><div className="tuco-stat-icon purple"><ListTodo size={19} /></div><div><small>Nhiệm vụ đã ghi nhận</small><strong>{tasks.length}</strong><span>{completedTasks} nhiệm vụ hoàn thành</span></div></div>
          <div className="tuco-stat-card"><div className="tuco-stat-icon green"><Wallet size={19} /></div><div><small>Doanh thu Affiliate</small><strong className="tuco-stat-na">Chưa kết nối</strong><span>Chờ dữ liệu báo cáo xác minh</span></div></div>
        </section>

        <div className="tuco-section-heading">
          <div><span className="tuco-section-kicker">LET&apos;S GET TO WORK</span><h2><PawPrint size={21} /> Bàn làm việc của Tuco</h2><p>Một nhiệm vụ mới, một cơ hội Affiliate mới.</p></div>
          <div className="tuco-date"><Clock3 size={15} />{new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</div>
        </div>

        <section className="tuco-main-grid">
          <form className="tuco-card tuco-task-form" onSubmit={run}>
            <div className="tuco-card-heading">
              <div className="tuco-heading-icon"><Link2 size={19} /></div>
              <div><h3>Giao nhiệm vụ mới</h3><p>Đưa sản phẩm cho Tuco phân tích</p></div>
              <span className="tuco-ai-ready"><span /> AI READY</span>
            </div>
            <label>Tên sản phẩm <em>*</em><input required value={name} onChange={e => setName(e.target.value)} placeholder="Ví dụ: Bỉm Gooby quần size L" /></label>
            <label>Link Shopee Affiliate <em>*</em><input required type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://s.shopee.vn/..." /></label>
            <label>Danh mục sản phẩm<input value={category} onChange={e => setCategory(e.target.value)} placeholder="Mẹ & bé, gia dụng, làm đẹp..." /></label>
            <label>Thông tin đã xác minh<textarea value={facts} onChange={e => setFacts(e.target.value)} rows={5} placeholder="Nhập giá bán, quy cách, chất liệu, ưu điểm do nhà bán cung cấp... Chỉ nhập thông tin có thật." /></label>
            <div className="tuco-trust-note"><Sparkles size={17} /><span>Tuco chỉ sử dụng thông tin sen cung cấp. Không tự bịa giá, hoa hồng, chứng nhận hoặc công dụng sản phẩm.</span></div>
            <button className="tuco-run-button" disabled={busy}>
              {busy ? <><span className="tuco-spinner" /> TUCO ĐANG XỬ LÝ...</> : <>GIAO NHIỆM VỤ CHO TUCO <Sparkles size={17} /></>}
            </button>
            {message && <div className={`tuco-feedback ${result ? 'success' : ''}`}>{result ? <CheckCircle2 size={17} /> : <Activity size={17} />}<span>{message}</span></div>}
            {result && <div className="tuco-ai-result"><div className="tuco-ai-result-label"><CheckCircle2 size={15} /> KẾT QUẢ PHÂN TÍCH</div><strong>{result.analysis?.seo_title || 'Đã tạo bản phân tích'}</strong><p>{result.analysis?.product_summary}</p>{typeof result.analysis?.score === 'number' && <span>Điểm tiềm năng: {result.analysis.score}/100</span>}</div>}
          </form>

          <div className="tuco-right-column">
            <section className="tuco-card">
              <div className="tuco-card-heading"><div className="tuco-heading-icon blue"><FileText size={19} /></div><div><h3>Nội dung Tuco vừa tạo</h3><p>Bản nháp cần sen duyệt trước khi đăng</p></div><span className="tuco-count">{posts.length}</span></div>
              {posts.length ? <div className="tuco-record-list">{posts.map(post => <article className="tuco-record" key={post.id}><div className="tuco-record-symbol"><FileText size={16} /></div><div className="tuco-record-main"><strong>{post.title || 'Bản nháp chưa có tiêu đề'}</strong><small>{post.channel.toUpperCase()} · {formatDate(post.created_at)}</small></div><span className={statusClass(post.status)}>{statusLabel(post.status)}</span></article>)}</div> : <div className="tuco-empty"><div className="tuco-empty-icon"><FileText size={23} /></div><strong>Bàn nội dung đang trống</strong><p>Giao nhiệm vụ đầu tiên để Tuco bắt đầu tạo bản nháp cho sen nhé!</p></div>}
            </section>
            <section className="tuco-card">
              <div className="tuco-card-heading"><div className="tuco-heading-icon purple"><Clock3 size={19} /></div><div><h3>Nhật ký công việc</h3><p>Những việc Tuco đã thực hiện</p></div><span className="tuco-count">{tasks.length}</span></div>
              {tasks.length ? <div className="tuco-record-list">{tasks.map(task => <article className="tuco-record task-record" key={task.id}><div className="tuco-record-symbol"><ListTodo size={16} /></div><div className="tuco-record-main"><strong>{task.title}</strong><small>{formatDate(task.created_at)}</small>{task.error && <small className="tuco-error-text">{task.error}</small>}</div><span className={statusClass(task.status)}>{statusLabel(task.status)}</span></article>)}</div> : <div className="tuco-empty compact"><div className="tuco-empty-icon"><Clock3 size={22} /></div><strong>Chưa có nhật ký</strong><p>Mọi nhiệm vụ của Tuco sẽ được lưu lại tại đây.</p></div>}
            </section>
          </div>
        </section>

        <section className="tuco-card tuco-products">
          <div className="tuco-card-heading"><div className="tuco-heading-icon orange"><Package size={19} /></div><div><h3>Kho sản phẩm của sen</h3><p>Danh sách sản phẩm Tuco đã tiếp nhận và lưu lại</p></div><span className="tuco-count">{products.length} sản phẩm</span></div>
          {products.length ? <div className="tuco-table-wrap"><table className="tuco-table"><thead><tr><th>SẢN PHẨM</th><th>DANH MỤC</th><th>ĐIỂM AI</th><th>TRẠNG THÁI</th><th>NGÀY TẠO</th><th>LIÊN KẾT</th></tr></thead><tbody>{products.map(product => <tr key={product.id}><td><div className="tuco-product-name"><span><Package size={16} /></span><strong>{product.name}</strong></div></td><td>{product.category || 'Chưa phân loại'}</td><td>{product.ai_score !== null ? `${product.ai_score}/100` : '—'}</td><td><span className={statusClass(product.status)}>{statusLabel(product.status)}</span></td><td>{formatDate(product.created_at)}</td><td><a href={product.source_url} target="_blank" rel="noreferrer" aria-label="Mở sản phẩm"><ExternalLink size={16} /></a></td></tr>)}</tbody></table></div> : <div className="tuco-empty"><div className="tuco-empty-icon"><Package size={23} /></div><strong>Kho sản phẩm chưa có dữ liệu</strong><p>Sản phẩm đầu tiên sẽ xuất hiện ở đây sau khi sen giao nhiệm vụ.</p></div>}
        </section>

        <footer className="tuco-footer">
          <div className="tuco-footer-brand"><img src="/tuco.png" alt="Tuco" /><span>Mèo Tuco kiếm tiền nuôi sen !</span></div>
          <p><ArrowUpRight size={13} />AI Affiliate Worker · Số liệu thu nhập chỉ hiển thị khi có dữ liệu Affiliate đã xác minh.</p>
        </footer>
      </div>
    </main>
  );
}
