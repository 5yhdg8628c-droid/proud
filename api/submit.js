export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const SUPABASE_URL = 'https://lzknpgcqrkaehofvzfja.supabase.co';
  const SUPABASE_KEY = process.env.SUPABASE_KEY;
  const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK;

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

    // Slack DM通知
    if (SLACK_WEBHOOK) {
      const slackRes = await fetch(SLACK_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `📋 *新しいヒアリング回答が届きました*\n*回答者：* ${data.name}（${data.dept || '未入力'}）\n*対象職種：* ${data.industry || '未入力'}\n*面接ゴール：* ${data.goal || '未入力'}\n*対象言語：* ${data.languages || '未入力'}\n*現在の課題：* ${data.pain_points || 'なし'}`
        })
      });
      const slackBody = await slackRes.text();
      console.log('Slack status:', slackRes.status, slackBody);
    }

    return res.status(200).json({ success: true });

  } catch (e) {
    console.error('Error:', e);
    return res.status(500).json({ error: e.message });
  }
}
