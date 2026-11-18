/* ============================================================
   VOCARE — Supabase Client + Database Helpers
   js/supabase.js · Inicialização, queries, realtime
   ============================================================ */

'use strict';

/* ── Inicialização ──────────────────────────────────────────── */
const { createClient } = window.supabase;

// Detecta credenciais placeholder e exibe aviso legível
if (
  !CONFIG.SUPABASE_URL ||
  CONFIG.SUPABASE_URL.includes('SEU_PROJECT_ID') ||
  !CONFIG.SUPABASE_ANON_KEY ||
  CONFIG.SUPABASE_ANON_KEY === 'sua-anon-key-aqui'
) {
  document.body.innerHTML = `
    <div style="
      font-family:Inter,sans-serif;max-width:520px;margin:80px auto;
      padding:32px;border:2px solid #F0A500;border-radius:16px;
      background:#fffbf0;text-align:center;line-height:1.6
    ">
      <div style="font-size:48px;margin-bottom:16px"><i data-icon="wrench"></i></div>
      <h2 style="color:#1A3C6E;margin-bottom:12px">Configuração necessária</h2>
      <p style="color:#555;margin-bottom:20px">
        As credenciais do Supabase ainda são placeholder.<br>
        Edite <strong>js/config.js</strong> com sua URL e chave reais.
      </p>
      <code style="
        display:block;background:#f4f4f4;padding:12px;border-radius:8px;
        font-size:13px;text-align:left;color:#333;margin-bottom:20px
      ">SUPABASE_URL:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&lsquo;https://xxxx.supabase.co&rsquo;,<br>
SUPABASE_ANON_KEY: &lsquo;eyJ...sua-chave...&rsquo;,</code>
      <p style="color:#555;font-size:14px">
        Siga o guia em
        <a href="../docs/SUPABASE_SETUP.md" style="color:#2E6DB4;font-weight:600">
          docs/SUPABASE_SETUP.md
        </a>
        para obter suas credenciais no painel do Supabase.
      </p>
    </div>
  `;
  throw new Error('[Vocare] Credenciais do Supabase não configuradas. Veja js/config.js');
}

let _client;
try {
  _client = createClient(
    CONFIG.SUPABASE_URL,
    CONFIG.SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession:     true,
        autoRefreshToken:   true,
        detectSessionInUrl: true,
      },
    }
  );
} catch (e) {
  const msg = e?.message || String(e);
  console.error('[Vocare] Falha ao inicializar Supabase:', e);
  document.body.innerHTML = `
    <div style="font-family:Inter,sans-serif;max-width:560px;margin:80px auto;
      padding:32px;border:2px solid #CC0000;border-radius:16px;background:#fff5f5">
      <h2 style="color:#CC0000;margin-bottom:12px">Erro ao inicializar Supabase</h2>
      <p style="color:#555;margin-bottom:12px">
        O cliente Supabase não pôde ser criado com as credenciais atuais.<br>
        Verifique <strong>js/config.js</strong> e certifique-se de usar a
        <strong>Publishable key</strong> (não a Secret key).
      </p>
      <code style="display:block;background:#f4f4f4;padding:12px;border-radius:8px;
        font-size:13px;color:#CC0000;word-break:break-all">${msg}</code>
    </div>`;
  throw e;
}

// Verificar se o client foi criado corretamente
if (!_client?.auth) {
  const msg = 'Client inicializado sem módulo auth. Verifique a chave (deve ser Publishable key) e a versão do supabase-js.';
  console.error('[Vocare]', msg);
  document.body.innerHTML = `
    <div style="font-family:Inter,sans-serif;max-width:560px;margin:80px auto;
      padding:32px;border:2px solid #CC0000;border-radius:16px;background:#fff5f5">
      <h2 style="color:#CC0000;margin-bottom:12px">Supabase client inválido</h2>
      <p style="color:#555">${msg}</p>
    </div>`;
  throw new Error(msg);
}

window.supabase = _client; // sobrescreve namespace com o client

