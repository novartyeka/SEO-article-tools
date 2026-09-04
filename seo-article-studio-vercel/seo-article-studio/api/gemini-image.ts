import type { VercelRequest, VercelResponse } from '@vercel/node';

const MODEL = 'gemini-3.1-flash-image';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY belum dikonfigurasi di Vercel.' });
  }

  const { description } = req.body || {};
  if (!description || typeof description !== 'string') {
    return res.status(400).json({ error: 'Deskripsi gambar wajib diisi.' });
  }

  const payload = {
    contents: [{
      role: 'user',
      parts: [{
        text: `Generate a professional, high-quality, photorealistic landscape photograph (16:9 aspect ratio) based on this description: ${description.trim()}. Natural lighting, sharp focus, clear details, professional photographer quality.`
      }]
    }],
    generationConfig: {
      responseModalities: ['IMAGE'],
      imageConfig: { aspectRatio: '16:9' }
    }
  };

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }
    );

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || 'Gemini image API request gagal.'
      });
    }

    const part = data?.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
    if (!part?.inlineData?.data) {
      return res.status(502).json({ error: 'Gambar tidak ditemukan dalam respons AI.' });
    }

    return res.status(200).json({
      candidates: [{ content: { parts: [{ inlineData: part.inlineData }] } }]
    });
  } catch (error) {
    console.error('Gemini image API error:', error);
    return res.status(500).json({ error: 'Gagal menghasilkan gambar AI.' });
  }
}
