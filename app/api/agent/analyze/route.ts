import OpenAI from 'openai';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const outputSchema = {
  type: 'object', additionalProperties: false,
  properties: {
    seo_title: { type: 'string' },
    seo_slug: { type: 'string' },
    seo_description: { type: 'string' },
    product_summary: { type: 'string' },
    audience: { type: 'string' },
    key_benefits: { type: 'array', items: { type: 'string' } },
    facebook_title: { type: 'string' },
    facebook_post: { type: 'string' },
    tiktok_script: { type: 'string' },
    pinterest_title: { type: 'string' },
    pinterest_description: { type: 'string' },
    website_body: { type: 'string' },
    claims_to_verify: { type: 'array', items: { type: 'string' } },
    score: { type: 'number' },
    score_reason: { type: 'string' },
    recommended_action: { type: 'string' }
  },
  required: ['seo_title','seo_slug','seo_description','product_summary','audience','key_benefits','facebook_title','facebook_post','tiktok_script','pinterest_title','pinterest_description','website_body','claims_to_verify','score','score_reason','recommended_action']
} as const;

function isShopeeUrl(raw: string) {
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' && (url.hostname === 'shopee.vn' || url.hostname.endsWith('.shopee.vn'));
  } catch { return false; }
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.' }, { status: 401 });
  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: 'Chưa cấu hình OPENAI_API_KEY trên môi trường triển khai.' }, { status: 503 });

  let body: { name?: string; sourceUrl?: string; category?: string; facts?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'Dữ liệu gửi lên không hợp lệ.' }, { status: 400 }); }
  const name = String(body.name ?? '').trim().slice(0, 180);
  const sourceUrl = String(body.sourceUrl ?? '').trim();
  const category = String(body.category ?? '').trim().slice(0, 100);
  const facts = String(body.facts ?? '').trim().slice(0, 5000);
  if (!name || !sourceUrl) return NextResponse.json({ error: 'Vui lòng nhập tên sản phẩm và link Affiliate.' }, { status: 400 });
  if (!isShopeeUrl(sourceUrl)) return NextResponse.json({ error: 'Chỉ chấp nhận link HTTPS thuộc shopee.vn hoặc tên miền con của Shopee Việt Nam.' }, { status: 400 });

  const { data: profile, error: profileError } = await supabase.from('profiles').upsert({ id: user.id, display_name: user.email?.split('@')[0] ?? 'Affiliate Owner' }).select('id').single();
  if (profileError || !profile) return NextResponse.json({ error: `Không khởi tạo được hồ sơ: ${profileError?.message ?? 'unknown'}` }, { status: 500 });

  let { data: worker } = await supabase.from('ai_workers').select('id').eq('owner_id', user.id).maybeSingle();
  if (!worker) {
    const created = await supabase.from('ai_workers').insert({ owner_id: user.id, name: 'Affiliate Bot', status: 'active', autonomy_mode: 'hybrid' }).select('id').single();
    if (created.error || !created.data) return NextResponse.json({ error: `Không tạo được AI Worker: ${created.error?.message ?? 'unknown'}` }, { status: 500 });
    worker = created.data;
  }

  const taskTitle = `Phân tích sản phẩm: ${name}`;
  const taskInsert = await supabase.from('agent_tasks').insert({ worker_id: worker.id, owner_id: user.id, task_type: 'analyze_product_and_create_content', title: taskTitle, input: { name, sourceUrl, category, facts }, status: 'running', started_at: new Date().toISOString() }).select('id').single();
  if (taskInsert.error || !taskInsert.data) return NextResponse.json({ error: `Không tạo được nhiệm vụ: ${taskInsert.error?.message ?? 'unknown'}` }, { status: 500 });
  const taskId = taskInsert.data.id;
  await supabase.from('agent_logs').insert({ worker_id: worker.id, owner_id: user.id, event: 'task_started', message: `Affiliate Bot bắt đầu phân tích ${name}.`, metadata: { task_id: taskId } });

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL || 'gpt-5.5',
      instructions: [
        'Bạn là AI Affiliate Worker, chuyên tạo nội dung tiếp thị liên kết bằng tiếng Việt.',
        'Chỉ sử dụng dữ liệu sản phẩm do người dùng cung cấp. Bạn không được mở link, không được giả vờ đã đọc trang Shopee.',
        'Tuyệt đối không tự bịa giá, phần trăm hoa hồng, số lượt bán, đánh giá, chất liệu, chứng nhận, nguồn gốc, công dụng hoặc hiệu quả.',
        'Nếu thiếu dữ kiện, dùng ngôn ngữ trung tính và ghi rõ thông tin cần xác minh trong claims_to_verify.',
        'Không viết review giả ở ngôi thứ nhất, không tạo khan hiếm hoặc giảm giá không có căn cứ.',
        'Tạo nội dung hữu ích, tự nhiên, có lời kêu gọi xem sản phẩm. Minh bạch rằng đây là liên kết tiếp thị liên kết khi phù hợp.',
        'Trả về đúng JSON theo schema. Điểm score là đánh giá sơ bộ về khả năng triển khai nội dung dựa trên độ đầy đủ dữ liệu, không phải dự báo doanh số.'
      ].join('\n'),
      input: `Tên sản phẩm: ${name}\nDanh mục: ${category || 'Chưa cung cấp'}\nLink Affiliate: ${sourceUrl}\nThông tin người dùng cung cấp: ${facts || 'Không có thông tin bổ sung.'}`,
      text: { format: { type: 'json_schema', name: 'affiliate_product_package', strict: true, schema: outputSchema } }
    });
    const raw = response.output_text;
    if (!raw) throw new Error('OpenAI không trả về nội dung.');
    const analysis = JSON.parse(raw);

    const productInsert = await supabase.from('products').insert({ owner_id: user.id, name, category: category || null, description: analysis.product_summary, source_url: sourceUrl, source_platform: 'shopee', status: 'review', ai_score: Math.max(0, Math.min(100, Number(analysis.score) || 0)), facts_verified: false }).select('id').single();
    if (productInsert.error || !productInsert.data) throw new Error(`Không lưu được sản phẩm: ${productInsert.error?.message ?? 'unknown'}`);
    const productId = productInsert.data.id;
    const trackingCode = crypto.randomUUID().replaceAll('-', '').slice(0, 18);
    const linkInsert = await supabase.from('affiliate_links').insert({ owner_id: user.id, product_id: productId, original_url: sourceUrl, affiliate_url: sourceUrl, tracking_code: trackingCode, network: 'shopee' }).select('id').single();
    if (linkInsert.error || !linkInsert.data) throw new Error(`Không lưu được link Affiliate: ${linkInsert.error?.message ?? 'unknown'}`);

    const drafts = [
      { channel: 'website', format: 'product_landing_page', title: analysis.seo_title, body: analysis.website_body },
      { channel: 'facebook', format: 'social_post', title: analysis.facebook_title, body: analysis.facebook_post },
      { channel: 'tiktok', format: 'video_script', title: analysis.seo_title, body: analysis.tiktok_script },
      { channel: 'pinterest', format: 'pin_description', title: analysis.pinterest_title, body: analysis.pinterest_description }
    ];
    const savedPosts = [];
    for (const draft of drafts) {
      const saved = await supabase.from('content_posts').insert({ owner_id: user.id, product_id: productId, channel: draft.channel, format: draft.format, title: draft.title, body: draft.body, affiliate_link_id: linkInsert.data.id, status: 'pending_approval' }).select('id,title,channel,status').single();
      if (saved.error || !saved.data) throw new Error(`Không lưu được bản nháp ${draft.channel}: ${saved.error?.message ?? 'unknown'}`);
      savedPosts.push(saved.data);
      await supabase.from('approvals').insert({ owner_id: user.id, content_post_id: saved.data.id, action_type: 'publish_content', payload: { channel: draft.channel }, status: 'pending' });
    }
    const output = { product_id: productId, affiliate_link_id: linkInsert.data.id, tracking_code: trackingCode, analysis, posts: savedPosts };
    await supabase.from('agent_tasks').update({ status: 'waiting_approval', output, completed_at: new Date().toISOString() }).eq('id', taskId);
    await supabase.from('agent_logs').insert({ worker_id: worker.id, owner_id: user.id, event: 'product_analyzed', message: `Đã phân tích ${name} và tạo ${savedPosts.length} bản nháp chờ duyệt.`, metadata: { task_id: taskId, product_id: productId, post_count: savedPosts.length, score: analysis.score } });
    return NextResponse.json({ success: true, taskId, productId, analysis, posts: savedPosts });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Lỗi không xác định từ AI Agent';
    await supabase.from('agent_tasks').update({ status: 'failed', error: message, completed_at: new Date().toISOString() }).eq('id', taskId);
    await supabase.from('agent_logs').insert({ worker_id: worker.id, owner_id: user.id, level: 'error', event: 'task_failed', message, metadata: { task_id: taskId } });
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
