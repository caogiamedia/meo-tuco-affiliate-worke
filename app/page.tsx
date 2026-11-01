import Link from 'next/link';
import {
  ArrowRight, ArrowUpRight, BookOpen, CalendarDays,
  CheckCircle2, ChevronRight, CircleDollarSign, Heart,
  Package, PawPrint, Search, ShieldCheck, Store, WandSparkles,
} from 'lucide-react';

const rooms = [
  { icon: Search, title: 'Phòng săn sản phẩm', desc: 'Tuco tìm và sàng lọc những món đồ đáng để giới thiệu.', tag: 'RESEARCH' },
  { icon: WandSparkles, title: 'Xưởng sáng tạo', desc: 'Biến thông tin sản phẩm thành bài viết, hình ảnh và kịch bản video.', tag: 'CONTENT' },
  { icon: CalendarDays, title: 'Lịch làm việc', desc: 'Theo dõi nội dung đã duyệt và những việc sắp đến giờ.', tag: 'SCHEDULE' },
  { icon: CircleDollarSign, title: 'Quỹ nuôi sen', desc: 'Cập nhật click, đơn hàng và hoa hồng khi có nguồn dữ liệu xác thực.', tag: 'EARNINGS' },
];

const steps = [
  ['01', 'Sen gửi link', 'Thêm link sản phẩm affiliate vào kho của Tuco.'],
  ['02', 'Tuco nghiên cứu', 'AI phân tích dữ liệu sen cung cấp và đề xuất góc tiếp cận.'],
  ['03', 'Sen duyệt nội dung', 'Sen xem, sửa, duyệt hoặc từ chối trước khi xuất bản.'],
  ['04', 'Theo dõi kết quả', 'Lưu lịch sử công việc và cập nhật số liệu khi được kết nối.'],
];

