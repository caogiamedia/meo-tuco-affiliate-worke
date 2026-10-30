'use client';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Bot, ExternalLink, FileText, Link2, LogOut, Sparkles } from 'lucide-react';

type Product = {id:string;name:string;category:string|null;source_url:string;status:string;ai_score:number|null;created_at:string};
type Task = {id:string;title:string;status:string;created_at:string;error:string|null};
type Post = {id:string;title:string|null;channel:string;status:string;created_at:string};
export default function AgentConsole({email,products,tasks,posts}:{email:string;products:Product[];tasks:Task[];posts:Post[]}) {
 const router=useRouter(); const [name,setName]=useState(''); const [url,setUrl]=useState(''); const [category,setCategory]=useState(''); const [facts,setFacts]=useState(''); const [busy,setBusy]=useState(false); const [message,setMessage]=useState(''); const [result,setResult]=useState<any>(null);
 async function run(e:FormEvent){e.preventDefault();setBusy(true);setMessage('AI đang phân tích link và tạo nội dung…');setResult(null);
  try{const r=await fetch('/api/agent/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,sourceUrl:url,category,facts})});const data=await r.json();if(!r.ok)throw new Error(data.error||'Không thể chạy AI Agent');setResult(data);setMessage('Hoàn thành. Sản phẩm và các bản nháp đã được lưu vào Supabase.');setName('');setUrl('');setCategory('');setFacts('');router.refresh();}
  catch(err){setMessage(err instanceof Error?err.message:'Có lỗi xảy ra');}finally{setBusy(false);}}
 async function logout(){const supabase=createClient();await supabase.auth.signOut();router.replace('/login');router.refresh();}
 return <main className="agent-shell"><header className="agent-top"><Link href="/" className="agent-brand"><span><img src="/tuco.png" alt="Mèo Tuco" /></span><b>MÈO TUCO KIẾM TIỀN NUÔI SEN !</b></Link><div className="agent-user">{email}<button className="outline" onClick={logout}><LogOut size={15}/> Đăng xuất</button></div></header>
 <section className="agent-content"><div className="agent-welcome"><div><div className="eyebrow"><Sparkles size={14}/> YOUR AI SALES TEAM</div><h1>Mèo Tuco <span>đang nhận nhiệm vụ</span></h1><p>Nhập link Affiliate và thông tin bạn biết. AI sẽ phân tích, chấm điểm và tạo bản nháp đa kênh.</p></div><div className="agent-mascot"><img src="/tuco.png" alt="Mèo Tuco" /></div></div>
 <div className="agent-columns"><form className="panel agent-form" onSubmit={run}><div className="panel-head"><div><h3><Link2 size={18}/> Nhiệm vụ mới</h3><p>Phân tích sản phẩm và tạo nội dung bán hàng</p></div><span className="tag tag-live">AI READY</span></div>
 <label>Tên sản phẩm<input required value={name} onChange={e=>setName(e.target.value)} placeholder="Ví dụ: Bỉm Gooby quần size L"/></label>
 <label>Link Shopee Affiliate<input required type="url" value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://s.shopee.vn/..."/></label>
 <label>Danh mục<input value={category} onChange={e=>setCategory(e.target.value)} placeholder="Mẹ & bé, gia dụng, làm đẹp…"/></label>
 <label>Thông tin đã xác minh<textarea value={facts} onChange={e=>setFacts(e.target.value)} rows={5} placeholder="Giá, quy cách, chất liệu, ưu điểm được nhà bán cung cấp… Chỉ nhập thông tin có thật."/></label>
 <div className="modal-note"><Sparkles size={16}/> AI chỉ sử dụng thông tin bạn cung cấp. Không tự bịa giá, hoa hồng, chứng nhận hoặc công dụng.</div>
 <button className="primary auth-submit" disabled={busy}>{busy?'AI đang làm việc…':'Chạy AI Agent'} <Sparkles size={16}/></button>
 {message&&<div className="agent-message">{message}</div>}
 {result&&<div className="agent-result"><b>{result.analysis?.seo_title}</b><p>{result.analysis?.product_summary}</p><small>Điểm tiềm năng: {result.analysis?.score}/100 · Trạng thái nội dung: Chờ duyệt</small></div>}
 </form>
 <div className="agent-side"><div className="panel"><div className="panel-head"><div><h3><FileText size={18}/> Nội dung mới tạo</h3><p>Bản nháp cần duyệt trước khi đăng</p></div></div>{posts.length?posts.map(p=><div className="agent-list-row" key={p.id}><div><b>{p.title||'Bản nháp chưa có tiêu đề'}</b><small>{p.channel.toUpperCase()} · {p.status}</small></div></div>):<div className="agent-empty">Chưa có bản nháp. Hãy giao nhiệm vụ đầu tiên cho Mèo Tuco.</div>}</div>
 <div className="panel"><div className="panel-head"><div><h3>Nhật ký nhiệm vụ</h3><p>Các lần chạy AI gần đây</p></div></div>{tasks.length?tasks.map(t=><div className="agent-list-row" key={t.id}><div><b>{t.title}</b><small>{t.status} · {new Date(t.created_at).toLocaleString('vi-VN')}</small>{t.error&&<small className="auth-error">{t.error}</small>}</div></div>):<div className="agent-empty">Chưa có nhiệm vụ.</div>}</div></div></div>
 <div className="panel agent-products"><div className="panel-head"><div><h3>Kho sản phẩm đã lưu</h3><p>{products.length} sản phẩm gần đây</p></div></div>{products.length?<div className="table-wrap"><table><thead><tr><th>SẢN PHẨM</th><th>DANH MỤC</th><th>ĐIỂM AI</th><th>TRẠNG THÁI</th><th>LINK</th></tr></thead><tbody>{products.map(p=><tr key={p.id}><td><b>{p.name}</b></td><td>{p.category||'—'}</td><td>{p.ai_score??'—'}</td><td>{p.status}</td><td><a href={p.source_url} target="_blank" rel="noreferrer"><ExternalLink size={15}/></a></td></tr>)}</tbody></table></div>:<div className="agent-empty">Chưa có sản phẩm được lưu.</div>}</div>
 <p className="agent-footnote">AI Affiliate Worker · Dữ liệu đơn hàng và hoa hồng chỉ được ghi nhận khi có báo cáo Affiliate đã xác minh.</p></section></main>;
}
