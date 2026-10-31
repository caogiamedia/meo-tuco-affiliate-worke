'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  ArrowLeft, Check, CheckCircle2, Clock3, ExternalLink, FileText,
  Filter, Globe2, Instagram, Pencil, Save, Search, Send, X, XCircle,
} from 'lucide-react';

type Post = {
  id: string;
  title: string | null;
  body: string | null;
  channel: string;
  format: string;
  status: string;
  scheduled_at: string | null;
  published_at: string | null;
  created_at: string;
  product_id: string | null;
};
type Props = { email: string; initialPosts: Post[]; loadError: string | null };
type FilterStatus = 'all' | 'pending_approval' | 'approved' | 'scheduled' | 'published' | 'rejected' | 'draft';

const channelNames: Record<string, string> = {
  website: 'Website', facebook: 'Facebook', tiktok: 'TikTok', pinterest: 'Pinterest',
};
const statusNames: Record<string, string> = {
  draft: 'Bản nháp', pending_approval: 'Chờ duyệt', approved: 'Đã duyệt',
  scheduled: 'Đã lên lịch', published: 'Đã đăng', rejected: 'Từ chối', failed: 'Lỗi đăng',
};
function dateLabel(value: string | null) {
  if (!value) return 'Chưa thiết lập';
  return new Date(value).toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}
function statusClass(status: string) {
  if (status === 'published' || status === 'approved') return 'cm-status green';
  if (status === 'rejected' || status === 'failed') return 'cm-status red';
  if (status === 'pending_approval' || status === 'scheduled') return 'cm-status orange';
  return 'cm-status gray';
}

