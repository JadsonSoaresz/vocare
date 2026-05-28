# Vocare — Configuração do n8n (Notificações WhatsApp)

## Visão geral

O n8n automatiza as notificações WhatsApp para estudantes inativos e lembretes de metas.

## 1. Instalar o n8n

### Opção A: n8n Cloud (recomendado para MVP)
1. Acesse [n8n.io](https://n8n.io) e crie uma conta
2. Crie um novo workflow

### Opção B: Self-hosted com Docker
```bash
docker run -it --rm --name n8n -p 5678:5678 n8nio/n8n
```

## 2. Configurar a API do WhatsApp (Meta)

### Pré-requisitos
1. Conta Business no Meta Business Suite
2. Número de telefone aprovado para WhatsApp Business API
3. App criado no [developers.facebook.com](https://developers.facebook.com)

### Configurar templates aprovados
No Meta Business Manager, crie templates aprovados:

**Template: vocare_inactivity**
```
Ei {{1}}! Sua trilha de carreira em {{2}} está esperando por você 🚀 
Que tal retomar hoje? Acesse: {{3}}
```

**Template: vocare_goal_reminder**
```
{{1}}, você tem uma meta para essa semana na Vocare. 
Bora concluir? 💪 Acesse: {{4}}
```

## 3. Workflow n8n: Notificações de Inatividade

### Nós do Workflow:

```
[Cron Trigger] → [Supabase Query] → [IF: Inactive?] → [Anthropic: Personalizar] → [WhatsApp Send] → [Supabase: Log]
```

### 1. Cron Trigger
- Executar: Todos os dias às 10:00h
- Timezone: America/Fortaleza

### 2. Supabase Query (HTTP Request)
```
URL: https://SEU_PROJECT_ID.supabase.co/rest/v1/profiles
Headers:
  apikey: SUPABASE_SERVICE_ROLE_KEY
  Authorization: Bearer SUPABASE_SERVICE_ROLE_KEY
Params:
  role: eq.student
  phone: not.is.null
  last_active: lt.{{ $now.minus({days: 3}).toISO() }}
  select: id,name,phone
```

### 3. Check Notification Limit (Supabase Query)
```sql
-- Para cada estudante, verificar se enviou < 3 notificações esta semana
SELECT COUNT(*) FROM notifications 
WHERE student_id = 'STUDENT_ID' 
  AND sent_at >= NOW() - INTERVAL '7 days';
```

### 4. Anthropic: Personalizar Mensagem
```
URL: https://api.anthropic.com/v1/messages
Headers:
  x-api-key: ANTHROPIC_API_KEY
Body:
  model: claude-haiku-4-5-20251001
  max_tokens: 150
  messages:
    - role: user
      content: "Escreva uma mensagem de incentivo curta (1-2 frases) para o estudante {{name}} que está inativo na plataforma Vocare há 3+ dias. Tom jovem e encorajador. Sem emojis excessivos."
```

### 5. WhatsApp Send (HTTP Request)
```
URL: https://graph.facebook.com/v19.0/PHONE_ID/messages
Headers:
  Authorization: Bearer WHATSAPP_TOKEN
Body:
{
  "messaging_product": "whatsapp",
  "to": "55{{ phone }}",
  "type": "template",
  "template": {
    "name": "vocare_inactivity",
    "language": { "code": "pt_BR" },
    "components": [{
      "type": "body",
      "parameters": [
        { "type": "text", "text": "{{ name }}" },
        { "type": "text", "text": "{{ ai_message }}" }
      ]
    }]
  }
}
```

### 6. Supabase Log
```
URL: https://SEU_PROJECT_ID.supabase.co/rest/v1/notifications
Method: POST
Body:
{
  "student_id": "{{ student_id }}",
  "type": "inactivity",
  "message": "{{ ai_message }}",
  "was_read": false
}
```

## 4. Workflow n8n: Lembretes de Meta Semanal

Similar ao workflow acima, mas:
- Cron: Segundas-feiras às 09:00h
- Query: Estudantes com metas pendentes na semana atual
- Template: `vocare_goal_reminder`

## 5. Limites (RN-08)

O workflow deve verificar:
```javascript
// Node: Function
const count = items[0].json.count;
if (count >= 3) {
  // Skip — limite de 3 notificações/semana atingido
  return [];
}
return items;
```

## 6. Testar

1. No n8n, use o botão **Test Workflow**
2. Verifique o WhatsApp do número de teste
3. Confirme o log na tabela `notifications` do Supabase
