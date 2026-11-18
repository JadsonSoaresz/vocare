// ============================================================
// VOCARE — Edge Function: ai-proxy
// Intermediário seguro para chamadas à API Claude
// Verifica JWT do Supabase antes de repassar à Anthropic
// ============================================================

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

const SYSTEM_PROMPTS: Record<string, string> = {
  onboarding: `Você é a Voca, assistente de orientação profissional da plataforma Vocare.
Seu tom é acolhedor, próximo e sem formalismo escolar. Use linguagem jovem, mas sem gírias excessivas. Não use emojis.
Você está conversando com um(a) estudante do ensino médio da rede pública do Piauí.

Seu objetivo é mapear, de forma natural e conversacional:
1. Interesses pessoais (o que gosta de fazer, matérias favoritas)
2. Traços de personalidade (introvertido/extrovertido, analítico/criativo etc.)
3. Habilidades percebidas (o que as pessoas pedem ajuda a ele/ela)
4. Contexto de vida (família, referências de carreira, sonhos)

Faça UMA pergunta por vez. Após 6 trocas, sintetize um perfil vocacional inicial em JSON com os campos:
{ "interests": [], "personality_traits": [], "skills": [], "context_summary": "" }
Retorne APENAS o JSON no último turno, sem texto adicional.`,

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
Foque em orientação de carreira para estudantes do ensino médio público.`,
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    // ── 1. Verify JWT ──────────────────────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Missing Authorization header' }, 401);
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', ''),
    );

    if (authError || !user) {
      return json({ error: 'Unauthorized' }, 401);
    }

    // ── 2. Parse body ──────────────────────────────────────
    const body = await req.json();
    const { messages, phase = 'general', max_tokens = 1000 } = body;

    if (!messages || !Array.isArray(messages)) {
      return json({ error: 'Invalid messages array' }, 400);
    }

    // Validate messages
    const validMessages = messages
      .filter(m => m?.role && m?.content && typeof m.content === 'string')
      .slice(-20); // Limit context window

    if (!validMessages.length) {
      return json({ error: 'No valid messages' }, 400);
    }

    // ── 3. Select model based on complexity ───────────────
    const complexPhases = ['onboarding', 'test'];
    const model = complexPhases.includes(phase)
      ? 'claude-sonnet-4-20250514'
      : 'claude-haiku-4-5-20251001';

    // ── 4. Call Claude API ─────────────────────────────────
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicKey) {
      return json({ error: 'API not configured' }, 500);
    }

    const anthropicResponse = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: Math.min(max_tokens, 2000),
        system:   SYSTEM_PROMPTS[phase] || SYSTEM_PROMPTS.general,
        messages: validMessages,
      }),
    });

    if (!anthropicResponse.ok) {
      const errBody = await anthropicResponse.text();
      console.error('Anthropic API error:', anthropicResponse.status, errBody);
      return json({ error: `AI service error: ${anthropicResponse.status}` }, 502);
    }

    const data = await anthropicResponse.json();
    const content = data.content?.[0]?.text ?? '';

    // ── 5. Return content ──────────────────────────────────
    return json({ content }, 200);

  } catch (err) {
    console.error('ai-proxy error:', err);
    return json({ error: 'Internal server error' }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}