export default function ContentManager({ email, initialPosts, loadError }: Props) {
  const router = useRouter();
  const [posts, setPosts] = useState(initialPosts);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [noticeError, setNoticeError] = useState(false);

  const filtered = useMemo(() => posts.filter(post => {
    const matchesStatus = statusFilter === 'all' || post.status === statusFilter;
    const matchesChannel = channelFilter === 'all' || post.channel === channelFilter;
    const term = search.trim().toLocaleLowerCase('vi-VN');
    const matchesSearch = !term || `${post.title ?? ''} ${post.body ?? ''}`.toLocaleLowerCase('vi-VN').includes(term);
    return matchesStatus && matchesChannel && matchesSearch;
  }), [posts, statusFilter, channelFilter, search]);

  const counts = useMemo(() => ({
    all: posts.length,
    pending: posts.filter(p => p.status === 'pending_approval').length,
    approved: posts.filter(p => p.status === 'approved').length,
    published: posts.filter(p => p.status === 'published').length,
  }), [posts]);

  function beginEdit(post: Post) {
    setEditing(post.id);
    setEditTitle(post.title ?? '');
    setEditBody(post.body ?? '');
    setNotice('');
  }

  async function saveEdit(post: Post) {
    setBusyId(post.id);
    setNotice('');
    const supabase = createClient();
    const { error } = await supabase.from('content_posts').update({
      title: editTitle.trim() || null,
      body: editBody,
    }).eq('id', post.id);
    if (error) {
      setNotice(`Không lưu được nội dung: ${error.message}`);
      setNoticeError(true);
    } else {
      setPosts(current => current.map(p => p.id === post.id ? { ...p, title: editTitle.trim() || null, body: editBody } : p));
      setEditing(null);
      setNotice('Đã lưu nội dung vào Supabase.');
      setNoticeError(false);
      router.refresh();
    }
    setBusyId(null);
  }

  async function changeStatus(post: Post, nextStatus: 'approved' | 'rejected') {
    const action = nextStatus === 'approved' ? 'duyệt' : 'từ chối';
    if (!window.confirm(`Bạn chắc chắn muốn ${action} bài viết này?`)) return;
    setBusyId(post.id);
    setNotice('');
    const supabase = createClient();
    const { error } = await supabase.from('content_posts').update({ status: nextStatus }).eq('id', post.id);
    if (error) {
      setNotice(`Không thể cập nhật trạng thái: ${error.message}`);
      setNoticeError(true);
      setBusyId(null);
      return;
    }
    // Keep the approval queue in sync when an approval record exists.
    const { error: approvalError } = await supabase.from('approvals').update({
      status: nextStatus,
      reviewed_at: new Date().toISOString(),
    }).eq('content_post_id', post.id).eq('status', 'pending');
    setPosts(current => current.map(p => p.id === post.id ? { ...p, status: nextStatus } : p));
    setNotice(approvalError
      ? `Bài viết đã ${action}, nhưng hàng đợi phê duyệt chưa đồng bộ: ${approvalError.message}`
      : nextStatus === 'approved'
        ? 'Đã duyệt bài viết. Bài chưa được đăng tự động.'
        : 'Đã từ chối bài viết.');
    setNoticeError(Boolean(approvalError));
    setBusyId(null);
    router.refresh();
  }

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace('/login');
    router.refresh();
  }

  return (
    <main className="tuco-workspace content-workspace">
      <header className="tuco-topbar">
        <Link href="/agent" className="tuco-brand">
          <span className="tuco-brand-icon"><img src="/tuco.png" alt="Mèo Tuco" /></span>
          <span><strong>MÈO TUCO</strong><small>KIẾM TIỀN NUÔI SEN !</small></span>
        </Link>
        <div className="tuco-topbar-right">
          <Link href="/agent" className="tuco-nav-link"><ArrowLeft size={15} /> Dashboard</Link>
          <div className="tuco-account"><span className="tuco-account-avatar">{email.charAt(0).toUpperCase()}</span><span className="tuco-account-email">{email}</span></div>
          <button className="tuco-logout" onClick={logout}>Đăng xuất</button>
        </div>
      </header>

      <div className="tuco-page">
        <section className="cm-hero">
          <div>
            <div className="tuco-eyebrow"><FileText size={14} /> TUCO CONTENT STUDIO</div>
            <h1>Trung tâm <span>quản lý nội dung</span></h1>
            <p>Kiểm tra, chỉnh sửa và duyệt mọi bản nháp trước khi đưa lên các kênh Affiliate.</p>
          </div>
          <div className="cm-hero-cat"><img src="/tuco.png" alt="Mèo Tuco" /></div>
        </section>

        <section className="cm-summary">
          <div><small>Tổng nội dung</small><strong>{counts.all}</strong></div>
          <div><small>Chờ duyệt</small><strong className="orange-text">{counts.pending}</strong></div>
          <div><small>Đã duyệt</small><strong className="green-text">{counts.approved}</strong></div>
          <div><small>Đã đăng</small><strong>{counts.published}</strong></div>
        </section>

        {notice && <div className={`cm-notice ${noticeError ? 'error' : ''}`}>{noticeError ? <XCircle size={17} /> : <CheckCircle2 size={17} />}{notice}</div>}
        {loadError && <div className="cm-notice error"><XCircle size={17} />Không tải được dữ liệu: {loadError}</div>}

        <section className="tuco-card cm-library">
          <div className="cm-heading-row">
            <div><span className="tuco-section-kicker">CONTENT LIBRARY</span><h2><FileText size={20} /> Kho nội dung của Tuco</h2><p>Chọn bài viết để xem, chỉnh sửa hoặc duyệt.</p></div>
            <div className="cm-total"><FileText size={16} /> {filtered.length} bài viết</div>
          </div>

          <div className="cm-toolbar">
            <div className="cm-search"><Search size={17} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm theo tiêu đề hoặc nội dung..." /></div>
            <label className="cm-select-wrap"><Filter size={15} /><select value={channelFilter} onChange={e => setChannelFilter(e.target.value)}><option value="all">Tất cả kênh</option><option value="website">Website</option><option value="facebook">Facebook</option><option value="tiktok">TikTok</option><option value="pinterest">Pinterest</option></select></label>
          </div>

          <div className="cm-tabs">
            {([['all','Tất cả'],['pending_approval','Chờ duyệt'],['approved','Đã duyệt'],['scheduled','Đã lên lịch'],['published','Đã đăng'],['rejected','Từ chối'],['draft','Bản nháp']] as [FilterStatus,string][]).map(([key,label]) => (
              <button key={key} className={statusFilter === key ? 'active' : ''} onClick={() => setStatusFilter(key)}>{label}{key === 'pending_approval' && counts.pending > 0 && <b>{counts.pending}</b>}</button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="cm-empty"><div><FileText size={27} /></div><strong>Chưa tìm thấy bài viết</strong><p>Thử đổi bộ lọc hoặc giao nhiệm vụ mới cho Tuco từ Dashboard.</p><Link href="/agent">Quay lại Dashboard</Link></div>
          ) : (
            <div className="cm-post-list">
              {filtered.map(post => (
                <article className="cm-post" key={post.id}>
                  <div className="cm-post-top">
                    <div className={`cm-channel-icon ${post.channel}`}><Globe2 size={18} /></div>
                    <div className="cm-post-heading"><div><span className="cm-channel-name">{channelNames[post.channel] ?? post.channel}</span><span className={statusClass(post.status)}>{statusNames[post.status] ?? post.status}</span></div><small>Tạo lúc {dateLabel(post.created_at)} · Định dạng: {post.format || 'post'}</small></div>
                    <div className="cm-post-actions">
                      {post.status === 'pending_approval' && <><button className="cm-action approve" disabled={busyId === post.id} onClick={() => changeStatus(post, 'approved')}><Check size={15} /> Duyệt</button><button className="cm-action reject" disabled={busyId === post.id} onClick={() => changeStatus(post, 'rejected')}><X size={15} /> Từ chối</button></>}
                      <button className="cm-action edit" onClick={() => editing === post.id ? setEditing(null) : beginEdit(post)}><Pencil size={15} /> {editing === post.id ? 'Đóng' : 'Chỉnh sửa'}</button>
                    </div>
                  </div>

                  {editing === post.id ? (
                    <div className="cm-editor">
                      <label>Tiêu đề<input value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Nhập tiêu đề bài viết" /></label>
                      <label>Nội dung<textarea value={editBody} onChange={e => setEditBody(e.target.value)} rows={9} placeholder="Nội dung bài viết..." /></label>
                      <div className="cm-editor-footer"><span>{editBody.length.toLocaleString('vi-VN')} ký tự</span><button className="cm-action save" disabled={busyId === post.id} onClick={() => saveEdit(post)}><Save size={15} /> {busyId === post.id ? 'Đang lưu...' : 'Lưu thay đổi'}</button></div>
                    </div>
                  ) : (
                    <div className="cm-post-content"><h3>{post.title || 'Bài viết chưa có tiêu đề'}</h3><p>{post.body || 'Bài viết chưa có nội dung.'}</p></div>
                  )}

                  <div className="cm-post-meta">
                    {post.scheduled_at && <span><Clock3 size={13} /> Lịch đăng: {dateLabel(post.scheduled_at)}</span>}
                    {post.published_at && <span><Send size={13} /> Đã đăng: {dateLabel(post.published_at)}</span>}
                    {post.product_id && <span><CheckCircle2 size={13} /> Có liên kết sản phẩm</span>}
                  </div>
                  {post.status === 'approved' && <div className="cm-approved-note"><CheckCircle2 size={14} /> Bài đã được duyệt trong hệ thống, chưa tự động đăng lên kênh.</div>}
                </article>
              ))}
            </div>
          )}
        </section>
        <footer className="tuco-footer"><div className="tuco-footer-brand"><img src="/tuco.png" alt="Tuco" /><span>Mèo Tuco kiếm tiền nuôi sen !</span></div><p>Sen luôn có quyền kiểm tra và duyệt nội dung trước khi đăng.</p></footer>
      </div>
    </main>
  );
}
