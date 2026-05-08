export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const data = req.body;

  // ========== Supabase 保存 ==========
  const supabaseUrl = 'https://lzknpgcqrkaehofvzfja.supabase.co';
  const supabaseKey = process.env.SUPABASE_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      const supaRes = await fetch(`${supabaseUrl}/rest/v1/hr_kaizen_responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          form_name: data.form_name,
          date: data.date,
          participants: data.participants,
          ratio_summary: data.ratio_summary,
          jobs_detail: data.jobs_detail,
          inefficiency: data.inefficiency,
          priority: data.priority,
          notes: data.notes,
          created_at: new Date().toISOString()
        })
      });

      if (!supaRes.ok) {
        const errText = await supaRes.text();
        console.error('Supabase error:', errText);
        // テーブルがなくても Slack 通知は続行
      }
    } catch (e) {
      console.error('Supabase fetch error:', e);
    }
  }

  // ========== Slack 通知 ==========
  const slackUrl = process.env.SLACK_WEBHOOK;

  if (slackUrl) {
    const jobsPreview = data.jobs_detail
      ? data.jobs_detail.slice(0, 800) + (data.jobs_detail.length > 800 ? '\n...(省略)' : '')
      : '（未入力）';

    const slackPayload = {
      text: '📋 人事労務 業務棚卸しフォームが送信されました',
      blocks: [
        {
          type: 'header',
          text: { type: 'plain_text', text: `📋 人事労務 業務棚卸し — ${data.participants || '不明'} の回答`, emoji: true }
        },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*記入日*\n${data.date || '未入力'}` },
            { type: 'mrkdwn', text: `*参加者*\n${data.participants || '未入力'}` }
          ]
        },
        {
          type: 'section',
          text: { type: 'mrkdwn', text: `*⏱ 時間配分（大枠）*\n${data.ratio_summary || '未入力'}` }
        },
        {
          type: 'section',
          text: { type: 'mrkdwn', text: `*📝 業務詳細*\n\`\`\`${jobsPreview}\`\`\`` }
        },
        ...(data.inefficiency ? [{
          type: 'section',
          text: { type: 'mrkdwn', text: `*⚠️ 特に非効率な業務*\n${data.inefficiency}` }
        }] : []),
        ...(data.priority ? [{
          type: 'section',
          text: { type: 'mrkdwn', text: `*🚀 優先改善したい業務*\n${data.priority}` }
        }] : []),
        {
          type: 'divider'
        },
        {
          type: 'context',
          elements: [{ type: 'mrkdwn', text: `送信日時：${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}` }]
        }
      ]
    };

    try {
      await fetch(slackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slackPayload)
      });
    } catch (e) {
      console.error('Slack error:', e);
    }
  }

  return res.status(200).json({ success: true });
}
