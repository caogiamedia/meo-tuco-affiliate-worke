# AI Affiliate Worker — MVP 0.2

Bản nâng cấp kết nối Supabase Auth/Database và OpenAI Responses API. Phiên bản này nhận link Shopee Affiliate do chủ tài khoản nhập, lưu sản phẩm/link, tạo phân tích + 4 bản nháp nội dung (Website, Facebook, TikTok, Pinterest), lưu nhiệm vụ/nhật ký và đưa mọi nội dung vào trạng thái chờ duyệt.

## 1. Yêu cầu

- Node.js 20+
- Một project Supabase mới
- Một OpenAI API key có quyền gọi Responses API và model được chọn
- Tài khoản Supabase Auth email/password

## 2. Cấu hình Supabase

1. Tạo project mới tại https://database.new.
2. Mở **SQL Editor** → New query.
3. Mở `supabase/schema.sql`, copy toàn bộ nội dung và chạy.
4. Vào **Project Settings → API** lấy Project URL và Publishable key.
5. Vào **Authentication → Providers → Email**, bật Email provider.
6. Tạo user quản trị tại **Authentication → Users → Add user**. Dùng email/password do bạn tự đặt. Nếu đang bật email confirmation, xác nhận user trước khi đăng nhập.

Schema đã bật Row Level Security và chính sách owner-scoped. Không đưa service-role key lên trình duyệt.

## 3. Cấu hình môi trường

Copy `.env.example` thành `.env.local` rồi điền:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY
OPENAI_API_KEY=YOUR_OPENAI_API_KEY
OPENAI_MODEL=gpt-5.5
```

`OPENAI_API_KEY` chỉ chạy ở server. Không đổi tên thành `NEXT_PUBLIC_OPENAI_API_KEY` và không commit `.env.local` lên GitHub.

## 4. Chạy local

```bash
npm install
npm run dev
```

Mở http://localhost:3000/login và đăng nhập bằng user đã tạo trong Supabase. Sau đó mở `/agent`.

## 5. Chạy AI Agent

1. Nhập tên sản phẩm.
2. Dán link Affiliate HTTPS thuộc `shopee.vn` hoặc subdomain `*.shopee.vn`.
3. Nhập danh mục và các thông tin sản phẩm đã xác minh (giá, chất liệu, quy cách, ưu điểm...).
4. Nhấn **Chạy AI Agent**.

AI gọi OpenAI Responses API với Structured Outputs, tạo phân tích có cấu trúc và bốn bản nháp. Backend lưu `products`, `affiliate_links`, `agent_tasks`, `agent_logs`, `content_posts` và `approvals` trong Supabase. Các bản nháp mặc định `pending_approval`; chưa có hành động đăng bài tự động.

## 6. Deploy Netlify (domain miễn phí)

1. Push toàn bộ thư mục dự án này lên GitHub repository.
2. Trong Netlify, chọn **Add new project → Import an existing project → GitHub** và chọn repository.
3. Build command: `npm run build`. Publish directory: để Netlify tự nhận diện Next.js; không đặt `out` hoặc `public`.
4. Trong Netlify → Site configuration → Environment variables, thêm các biến từ `.env.example`.
5. Deploy và chờ build hoàn tất. Netlify hỗ trợ Next.js qua adapter của nền tảng.
6. Trong Supabase → Authentication → URL Configuration, đặt Site URL là domain `*.netlify.app` của website và thêm redirect URL phù hợp (ví dụ `https://TEN-SITE.netlify.app/**`).
7. Tên `TEN-SITE.netlify.app` được đặt sau khi tạo site: Site configuration → General → Change site name.

Không upload file `.env.local` hoặc API key lên GitHub.

## 7. Phạm vi và giới hạn của MVP 0.2

- AI **không tự truy cập/đọc trang Shopee** từ URL. Nội dung phân tích chỉ dựa trên tên, danh mục và thông tin người dùng nhập. Đây là chủ ý để tránh giả lập dữ liệu và tránh phụ thuộc scraping không ổn định.
- Giá, hoa hồng, lượt bán, đánh giá và đơn hàng chưa được đồng bộ từ Shopee. Không có số liệu doanh thu giả.
- Link tracking code đã được tạo và lưu, nhưng endpoint redirect/click attribution chưa được bật ở phiên bản này.
- Facebook, TikTok, Pinterest chưa được kết nối API và chưa tự đăng bài. Tất cả bản nháp đều cần duyệt.
- Chưa có worker chạy nền định kỳ; mỗi lần bấm nút là một lượt chạy AI có lưu lịch sử.
- Trước khi mở công khai, cần bổ sung giới hạn tần suất API, captcha/rate limit, kiểm tra quyền quản trị, logging/monitoring và kiểm thử bảo mật.

## 8. Công nghệ

- Next.js 14 App Router + TypeScript
- Supabase Auth + Postgres + RLS (`@supabase/ssr`)
- OpenAI Node SDK + Responses API + Structured Outputs

Tài liệu chính thức:
- Supabase Next.js: https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
- Supabase SSR: https://supabase.com/docs/guides/auth/server-side
- OpenAI Responses API: https://developers.openai.com/api/reference/responses/overview
- OpenAI Structured Outputs: https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses

## 9. Tuco Task Center (Bước 3)

- Mở `/tasks` sau khi đăng nhập để xem tối đa 100 nhiệm vụ AI gần nhất.
- Lọc nhiệm vụ theo trạng thái và tìm kiếm theo tiêu đề/loại nhiệm vụ.
- Xem dữ liệu đầu vào, kết quả phân tích Gemini, điểm đánh giá, thông tin cần xác minh và các bản nháp được tạo.
- Xem nhật ký hệ thống gắn với từng nhiệm vụ.
- Trung tâm này chỉ đọc dữ liệu, không tự chạy lại tác vụ và không tiêu hao thêm quota Gemini.
