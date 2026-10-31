'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Activity, AlertCircle, ArrowLeft, Bot, CheckCircle2, Clock3, ExternalLink,
  FileText, Filter, ListTodo, LogOut, Package, Search, Sparkles, XCircle,
} from 'lucide-react';

type Task = {
  id: string; title: string; task_type: string; input: any; output: any;
  status: string; error: string | null; created_at: string; started_at: string | null;
  completed_at: string | null; priority: number;
};
type Log = {
  id: string; event: string; level: string; message: string; metadata: any; created_at: string;
};
type Props = { email: string; initialTasks: Task[]; initialLogs: Log[]; loadError: string | null };
type FilterStatus = 'all' | 'running' | 'waiting_approval' | 'completed' | 'failed' | 'queued' | 'cancelled';

const statusText: Record<string, string> = {
  queued: 'Đang chờ', running: 'Đang xử lý', waiting_approval: 'Chờ sen duyệt',
  completed: 'Hoàn thành', failed: 'Thất bại', cancelled: 'Đã hủy',
};
function statusStyle(status: string) {
  if (status === 'completed') return 'tc-status green';
  if (status === 'failed') return 'tc-status red';
  if (status === 'running') return 'tc-status blue';
  if (status === 'waiting_approval') return 'tc-status orange';
  return 'tc-status gray';
}
function dateText(value: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function safeText(value: any, fallback = 'Chưa có dữ liệu') {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

export default function TaskCenter({ email, initialTasks, initialLogs, loadError }: Props) {
  const router = useRouter();
  const [tasks] = useState(initialTasks);
  const [logs] = useState(initialLogs);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(initialTasks[0]?.id ?? '');
  const [tab, setTab] = useState<'result' | 'logs'>('result');

  const filtered = useMemo(() => tasks.filter(task => {
    const matchesStatus = filter === 'all' || task.status === filter;
    const q = search.trim().toLocaleLowerCase('vi-VN');
    const matchesSearch = !q || `${task.title} ${task.task_type}`.toLocaleLowerCase('vi-VN').includes(q);
    return matchesStatus && matchesSearch;
  }), [tasks, filter, search]);
  const selected = tasks.find(task => task.id === selectedId) ?? filtered[0] ?? null;
  const counts = useMemo(() => ({
    all: tasks.length,
    running: tasks.filter(t => t.status === 'running').length,
    waiting: tasks.filter(t => t.status === 'waiting_approval').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    failed: tasks.filter(t => t.status === 'failed').length,
  }), [tasks]);

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace('/login');
    router.refresh();
  }

  const analysis = selected?.output?.analysis ?? null;
  const input = selected?.input ?? {};
  const output = selected?.output ?? {};
  const outputPosts = Array.isArray(output.posts) ? output.posts : [];
  const taskLogs = selected ? logs.filter(log => log.metadata?.task_id === selected.id) : [];

  return (
    <main className="tuco-workspace task-workspace">
      <header className="tuco-topbar">
        <Link href="/agent" className="tuco-brand"><span className="tuco-brand-icon"><img src="/tuco.png" alt="Mèo Tuco" /></span><span><strong>MÈO TUCO</strong><small>KIẾM TIỀN NUÔI SEN !</small></span></Link>
        <div className="tuco-topbar-right">
          <Link href="/agent" className="tuco-nav-link"><ArrowLeft size={15} /> Dashboard</Link>
          <Link href="/content" className="tuco-nav-link"><FileText size={15} /> Nội dung</Link>
          <div className="tuco-account"><span className="tuco-account-avatar">{email.charAt(0).toUpperCase()}</span><span className="tuco-account-email">{email}</span></div>
          <button className="tuco-logout" onClick={logout}><LogOut size={15} /> Đăng xuất</button>
        </div>
      </header>

      <div className="tuco-page">
        <section className="tc-hero">
          <div><div className="tuco-eyebrow"><Bot size={14} /> TUCO TASK CENTER</div><h1>Trung tâm <span>điều hành nhiệm vụ</span></h1><p>Theo dõi từng nhiệm vụ Tuco nhận từ sen, kết quả Gemini và nhật ký xử lý.</p></div>
          <div className="tc-hero-cat"><img src="/tuco.png" alt="Mèo Tuco" /><div><Sparkles size={13} /> Tuco luôn báo cáo đúng dữ liệu</div></div>
        </section>

        <section className="tc-stats">
          <div><span className="tc-stat-icon"><ListTodo size={18} /></span><small>Tổng nhiệm vụ</small><strong>{counts.all}</strong></div>
          <div><span className="tc-stat-icon blue"><Activity size={18} /></span><small>Đang xử lý</small><strong>{counts.running}</strong></div>
          <div><span className="tc-stat-icon orange"><Clock3 size={18} /></span><small>Chờ duyệt</small><strong>{counts.waiting}</strong></div>
          <div><span className="tc-stat-icon green"><CheckCircle2 size={18} /></span><small>Hoàn thành</small><strong>{counts.completed}</strong></div>
          <div><span className="tc-stat-icon red"><AlertCircle size={18} /></span><small>Thất bại</small><strong>{counts.failed}</strong></div>
        </section>

        {loadError && <div className="tc-alert"><XCircle size={17} /> Không tải được dữ liệu: {loadError}</div>}

        <div className="tc-layout">
          <section className="tuco-card tc-list-card">
            <div className="tc-heading"><div><span className="tuco-section-kicker">MISSION CONTROL</span><h2><ListTodo size={20} /> Danh sách nhiệm vụ</h2></div><span className="tuco-count">{filtered.length} nhiệm vụ</span></div>
            <div className="tc-toolbar"><div className="tc-search"><Search size={16} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm nhiệm vụ..." /></div><label className="tc-filter"><Filter size={14} /><select value={filter} onChange={e => setFilter(e.target.value as FilterStatus)}><option value="all">Tất cả trạng thái</option><option value="queued">Đang chờ</option><option value="running">Đang xử lý</option><option value="waiting_approval">Chờ duyệt</option><option value="completed">Hoàn thành</option><option value="failed">Thất bại</option><option value="cancelled">Đã hủy</option></select></label></div>
            <div className="tc-task-list">
              {filtered.length ? filtered.map(task => <button type="button" key={task.id} className={`tc-task-item ${selected?.id === task.id ? 'active' : ''}`} onClick={() => { setSelectedId(task.id); setTab('result'); }}>
                <span className="tc-task-icon"><Bot size={17} /></span><span className="tc-task-copy"><strong>{task.title}</strong><small>{dateText(task.created_at)} · {task.task_type}</small></span><span className={statusStyle(task.status)}>{statusText[task.status] ?? task.status}</span>
              </button>) : <div className="tc-empty"><ListTodo size={25} /><strong>Chưa có nhiệm vụ phù hợp</strong><p>Thử đổi bộ lọc hoặc giao nhiệm vụ mới cho Tuco.</p><Link href="/agent">Giao nhiệm vụ</Link></div>}
            </div>
          </section>

          <section className="tuco-card tc-detail-card">
            {selected ? <>
              <div className="tc-heading tc-detail-heading"><div><span className="tuco-section-kicker">MISSION DETAILS</span><h2>{selected.title}</h2></div><span className={statusStyle(selected.status)}>{statusText[selected.status] ?? selected.status}</span></div>
              <div className="tc-timeline"><div><small>Thời điểm tạo</small><strong>{dateText(selected.created_at)}</strong></div><div><small>Bắt đầu xử lý</small><strong>{dateText(selected.started_at)}</strong></div><div><small>Kết thúc</small><strong>{dateText(selected.completed_at)}</strong></div></div>
              <div className="tc-detail-tabs"><button className={tab === 'result' ? 'active' : ''} onClick={() => setTab('result')}><Sparkles size={14} /> Kết quả AI</button><button className={tab === 'logs' ? 'active' : ''} onClick={() => setTab('logs')}><Activity size={14} /> Nhật ký ({taskLogs.length})</button></div>
              {tab === 'result' ? <div className="tc-result-content">
                <h3>Thông tin sen đã giao</h3><div className="tc-info-grid"><div><small>Tên sản phẩm</small><strong>{safeText(input.name)}</strong></div><div><small>Danh mục</small><strong>{safeText(input.category, 'Chưa phân loại')}</strong></div><div className="wide"><small>Link sản phẩm</small><a href={input.sourceUrl || '#'} target="_blank" rel="noreferrer">{safeText(input.sourceUrl)} <ExternalLink size={12} /></a></div><div className="wide"><small>Thông tin bổ sung</small><p>{safeText(input.facts, 'Sen chưa cung cấp thông tin bổ sung.')}</p></div></div>
                {selected.error && <div className="tc-error-box"><AlertCircle size={16} /><div><strong>Nhiệm vụ gặp lỗi</strong><p>{selected.error}</p></div></div>}
                {analysis ? <><div className="tc-analysis-head"><h3>Kết quả phân tích từ Gemini</h3><div className="tc-score"><strong>{Number(analysis.score ?? 0)}</strong><small>/100 điểm</small></div></div><p className="tc-summary">{safeText(analysis.product_summary)}</p><div className="tc-info-grid"><div><small>Đối tượng phù hợp</small><p>{safeText(analysis.audience)}</p></div><div><small>Nhận định của Tuco</small><p>{safeText(analysis.score_reason)}</p></div></div><h4>Điểm nổi bật do AI tổng hợp</h4><ul className="tc-benefits">{(Array.isArray(analysis.key_benefits) ? analysis.key_benefits : []).map((item: string, index: number) => <li key={index}>{item}</li>)}</ul><h4>Thông tin cần xác minh</h4>{Array.isArray(analysis.claims_to_verify) && analysis.claims_to_verify.length ? <ul className="tc-verify">{analysis.claims_to_verify.map((item: string, index: number) => <li key={index}>{item}</li>)}</ul> : <p className="tc-muted">Gemini không đánh dấu thêm thông tin cần xác minh.</p>}<h4>Đề xuất của Tuco</h4><p className="tc-summary">{safeText(analysis.recommended_action)}</p><div className="tc-generated-posts"><h3><FileText size={17} /> Bản nháp được tạo ({outputPosts.length})</h3>{outputPosts.map((post: any) => <div key={post.id} className="tc-generated-row"><span>{post.channel}</span><strong>{post.title || 'Bản nháp'}</strong><Link href="/content">Mở Content Studio <ExternalLink size={12} /></Link></div>)}</div></> : !selected.error ? <div className="tc-empty"><Sparkles size={24} /><strong>Chưa có kết quả phân tích</strong><p>Nhiệm vụ có thể chưa chạy xong hoặc dữ liệu đầu ra chưa được lưu.</p></div> : null}
              </div> : <div className="tc-log-list">{taskLogs.length ? taskLogs.map(log => <article key={log.id}><span className={log.level === 'error' ? 'tc-log-dot error' : 'tc-log-dot'} /><div><strong>{log.event.replace(/_/g, ' ')}</strong><p>{log.message}</p><small>{dateText(log.created_at)}</small></div></article>) : <div className="tc-empty"><Activity size={24} /><strong>Chưa có nhật ký riêng cho nhiệm vụ này</strong><p>Nhật ký hệ thống sẽ xuất hiện ở đây khi có sự kiện được ghi nhận.</p></div>}</div>}
            </> : <div className="tc-empty"><Bot size={28} /><strong>Chọn một nhiệm vụ</strong><p>Chọn nhiệm vụ bên trái để xem chi tiết và kết quả AI.</p></div>}
          </section>
        </div>
        <footer className="tuco-footer"><div className="tuco-footer-brand"><img src="/tuco.png" alt="Tuco" /><span>Mèo Tuco kiếm tiền nuôi sen !</span></div><p>Không tự chạy lại nhiệm vụ — sen luôn kiểm soát lượt dùng Gemini.</p></footer>
      </div>
    </main>
  );
}