export default function Home() {
  return (
    <main className="tuco-public">
      <header className="tp-header">
        <Link href="/" className="tp-brand" aria-label="Mèo Tuco - Trang chủ">
          <span className="tp-brand-avatar"><img src="/tuco.png" alt="" /></span>
          <span><strong>MÈO TUCO</strong><small>KIẾM TIỀN NUÔI SEN !</small></span>
        </Link>
        <nav className="tp-nav" aria-label="Điều hướng chính">
          <a href="#cau-chuyen">Chuyện của Tuco</a>
          <a href="#van-phong">Văn phòng</a>
          <a href="#quy-trinh">Cách Tuco làm việc</a>
          <a href="#nhat-ky">Nhật ký</a>
        </nav>
        <div className="tp-header-actions">
          <Link href="/login" className="tp-login">Sen đăng nhập <ArrowUpRight size={15} /></Link>
        </div>
      </header>

      <section className="tp-hero" id="cau-chuyen">
        <div className="tp-hero-copy">
          <div className="tp-kicker"><span className="tp-kicker-dot" /> MỘT CHÚ MÈO, MỘT ƯỚC MƠ LỚN</div>
          <h1>Sen cứ chill,<br /><em>để Tuco lo!</em></h1>
          <p className="tp-lead">Xin chào, mình là Tuco — nhân viên affiliate bốn chân. Mình thích săn đồ hay, kể chuyện sản phẩm và chăm chỉ tích góp để nuôi sen.</p>
          <div className="tp-hero-buttons">
            <a className="tp-button tp-button-primary" href="#van-phong">Khám phá nhà Tuco <ArrowRight size={17} /></a>
            <Link className="tp-button tp-button-quiet" href="/login">Vào phòng điều khiển <ChevronRight size={16} /></Link>
          </div>
          <div className="tp-hero-note"><ShieldCheck size={16} /> Minh bạch hoạt động · Sen duyệt trước khi đăng</div>
        </div>
        <div className="tp-hero-art">
          <div className="tp-sun" />
          <div className="tp-doodle tp-doodle-one">✦</div><div className="tp-doodle tp-doodle-two">♡</div>
          <div className="tp-speech"><span>Meo meo!</span><br />Hôm nay mình<br />kiếm gì cho sen nhỉ?</div>
          <div className="tp-cat-stage"><img src="/tuco.png" alt="Tuco, chú mèo nhân viên affiliate" /></div>
          <div className="tp-stage-label"><PawPrint size={15} /> TUCO’S LITTLE OFFICE</div>
        </div>
        <div className="tp-hero-bottom"><span>SCROLL ĐỂ KHÁM PHÁ</span><span className="tp-scroll-line" /></div>
      </section>

      <section className="tp-intro-strip">
        <div><span className="tp-strip-icon"><Heart size={19} /></span><p><b>Không chỉ là một website bán hàng.</b><br />Đây là câu chuyện mỗi ngày của một chú mèo AI đang cố gắng kiếm tiền nuôi sen.</p></div>
        <span className="tp-strip-stamp">MEOW<br />& MAKE<br />MONEY</span>
      </section>

      <section className="tp-section tp-office-section" id="van-phong">
        <div className="tp-section-heading">
          <div><span className="tp-eyebrow">WELCOME TO TUCO’S WORLD</span><h2>Văn phòng nhỏ,<br /><em>ước mơ không nhỏ.</em></h2></div>
          <p>Mỗi căn phòng là một nhiệm vụ. Tuco sẽ làm việc, ghi nhật ký và báo cáo rõ ràng để sen luôn nắm được mọi thứ.</p>
        </div>
        <div className="tp-room-grid">
          {rooms.map((room, index) => {
            const Icon = room.icon;
            return <article className={`tp-room-card tp-room-${index + 1}`} key={room.tag}>
              <div className="tp-room-top"><span className="tp-room-icon"><Icon size={22} /></span><span className="tp-room-tag">{room.tag}</span></div>
              <h3>{room.title}</h3><p>{room.desc}</p>
              <span className="tp-room-number">0{index + 1}</span>
              <Link href="/login" className="tp-room-link">Vào phòng <ArrowUpRight size={16} /></Link>
            </article>;
          })}
        </div>
      </section>

      <section className="tp-process-section" id="quy-trinh">
        <div className="tp-process-inner">
          <div className="tp-process-heading"><span className="tp-eyebrow">TEAMWORK MAKES THE DREAM WORK</span><h2>Tuco chăm chỉ.<br /><em>Sen nắm quyền.</em></h2><p>Tuco chủ động đề xuất công việc, nhưng những bước quan trọng vẫn cần cái gật đầu của sen.</p></div>
          <div className="tp-steps">{steps.map(([number, title, desc]) => <article className="tp-step" key={number}><span>{number}</span><div><h3>{title}</h3><p>{desc}</p></div><CheckCircle2 size={18} /></article>)}</div>
        </div>
      </section>

      <section className="tp-journal-section" id="nhat-ky">
        <div className="tp-journal-card">
          <div className="tp-journal-mascot"><img src="/tuco.png" alt="Tuco" /></div>
          <div className="tp-journal-copy"><span className="tp-eyebrow">TUCO’S DIARY</span><h2>Nhật ký của một<br /><em>nhân viên chăm chỉ.</em></h2><p>Mỗi lần Tuco tìm sản phẩm, tạo nội dung hay hoàn thành nhiệm vụ, câu chuyện sẽ được lưu lại tại đây — để sen và mọi người cùng theo dõi.</p><div className="tp-empty-journal"><BookOpen size={17} /><span>Nhật ký sẽ xuất hiện khi Tuco có hoạt động được ghi nhận.</span></div></div>
          <div className="tp-journal-doodle">Z<br /><small>z</small></div>
        </div>
      </section>

      <section className="tp-store-teaser">
        <div className="tp-store-icon"><Store size={25} /></div>
        <div><span className="tp-eyebrow">TUCO’S PICKS</span><h2>Góc đồ hay Tuco muốn chia sẻ</h2><p>Những sản phẩm được Tuco nghiên cứu và chọn lọc sẽ có mặt tại siêu thị nhỏ này sau khi được sen duyệt.</p></div>
        <div className="tp-store-coming"><Package size={18} /><span>Đang chuẩn bị mở cửa</span></div>
      </section>

      <footer className="tp-footer">
        <Link href="/" className="tp-brand"><span className="tp-brand-avatar"><img src="/tuco.png" alt="" /></span><span><strong>MÈO TUCO</strong><small>KIẾM TIỀN NUÔI SEN !</small></span></Link>
        <p>Được làm bằng tình yêu, vài chiếc máy tính và rất nhiều tiếng meo.</p>
        <div className="tp-footer-links"><Link href="/login">Phòng điều khiển</Link><a href="#cau-chuyen">Về đầu trang ↑</a></div>
        <small className="tp-copyright">© {new Date().getFullYear()} Mèo Tuco. Affiliate minh bạch, nội dung có kiểm duyệt.</small>
      </footer>
    </main>
  );
}
