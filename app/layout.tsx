import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
export const metadata: Metadata = { title: 'Mèo Tuco kiếm tiền nuôi sen !', description: 'AI Affiliate Worker – Mèo Tuco tự phân tích sản phẩm và tạo nội dung Affiliate' };
export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return <html lang="vi"><body>{children}</body></html>;
}
