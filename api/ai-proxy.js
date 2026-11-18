// Vocare — AI Proxy com suporte a múltiplos provedores
// Prioridade: Anthropic Claude → Google Gemini → Groq
// Configure apenas UMA chave no .env para começar

const SYSTEM_PROMPTS = {
  onboarding: `Você é a Voca, assistente de orientação profissional da plataforma Vocare.
Seu tom é acolhedor, próximo e sem formalismo escolar. Use linguagem jovem, mas sem gírias excessivas. Não use emojis.
Você está conversando com um(a) estudante do ensino médio da rede pública do Piauí.

Seu objetivo é mapear, de forma natural e conversacional:
1. Interesses pessoais (o que gosta de fazer, matérias favoritas)
2. Traços de personalidade (introvertido/extrovertido, analítico/criativo etc.)
3. Habilidades percebidas (o que as pessoas pedem ajuda a ele/ela)
4. Contexto de vida (família, referências de carreira, sonhos)

Faça UMA pergunta por vez. Seja caloroso(a) e encorajador(a).
Após 6 trocas, sintetize um perfil vocacional inicial em JSON com os campos:
{ "interests": [], "personality_traits": [], "skills": [], "context_summary": "" }
Retorne APENAS o JSON no último turno, sem texto adicional, sem markdown.`,

  test: `Você conduz um teste vocacional adaptativo para um(a) estudante do ensino médio público do Piauí.
Recebe as respostas anteriores do estudante e retorna a próxima pergunta mais relevante para refinar o perfil vocacional.
Cada pergunta deve ter exatamente 4 opções claras, específicas e mutuamente exclusivas — nunca vagas ou repetitivas.

Formato de retorno a cada pergunta (JSON válido, sem markdown):
{
  "question": "texto da pergunta",
  "options": ["opção A", "opção B", "opção C", "opção D"],
  "is_final": false
}

Após 5 a 7 perguntas respondidas, quando tiver confiança suficiente sobre o perfil do estudante, retorne OBRIGATORIAMENTE is_final: true e adicione:
"profile": {
  "interests": [],
  "traits": [],
  "top_areas": [],
  "recommended_professions": [
    { "name": "Nome exato da profissão", "compatibility_score": 92, "reason": "1 frase curta explicando o motivo" }
  ]
}

REGRAS OBRIGATÓRIAS para o profile final:
- top_areas: NO MÁXIMO 2 áreas, usando SOMENTE estes nomes exatos: Tecnologia, Saúde, Educação, Direito, Engenharia, Administração, Comunicação, Artes, Ciências, Ciências Sociais, Agronegócio, Gastronomia, Meio Ambiente, Esportes, Segurança, Moda, Turismo
- NÃO escreva "TI", "Computação", "Informática", "Software" — escreva sempre "Tecnologia"
- Se o estudante mencionou computadores, jogos, programação, internet → top_areas DEVE conter "Tecnologia"
- recommended_professions deve ter EXATAMENTE 3 itens — as três profissões que MAIS combinam com o estudante, nunca mais que isso. Prefira poucas opções bem justificadas a uma lista longa e genérica
- Ordene recommended_professions da maior para a menor compatibility_score
- compatibility_score é um número de 0 a 100 que reflete o QUANTO essa profissão específica combina com ESTE estudante, considerando TODAS as respostas dadas na conversa. Varie os três valores de forma realista e proporcional às evidências coletadas — nunca repita o mesmo número para profissões diferentes
- Só use compatibility_score acima de 85 quando houver evidência forte e direta nas respostas do estudante
- Use nomes de profissões específicos e em português (ex: "Engenheiro(a) de Software", "Médico(a)", "Advogado(a)")

Nunca use markdown. Retorne APENAS JSON válido.`,

  general: `Você é a Voca, assistente de orientação profissional da Vocare.
Tom acolhedor, jovem e encorajador. Responda de forma concisa e útil. Não use emojis.
Foque em orientação de carreira para estudantes do ensino médio público do Piauí.`,
};