/* ── Database Helpers ───────────────────────────────────────── */
const DB = {

  /* ── profiles ── */
  profiles: {
    async get(userId) {
      const { data, error } = await _client
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) throw error;
      return data;
    },

    async update(userId, updates) {
      const { data, error } = await _client
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async upsert(profile) {
      const { data, error } = await _client
        .from('profiles')
        .upsert(profile)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
  },

  /* ── student_resumes (perfil/currículo) ── */
  resumes: {
    async get(studentId) {
      const { data, error } = await _client
        .from('student_resumes')
        .select('*')
        .eq('student_id', studentId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },

    async save(studentId, resume) {
      const { data, error } = await _client
        .from('student_resumes')
        .upsert({ ...resume, student_id: studentId }, { onConflict: 'student_id' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    // Para empresas/mentores/admin: currículos publicados (RLS filtra o resto)
    async listPublished(limit = 50) {
      const { data, error } = await _client
        .from('student_resumes')
        .select('*, student:profiles!student_id(id, name, avatar_url, city, state, school)')
        .eq('is_public', true)
        .order('updated_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data || [];
    },
  },

  /* ── Comunidade (seguir, perfis, feed) ── */
  social: {
    PERSON: 'id, name, avatar_url, role, school, city, state',

    async getSettings(userId) {
      const { data, error } = await _client
        .from('social_settings').select('*').eq('user_id', userId).maybeSingle();
      if (error) throw error;
      return data || { user_id: userId, is_private: true, bio: null, cover_area: null };
    },

    async saveSettings(userId, settings) {
      const { data, error } = await _client
        .from('social_settings')
        .upsert({ ...settings, user_id: userId }, { onConflict: 'user_id' })
        .select().single();
      if (error) throw error;
      return data;
    },

    async counts(userId) {
      const { data, error } = await _client.rpc('social_counts', { target: userId });
      if (error) throw error;
      return (Array.isArray(data) ? data[0] : data) || { followers: 0, following: 0, activities: 0 };
    },

    // Relação entre o usuário logado (me) e outro perfil
    async relation(me, other) {
      const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!UUID.test(me) || !UUID.test(other)) throw new Error('Perfil inválido.');
      const [{ data: rows, error }, { data: blocks, error: e2 }] = await Promise.all([
        _client.from('follows').select('*')
          .or(`and(follower_id.eq.${me},following_id.eq.${other}),and(follower_id.eq.${other},following_id.eq.${me})`),
        _client.from('blocks').select('*').eq('blocker_id', me).eq('blocked_id', other),
      ]);
      if (error) throw error;
      if (e2) throw e2;
      const out  = (rows || []).find(r => r.follower_id === me);
      const inc  = (rows || []).find(r => r.follower_id === other);
      return {
        iFollow:     out?.status || null,   // null | 'pending' | 'accepted'
        followsMe:   inc?.status || null,
        iBlocked:    (blocks || []).length > 0,
      };
    },

    async follow(me, target) {
      const { data, error } = await _client
        .from('follows').insert({ follower_id: me, following_id: target }).select().single();
      if (error) throw error;
      return data;
    },
    async unfollow(me, target) {
      const { error } = await _client.from('follows').delete().eq('follower_id', me).eq('following_id', target);
      if (error) throw error;
    },
    async removeFollower(me, follower) {
      const { error } = await _client.from('follows').delete().eq('follower_id', follower).eq('following_id', me);
      if (error) throw error;
    },
    async accept(me, follower) {
      const { error } = await _client.from('follows').update({ status: 'accepted' })
        .eq('follower_id', follower).eq('following_id', me);
      if (error) throw error;
    },
    async block(me, target) {
      const { error } = await _client.from('blocks').insert({ blocker_id: me, blocked_id: target });
      if (error) throw error;
    },
    async unblock(me, target) {
      const { error } = await _client.from('blocks').delete().eq('blocker_id', me).eq('blocked_id', target);
      if (error) throw error;
    },

    async pendingRequests(me) {
      const { data, error } = await _client
        .from('follows').select(`created_at, follower:profiles!follower_id(${this.PERSON})`)
        .eq('following_id', me).eq('status', 'pending').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(r => ({ ...r.follower, requested_at: r.created_at })).filter(p => p.id);
    },

    async followers(userId) {
      const { data, error } = await _client
        .from('follows').select(`follower:profiles!follower_id(${this.PERSON})`)
        .eq('following_id', userId).eq('status', 'accepted').order('accepted_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(r => r.follower).filter(Boolean);
    },

    async following(userId) {
      const { data, error } = await _client
        .from('follows').select(`following:profiles!following_id(${this.PERSON})`)
        .eq('follower_id', userId).eq('status', 'accepted').order('accepted_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(r => r.following).filter(Boolean);
    },

    // Ids que o usuário segue (aceitos) ou pediu para seguir
    async myFollowState(me) {
      const { data, error } = await _client.from('follows').select('following_id, status').eq('follower_id', me);
      if (error) throw error;
      return Object.fromEntries((data || []).map(r => [r.following_id, r.status]));
    },

    async activities({ actorIds, limit = 30 }) {
      if (!actorIds.length) return [];
      const { data, error } = await _client
        .from('activities')
        .select(`*, actor:profiles!actor_id(${this.PERSON}), kudos:activity_kudos(user_id)`)
        .in('actor_id', actorIds)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data || [];
    },

    async kudos(activityId, me, on) {
      const q = on
        ? _client.from('activity_kudos').insert({ activity_id: activityId, user_id: me })
        : _client.from('activity_kudos').delete().eq('activity_id', activityId).eq('user_id', me);
      const { error } = await q;
      if (error) throw error;
    },

    async search(me, term) {
      const t = term.replace(/[%_,()]/g, ' ').trim();
      if (t.length < 2) return [];
      const { data, error } = await _client
        .from('profiles').select(this.PERSON)
        .ilike('name', `%${t}%`).neq('id', me).limit(20);
      if (error) throw error;
      return data || [];
    },

    // Sugestões: mesma escola, depois mesma cidade, depois mentores
    async suggestions(me, profile, exclude = []) {
      const skip = new Set([me, ...exclude]);
      const pick = async (q) => { const { data } = await q.limit(12); return data || []; };
      const base = () => _client.from('profiles').select(this.PERSON).neq('id', me);
      const lists = await Promise.all([
        profile?.school ? pick(base().eq('school', profile.school)) : [],
        profile?.city   ? pick(base().eq('city', profile.city))     : [],
        pick(base().eq('role', 'mentor')),
      ]);
      const out = [];
      for (const p of lists.flat()) {
        if (!skip.has(p.id)) { skip.add(p.id); out.push(p); }
        if (out.length >= 6) break;
      }
      return out;
    },
  },

  /* ── vocational_profiles ── */
  vocationalProfiles: {
    async get(studentId) {
      const { data, error } = await _client
        .from('vocational_profiles')
        .select('*')
        .eq('student_id', studentId)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },

    async upsert(studentId, updates) {
      const existing = await this.get(studentId);
      const record = {
        student_id:  studentId,
        updated_at:  new Date().toISOString(),
        ...existing,
        ...updates,
      };
      if (!record.id) delete record.id;
      const { data, error } = await _client
        .from('vocational_profiles')
        .upsert(record)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
  },

  /* ── professions ── */
  professions: {
    async list(filters = {}) {
      let q = _client.from('professions').select('*');
      if (filters.area)   q = q.eq('area', filters.area);
      if (filters.search) q = q.ilike('name', `%${filters.search}%`);
      const { data, error } = await q.order('name');
      if (error) throw error;
      return data || [];
    },

    async get(id) {
      const { data, error } = await _client
        .from('professions')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },

    async getAreas() {
      const { data, error } = await _client
        .from('professions')
        .select('area')
        .not('area', 'is', null);
      if (error) throw error;
      return [...new Set((data || []).map(d => d.area))].sort();
    },
  },

  /* ── career_recommendations ── */
  recommendations: {
    async getForStudent(studentId, limit = 10) {
      const { data, error } = await _client
        .from('career_recommendations')
        .select(`
          *,
          profession:professions(*)
        `)
        .eq('student_id', studentId)
        .order('compatibility_score', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data || [];
    },

    async save(studentId, recommendations) {
      const records = recommendations.map(r => ({
        student_id:          studentId,
        profession_id:       r.professionId || r.profession_id,
        compatibility_score: r.score || r.compatibility_score,
        created_at:          new Date().toISOString(),
      }));

      // Delete existing recommendations first
      await _client
        .from('career_recommendations')
        .delete()
        .eq('student_id', studentId);

      const { data, error } = await _client
        .from('career_recommendations')
        .insert(records)
        .select();
      if (error) throw error;
      return data;
    },
  },

  /* ── career_plans ── */
  careerPlans: {
    async get(studentId) {
      const { data, error } = await _client
        .from('career_plans')
        .select(`
          *,
          profession:professions(name, area)
        `)
        .eq('student_id', studentId)
        .order('generated_at', { ascending: false })
        .limit(1)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },

    async save(studentId, professionId, planData) {
      const record = {
        student_id:           studentId,
        profession_id:        professionId,
        learning_path:        planData.learning_path || [],
        recommended_courses:  planData.recommended_courses || [],
        skills_to_develop:    planData.skills_to_develop || [],
        weekly_goals:         planData.weekly_goals || [],
        generated_at:         new Date().toISOString(),
        updated_at:           new Date().toISOString(),
      };

      const { data, error } = await _client
        .from('career_plans')
        .upsert(record, { onConflict: 'student_id' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async updateGoals(planId, goals) {
      const { data, error } = await _client
        .from('career_plans')
        .update({ weekly_goals: goals, updated_at: new Date().toISOString() })
        .eq('id', planId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
  },

  /* ── mentors ── */
  mentors: {
    async list(filters = {}) {
      let q = _client
        .from('mentors')
        .select(`
          *,
          profile:profiles(id, name, avatar_url, city)
        `)
        .eq('is_approved', true);

      if (filters.area)      q = q.eq('area', filters.area);
      if (filters.available) q = q.eq('is_available', true);

      const { data, error } = await q.order('reputation_score', { ascending: false });
      if (error) throw error;
      return data || [];
    },

    async get(mentorId) {
      const { data, error } = await _client
        .from('mentors')
        .select(`
          *,
          profile:profiles(id, name, avatar_url, email, city, state)
        `)
        .eq('id', mentorId)
        .single();
      if (error) throw error;
      return data;
    },

    async checkFreeSessions(mentorId, studentId) {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const { count, error } = await _client
        .from('mentoring_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('mentor_id', mentorId)
        .eq('student_id', studentId)
        .eq('is_premium', false)
        .neq('status', 'cancelled')
        .gte('created_at', monthStart.toISOString());

      if (error) throw error;
      return (count || 0) < CONFIG.BUSINESS.FREE_SESSIONS_PER_MONTH;
    },
  },

  /* ── mentoring_sessions ── */
  sessions: {
    async create(sessionData) {
      const { data, error } = await _client
        .from('mentoring_sessions')
        .insert(sessionData)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async get(sessionId) {
      const { data, error } = await _client
        .from('mentoring_sessions')
        .select(`
          *,
          student:profiles!student_id(id, name, avatar_url),
          mentor:profiles!mentor_id(id, name, avatar_url)
        `)
        .eq('id', sessionId)
        .single();
      if (error) throw error;
      return data;
    },

    async updateStatus(sessionId, status) {
      const updates = { status };
      if (status === 'completed') updates.completed_at = new Date().toISOString();
      const { data, error } = await _client
        .from('mentoring_sessions')
        .update(updates)
        .eq('id', sessionId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async rate(sessionId, rating) {
      const { data, error } = await _client
        .from('mentoring_sessions')
        .update({ student_rating: rating })
        .eq('id', sessionId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async listForStudent(studentId) {
      const { data, error } = await _client
        .from('mentoring_sessions')
        .select(`
          *,
          mentor:profiles!mentor_id(id, name, avatar_url)
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },

    async listForMentor(mentorId) {
      const { data, error } = await _client
        .from('mentoring_sessions')
        .select(`
          *,
          student:profiles!student_id(id, name, avatar_url, school)
        `)
        .eq('mentor_id', mentorId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  },

  /* ── messages ── */
  messages: {
    async list(sessionId) {
      const { data, error } = await _client
        .from('messages')
        .select(`
          *,
          sender:profiles!sender_id(id, name, avatar_url)
        `)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    },

    async send(sessionId, senderId, content) {
      const { data, error } = await _client
        .from('messages')
        .insert({
          session_id:  sessionId,
          sender_id:   senderId,
          content:     content.trim(),
          created_at:  new Date().toISOString(),
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    subscribe(sessionId, onMessage) {
      return _client
        .channel(`messages:${sessionId}`)
        .on('postgres_changes', {
          event:  'INSERT',
          schema: 'public',
          table:  'messages',
          filter: `session_id=eq.${sessionId}`,
        }, payload => onMessage(payload.new))
        .subscribe();
    },
  },

  /* ── ai_conversations ── */
  aiConversations: {
    async save(studentId, phase, messages) {
      const { data, error } = await _client
        .from('ai_conversations')
        .upsert({
          student_id:  studentId,
          phase,
          messages,
          created_at:  new Date().toISOString(),
        }, { onConflict: 'student_id,phase' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    async load(studentId, phase) {
      const { data, error } = await _client
        .from('ai_conversations')
        .select('*')
        .eq('student_id', studentId)
        .eq('phase', phase)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  },

  /* ── job_listings ── */
  jobs: {
    async listForStudent(studentProfile) {
      const { data, error } = await _client
        .from('job_listings')
        .select('*, company:profiles!company_id(name, avatar_url)')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  },

  /* ── notifications ── */
  notifications: {
    async list(studentId) {
      const { data, error } = await _client
        .from('notifications')
        .select('*')
        .eq('student_id', studentId)
        .order('sent_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },

    async countUnread(studentId) {
      const { count, error } = await _client
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', studentId)
        .eq('was_read', false);
      if (error) return 0;
      return count || 0;
    },

    async markRead(notificationId) {
      await _client
        .from('notifications')
        .update({ was_read: true })
        .eq('id', notificationId);
    },
  },
};

/* ── Realtime Helpers ───────────────────────────────────────── */
const Realtime = {
  channels: new Map(),

  subscribe(channelName, table, filter, events, callback) {
    if (this.channels.has(channelName)) {
      _client.removeChannel(this.channels.get(channelName));
    }

    const ch = _client
      .channel(channelName)
      .on('postgres_changes', {
        event:  events || '*',
        schema: 'public',
        table,
        filter,
      }, callback)
      .subscribe();

    this.channels.set(channelName, ch);
    return ch;
  },

  unsubscribe(channelName) {
    const ch = this.channels.get(channelName);
    if (ch) {
      _client.removeChannel(ch);
      this.channels.delete(channelName);
    }
  },

  unsubscribeAll() {
    this.channels.forEach((ch) => _client.removeChannel(ch));
    this.channels.clear();
  },
};

/* ── Storage Helpers ────────────────────────────────────────── */
const SupaStorage = {
  async uploadAvatar(userId, file) {
    const ext = file.name.split('.').pop();
    const path = `avatars/${userId}.${ext}`;
    const { data, error } = await _client.storage
      .from('public')
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) throw error;
    const { data: urlData } = _client.storage.from('public').getPublicUrl(path);
    // Mesmo caminho a cada troca: o ?v= evita a foto antiga em cache
    return `${urlData.publicUrl}?v=${Date.now()}`;
  },
};

/* ── Last Active Tracking ───────────────────────────────────── */
async function updateLastActive(userId) {
  if (!userId) return;
  try {
    await _client
      .from('profiles')
      .update({ last_active: new Date().toISOString() })
      .eq('id', userId);
  } catch {}
}

/* ── Export ─────────────────────────────────────────────────── */
window.DB          = DB;
window.Realtime    = Realtime;
window.SupaStorage = SupaStorage;
window.updateLastActive = updateLastActive;
