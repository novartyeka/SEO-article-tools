```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';

const MODEL = 'gemini-2.5-flash';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Method Not Allowed'
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: 'GEMINI_API_KEY belum dikonfigurasi di Vercel.'
    });
  }

  try {
    const body = req.body || {};
    const prompt = body.prompt;
    const systemInstruction = body.systemInstruction;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({
        error: 'Prompt wajib diisi.'
      });
    }

    const requestBody: any = {
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

    if (
      systemInstruction &&
      typeof systemInstruction === 'string'
    ) {
      requestBody.systemInstruction = {
        parts: [
          {
            text: systemInstruction
          }
        ]
      };
    }

    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/' +
        MODEL +
        ':generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify(requestBody)
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemini API error:', data);

      return res.status(response.status).json({
        error:
          data?.error?.message ||
          'Gemini API request gagal.'
      });
    }

    const text =
      data?.candidates?.[0]?.content?.parts
        ?.map((part: any) => part?.text || '')
        .join('') || '';

    if (!text) {
      return res.status(502).json({
        error: 'Gemini tidak mengembalikan hasil teks.'
      });
    }

    return res.status(200).json({
      text: text
    });
  } catch (error: any) {
    console.error('Server error:', error);

    return res.status(500).json({
      error:
        error?.message ||
        'Terjadi kesalahan pada server.'
    });
  }
}
```
