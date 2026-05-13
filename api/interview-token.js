export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    console.log('OPENAI_API_KEY prefix:', apiKey ? apiKey.slice(0, 10) : 'NOT SET');

    const response = await fetch('https://api.openai.com/v1/realtime', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini-realtime-preview',
        voice: 'alloy',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', JSON.stringify({ status: response.status, statusText: response.statusText, error }, null, 2));
      return res.status(response.status).json({
        error: 'OpenAI API error',
        status: response.status,
        statusText: response.statusText,
        details: error,
      });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error('Token error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
