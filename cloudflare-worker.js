/**
 * Cloudflare Worker — Proxy seguro para Gemini API
 *
 * Deploy:
 *   1. Acesse https://workers.cloudflare.com → crie um Worker
 *   2. Cole este código no editor
 *   3. Vá em Settings → Variables → adicione:
 *        GEMINI_API_KEY = AIzaSy...sua_chave
 *        ALLOWED_ORIGIN = https://seu-usuario.github.io
 *   4. Salve e anote a URL do Worker (ex: https://origin-proxy.seu-usuario.workers.dev)
 */

export default {
  async fetch(request, env) {
    const allowedOrigin = env.ALLOWED_ORIGIN || '*';

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': allowedOrigin,
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // Só aceita POST em /analyze
    const url = new URL(request.url);
    if (request.method !== 'POST' || url.pathname !== '/analyze') {
      return new Response('Not found', { status: 404 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: 'Payload inválido.' }, 400, allowedOrigin);
    }

    const { summary } = body;
    if (!summary) return json({ error: 'Campo summary ausente.' }, 400, allowedOrigin);

    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) return json({ error: 'GEMINI_API_KEY não configurada no Worker.' }, 500, allowedOrigin);

    const prompt = `Você é um analista de dados especializado em pesquisa científica em saúde na Origin Health.

Analise os seguintes resultados de deduplicação de planilhas e forneça um relatório técnico conciso:

${JSON.stringify(summary, null, 2)}

Forneça:
1. Uma avaliação da qualidade dos dados (taxa de duplicação, possíveis causas)
2. Comentário sobre o critério de deduplicação utilizado
3. Uma recomendação prática para o pesquisador

Responda em português, de forma direta e técnica, máximo 4 frases por ponto. Sem markdown, sem asteriscos.`;

    try {
      const geminiResp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        }
      );
      const data = await geminiResp.json();
      if (data.error) return json({ error: data.error.message }, 502, allowedOrigin);
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Análise não disponível.';
      return json({ text }, 200, allowedOrigin);
    } catch (err) {
      return json({ error: `Falha Gemini: ${err.message}` }, 502, allowedOrigin);
    }
  },
};

function json(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': origin,
    },
  });
}
