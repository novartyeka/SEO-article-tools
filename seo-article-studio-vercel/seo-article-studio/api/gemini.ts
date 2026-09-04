```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Model Gemini yang stabil untuk text generation
const MODEL = 'gemini-2.5-flash';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Hanya menerima POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method Not Allowed'
    });
  }

  // Ambil API key dari Environment Variable Vercel
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error('GEMINI_API_KEY tidak ditemukan di environment.');
    
    return res.status(500).json({
      error: 'GEMINI_API_KEY belum dikonfigurasi di Vercel.'
    });
  }

  // Ambil data dari request
  const {
    prompt,
    systemInstruction = ''
  } = req.body || {};

  // Validasi prompt
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({
      error: 'Prompt wajib diisi.'
    });
  }

  // Payload Gemini API
  const payload: Record<string, unknown> = {
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: prompt
          }
        ]
      }
    ]
  };

  // Tambahkan system instruction jika tersedia
  if (
    systemInstruction &&
    typeof systemInstruction === 'string'
  ) {
    payload.systemInstruction = {
      parts: [
        {
          text: systemInstruction
        }
      ]
    };
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },

        body: JSON.stringify(payload)
      }
    );

    const data = await response.json();

    // Jika Gemini mengembalikan error
    if (!response.ok) {
      console.error(
        'Gemini API error:',
        JSON.stringify(data)
      );

      return res.status(response.status).json({
        error:
          data?.error?.message ||
          'Gemini API request gagal.'
      });
    }

    // Ambil teks dari response Gemini
    const text =
      data?.candidates?.[0]?.content?.parts
        ?.map((part: { text?: string }) => part?.text || '')
        .join('') || '';

    if (!text) {
      console.error(
        'Gemini API tidak mengembalikan teks:',
        JSON.stringify(data)
      );

      return res.status(502).json({
        error:
          'Gemini tidak mengembalikan hasil teks.'
      });
    }

    return res.status(200).json({
      text
    });

  } catch (error) {
    console.error(
      'Gemini API connection error:',
      error
    );

    return res.status(500).json({
      error:
        'Gagal menghubungi Gemini API.'
    });
  }
}
```
