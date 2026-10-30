
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

const outputSchema = {
  type: 'OBJECT',
  properties: {
    seo_title: { type: 'STRING' },
    seo_slug: { type: 'STRING' },
    seo_description: { type: 'STRING' },
    product_summary: { type: 'STRING' },
    audience: { type: 'STRING' },
    key_benefits: {
      type: 'ARRAY',
      items: { type: 'STRING' }
    },
    facebook_title: { type: 'STRING' },
    facebook_post: { type: 'STRING' },
    tiktok_script: { type: 'STRING' },
    pinterest_title: { type: 'STRING' },
    pinterest_description: { type: 'STRING' },
    website_body: { type: 'STRING' },
    claims_to_verify: {
      type: 'ARRAY',
      items: { type: 'STRING' }
    },
    score: { type: 'NUMBER' },
    score_reason: { type: 'STRING' },
    recommended_action: { type: 'STRING' }
  },
  required: [
    'seo_title',
    'seo_slug',
    'seo_description',
    'product_summary',
    'audience',
    'key_benefits',
    'facebook_title',
    'facebook_post',
    'tiktok_script',
    'pinterest_title',
    'pinterest_description',
    'website_body',
    'claims_to_verify',
    'score',
    'score_reason',
    'recommended_action'
  ]
};

function isShopeeUrl(raw: string) {
  try {
    const url = new URL(raw);
    return (
      url.protocol === 'https:' &&
      (url.hostname === 'shopee.vn' ||
        url.hostname.endsWith('.shopee.vn'))
    );
  } catch {
    return false;
  }
}

