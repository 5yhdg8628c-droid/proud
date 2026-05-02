export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const SUPABASE_URL = 'https://lzknpgcqrkaehofvzfja.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6a25wZ2NxcmthZWhvZnZ6ZmphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2ODA1NjIsImV4cCI6MjA5MzI1NjU2Mn0.MjhNgnMJeRB__73rWvxkC-p-0V3phhUrVTAzhloRX8s';

  const SLACK_WEBHOOKS = {
    'team_部門責任者gr': 'https://hooks.slack.com/services/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',
    'team_事業部部門責任者gr': 'https://hooks.slack.com/services/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',
    'team_社長室_mgmt': 'https://hooks.slack.com/services/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'
  };

  try {
    const data = req.body;

    // Supabaseに保存
    const sbRes = await fetch(`${SUPABASE_URL}/rest/v1/responses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(data)
    });

    if (!sbRes.ok) {
      const err = await sbRes.text();
      return res.status(500).json({ error: 'Supabase error', detail: err });
    }

    // Slack通知
    const webhookUrl = SLACK_WEBHOOKS[data.slack_channel];
    if (webhookUrl) {
      const slackRes = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `📋 新しいヒアリング回答が届きました\n*回答者：* ${data.name}（${data.dept || '未入力'}）\n*対象職種：* ${data.industry || '未入力'}\n*面接ゴール：* ${data.goal || '未入力'}\n*対象言語：* ${data.languages || '未入力'}\n*現在の課題：* ${data.pain_points || 'なし'}\n🔗 Supabaseで確認: https://supabase.com/dashboard/project/lzknpgcqrkaehofvzfja/editor`
        })
      });
      
      if (!slackRes.ok) {
        const slackErr = await slackRes.text();
        console.error('Slack error:', slackErr);
      }
    }

    return res.status(200).json({ success: true });

  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message });
  }
}