// ── Detecta qual provedor usar ───────────────────────────────
function getProvider() {
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  if (process.env.GOOGLE_AI_KEY)     return 'gemini';
  if (process.env.GROQ_API_KEY)      return 'groq';
  return null;
}

// ── Anthropic Claude ─────────────────────────────────────────
async function callAnthropic(systemPrompt, messages, maxTokens, phase) {
  const complexPhases = ['onboarding', 'test'];
  const model = complexPhases.includes(phase)
    ? 'claude-sonnet-4-20250514'
    : 'claude-haiku-4-5-20251001';

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type':      'application/json',
      'x-api-key':         process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({ model, max_tokens: maxTokens, system: systemPrompt, messages }),
  });

  if (!res.ok) throw new Error(`Anthropic error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.content?.[0]?.text ?? '';
}

// ── Google Gemini (GRÁTIS) ───────────────────────────────────
async function callGemini(systemPrompt, messages, maxTokens) {
  // Gemini usa "model" em vez de "assistant" e formato diferente
  const contents = messages.map(m => ({
    role:  m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  // Gemini exige que a primeira mensagem seja do usuário
  if (contents[0]?.role === 'model') {
    contents.unshift({ role: 'user', parts: [{ text: '.' }] });
  }

  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents,
    generationConfig: {
      maxOutputTokens: Math.min(maxTokens, 2048),
      temperature:     0.7,
    },
  };

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GOOGLE_AI_KEY}`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    }
  );

  if (!res.ok) throw new Error(`Gemini error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

// ── Groq — Llama 3 (GRÁTIS) ─────────────────────────────────
async function callGroq(systemPrompt, messages, maxTokens, phase) {
  const complexPhases = ['onboarding', 'test'];
  const model = complexPhases.includes(phase)
    ? 'openai/gpt-oss-120b'   // mais capaz para tarefas complexas
    : 'openai/gpt-oss-20b';    // mais rápido para respostas simples

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: Math.min(maxTokens, 2000),
      reasoning_effort: 'low', // gpt-oss raciocina antes de responder; 'low' poupa tokens e tempo
      messages:   [{ role: 'system', content: systemPrompt }, ...messages],
    }),
  });

  if (!res.ok) throw new Error(`Groq error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

// ── Handler principal ────────────────────────────────────────
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')    return res.status(405).json({ error: 'Método não permitido.' });

  const provider = getProvider();
  if (!provider) {
    return res.status(500).json({
      error: 'Nenhuma chave de IA configurada. Adicione GOOGLE_AI_KEY, GROQ_API_KEY ou ANTHROPIC_API_KEY no arquivo .env',
    });
  }

  const { messages, phase = 'general', max_tokens = 1000 } = req.body || {};

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Campo "messages" inválido ou vazio.' });
  }

  const validMessages = messages
    .filter(m => m?.role && typeof m.content === 'string' && m.content.trim())
    .slice(-20);

  if (!validMessages.length) {
    return res.status(400).json({ error: 'Nenhuma mensagem válida encontrada.' });
  }

  const systemPrompt = SYSTEM_PROMPTS[phase] || SYSTEM_PROMPTS.general;
  const maxTokens    = Math.min(Number(max_tokens) || 1000, 2000);

  try {
    let content = '';

    if (provider === 'anthropic') {
      content = await callAnthropic(systemPrompt, validMessages, maxTokens, phase);
    } else if (provider === 'gemini') {
      content = await callGemini(systemPrompt, validMessages, maxTokens);
    } else if (provider === 'groq') {
      content = await callGroq(systemPrompt, validMessages, maxTokens, phase);
    }

    return res.json({ content, provider });

  } catch (err) {
    console.error(`[${provider}] ai-proxy error:`, err.message);
    return res.status(502).json({ error: `Erro no serviço de IA (${provider}): ${err.message}` });
  }
};