async function generateWithGemini(
  name: string,
  sourceUrl: string,
  category: string,
  facts: string
) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('Chưa cấu hình GEMINI_API_KEY.');
  }

  const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';

  const systemInstruction = [
    'Bạn là Mèo Tuco, AI Affiliate Worker chuyên tiếp thị liên kết bằng tiếng Việt.',
    'Tính cách: thông minh, vui vẻ, chăm chỉ, gần gũi và có khả năng sáng tạo nội dung bán hàng.',
    'Chỉ sử dụng dữ liệu sản phẩm do người dùng cung cấp.',
    'Không mở link và không được giả vờ đã đọc trang Shopee.',
    'Tuyệt đối không tự bịa giá, hoa hồng, lượt bán, đánh giá, chất liệu, chứng nhận, nguồn gốc, công dụng hoặc hiệu quả.',
    'Nếu thiếu dữ kiện, dùng ngôn ngữ trung tính và ghi thông tin cần xác minh trong claims_to_verify.',
    'Không viết review giả ở ngôi thứ nhất.',
    'Không tạo khan hiếm hoặc giảm giá không có căn cứ.',
    'Nội dung cần tự nhiên, hữu ích, có lời kêu gọi xem sản phẩm.',
    'Minh bạch đây là liên kết tiếp thị liên kết khi phù hợp.',
    'Tạo nội dung riêng phù hợp với từng nền tảng: Website, Facebook, TikTok và Pinterest.',
    'Kịch bản TikTok cần có câu mở đầu thu hút, nội dung chính và lời kêu gọi hành động.',
    'Điểm score từ 0 đến 100 chỉ đánh giá độ đầy đủ dữ liệu và khả năng triển khai nội dung, không dự báo doanh số.',
    'Trả về đúng JSON theo schema được cung cấp.'
  ].join('\n');

  const prompt = [
    `Tên sản phẩm: ${name}`,
    `Danh mục: ${category || 'Chưa cung cấp'}`,
    `Link Affiliate: ${sourceUrl}`,
    `Thông tin người dùng cung cấp: ${facts || 'Không có thông tin bổ sung.'}`,
    '',
    'Hãy phân tích sản phẩm và tạo bộ nội dung Affiliate hoàn chỉnh.'
  ].join('\n');

  const endpoint =
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        responseJsonSchema: outputSchema,
        temperature: 0.7
      }
    }),
    cache: 'no-store'
  });

  const result = await response.json();

  if (!response.ok) {
    const apiMessage =
      result?.error?.message || 'Không thể kết nối Gemini API.';

    if (response.status === 429) {
      throw new Error(
        'Gemini đã đạt giới hạn sử dụng hoặc quota miễn phí. Vui lòng thử lại sau.'
      );
    }

    if (response.status === 403 || response.status === 400) {
      throw new Error(`Gemini API: ${apiMessage}`);
    }

    throw new Error(`Gemini API lỗi (${response.status}): ${apiMessage}`);
  }

  const text = result?.candidates?.[0]?.content?.parts
    ?.map((part: { text?: string }) => part.text || '')
    .join('');

  if (!text) {
    throw new Error('Gemini không trả về nội dung. Vui lòng thử lại.');
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Gemini trả về dữ liệu JSON không hợp lệ.');
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.' },
      { status: 401 }
    );
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: 'Chưa cấu hình GEMINI_API_KEY trên môi trường triển khai.' },
      { status: 503 }
    );
  }

  let body: {
    name?: string;
    sourceUrl?: string;
    category?: string;
    facts?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Dữ liệu gửi lên không hợp lệ.' },
      { status: 400 }
    );
  }

  const name = String(body.name ?? '').trim().slice(0, 180);
  const sourceUrl = String(body.sourceUrl ?? '').trim();
  const category = String(body.category ?? '').trim().slice(0, 100);
  const facts = String(body.facts ?? '').trim().slice(0, 5000);

  if (!name || !sourceUrl) {
    return NextResponse.json(
      { error: 'Vui lòng nhập tên sản phẩm và link Affiliate.' },
      { status: 400 }
    );
  }

  if (!isShopeeUrl(sourceUrl)) {
    return NextResponse.json(
      {
        error:
          'Chỉ chấp nhận link HTTPS thuộc shopee.vn hoặc tên miền con của Shopee Việt Nam.'
      },
      { status: 400 }
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      display_name: user.email?.split('@')[0] ?? 'Affiliate Owner'
    })
    .select('id')
    .single();

  if (profileError || !profile) {
    return NextResponse.json(
      {
        error: `Không khởi tạo được hồ sơ: ${profileError?.message ?? 'unknown'}`
      },
      { status: 500 }
    );
  }

  let { data: worker } = await supabase
    .from('ai_workers')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle();

  if (!worker) {
    const created = await supabase
      .from('ai_workers')
      .insert({
        owner_id: user.id,
        name: 'Mèo Tuco',
        status: 'active',
        autonomy_mode: 'hybrid'
      })
      .select('id')
      .single();

    if (created.error || !created.data) {
      return NextResponse.json(
        {
          error: `Không tạo được AI Worker: ${created.error?.message ?? 'unknown'}`
        },
        { status: 500 }
      );
    }

    worker = created.data;
  }

  const taskTitle = `Phân tích sản phẩm: ${name}`;

  const taskInsert = await supabase
    .from('agent_tasks')
    .insert({
      worker_id: worker.id,
      owner_id: user.id,
      task_type: 'analyze_product_and_create_content',
      title: taskTitle,
      input: { name, sourceUrl, category, facts },
      status: 'running',
      started_at: new Date().toISOString()
    })
    .select('id')
    .single();

  if (taskInsert.error || !taskInsert.data) {
    return NextResponse.json(
      {
        error: `Không tạo được nhiệm vụ: ${taskInsert.error?.message ?? 'unknown'}`
      },
      { status: 500 }
    );
  }

  const taskId = taskInsert.data.id;

  await supabase.from('agent_logs').insert({
    worker_id: worker.id,
    owner_id: user.id,
    event: 'task_started',
    message: `Mèo Tuco bắt đầu phân tích ${name}.`,
    metadata: { task_id: taskId }
  });

  try {
    const analysis = await generateWithGemini(
      name,
      sourceUrl,
      category,
      facts
    );

    const productInsert = await supabase
      .from('products')
      .insert({
        owner_id: user.id,
        name,
        category: category || null,
        description: analysis.product_summary,
        source_url: sourceUrl,
        source_platform: 'shopee',
        status: 'review',
        ai_score: Math.max(
          0,
          Math.min(100, Number(analysis.score) || 0)
        ),
        facts_verified: false
      })
      .select('id')
      .single();

    if (productInsert.error || !productInsert.data) {
      throw new Error(
        `Không lưu được sản phẩm: ${productInsert.error?.message ?? 'unknown'}`
      );
    }

    const productId = productInsert.data.id;
    const trackingCode = crypto
      .randomUUID()
      .replaceAll('-', '')
      .slice(0, 18);

    const linkInsert = await supabase
      .from('affiliate_links')
      .insert({
        owner_id: user.id,
        product_id: productId,
        original_url: sourceUrl,
        affiliate_url: sourceUrl,
        tracking_code: trackingCode,
        network: 'shopee'
      })
      .select('id')
      .single();

    if (linkInsert.error || !linkInsert.data) {
      throw new Error(
        `Không lưu được link Affiliate: ${linkInsert.error?.message ?? 'unknown'}`
      );
    }

    const drafts = [
      {
        channel: 'website',
        format: 'product_landing_page',
        title: analysis.seo_title,
        body: analysis.website_body
      },
      {
        channel: 'facebook',
        format: 'social_post',
        title: analysis.facebook_title,
        body: analysis.facebook_post
      },
      {
        channel: 'tiktok',
        format: 'video_script',
        title: analysis.seo_title,
        body: analysis.tiktok_script
      },
      {
        channel: 'pinterest',
        format: 'pin_description',
        title: analysis.pinterest_title,
        body: analysis.pinterest_description
      }
    ];

    const savedPosts = [];

    for (const draft of drafts) {
      const saved = await supabase
        .from('content_posts')
        .insert({
          owner_id: user.id,
          product_id: productId,
          channel: draft.channel,
          format: draft.format,
          title: draft.title,
          body: draft.body,
          affiliate_link_id: linkInsert.data.id,
          status: 'pending_approval'
        })
        .select('id,title,channel,status')
        .single();

      if (saved.error || !saved.data) {
        throw new Error(
          `Không lưu được bản nháp ${draft.channel}: ${saved.error?.message ?? 'unknown'}`
        );
      }

      savedPosts.push(saved.data);

      await supabase.from('approvals').insert({
        owner_id: user.id,
        content_post_id: saved.data.id,
        action_type: 'publish_content',
        payload: { channel: draft.channel },
        status: 'pending'
      });
    }

    const output = {
      product_id: productId,
      affiliate_link_id: linkInsert.data.id,
      tracking_code: trackingCode,
      analysis,
      posts: savedPosts
    };

    await supabase
      .from('agent_tasks')
      .update({
        status: 'waiting_approval',
        output,
        completed_at: new Date().toISOString()
      })
      .eq('id', taskId);

    await supabase.from('agent_logs').insert({
      worker_id: worker.id,
      owner_id: user.id,
      event: 'product_analyzed',
      message: `Mèo Tuco đã phân tích ${name} và tạo ${savedPosts.length} bản nháp chờ duyệt.`,
      metadata: {
        task_id: taskId,
        product_id: productId,
        post_count: savedPosts.length,
        score: analysis.score
      }
    });

    return NextResponse.json({
      success: true,
      taskId,
      productId,
      analysis,
      posts: savedPosts
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Lỗi không xác định từ Gemini AI Agent';

    await supabase
      .from('agent_tasks')
      .update({
        status: 'failed',
        error: message,
        completed_at: new Date().toISOString()
      })
      .eq('id', taskId);

    await supabase.from('agent_logs').insert({
      worker_id: worker.id,
      owner_id: user.id,
      level: 'error',
      event: 'task_failed',
      message,
      metadata: { task_id: taskId }
    });

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
