export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const SUPABASE_URL = 'https://lzknpgcqrkaehofvzfja.supabase.co';
  const SUPABASE_KEY = process.env.SUPABASE_KEY;

  try {
    const { session_id, answers, messages, completed } = req.body;

    if (!session_id) {
      return res.status(400).json({ error: 'session_id is required' });
    }

    const payload = {
      session_id,
      answers: answers ?? null,
      messages: messages ?? null,
      completed: completed ?? false,
      updated_at: new Date().toISOString(),
    };

    const sbRes = await fetch(`${SUPABASE_URL}/rest/v1/interview_logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(payload),
    });

    if (!sbRes.ok) {
      const err = await sbRes.text();
      console.error('Supabase error:', err);
      return res.status(500).json({ error: 'Supabase error', detail: err });
    }

    return res.status(200).json({ success: true });

  } catch (e) {
    console.error('interview-save error:', e);
    return res.status(500).json({ error: e.message });
  }
}
