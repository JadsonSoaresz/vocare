/* ============================================================
   VOCARE — Perfil / Currículo do estudante
   js/profile.js · Editor com pré-visualização ao vivo, foto,
   personalização (capa + cor), visibilidade e exportação em PDF.

   profile.html            → o estudante edita o próprio currículo
   profile.html?id=<uuid>  → leitura (empresa, mentor, admin ou o
                             próprio estudante vendo como os outros veem)
   ============================================================ */

'use strict';

(() => {
  /* ── Opções ─────────────────────────────────────────────── */
  const LOOKING_FOR = {
    internship: 'Estágio',
    apprentice: 'Jovem aprendiz',
    trainee:    'Trainee',
    part_time:  'Meio período',
    volunteer:  'Voluntariado',
    freelance:  'Freelance',
  };
  const SHIFTS = { manha: 'Manhã', tarde: 'Tarde', noite: 'Noite', flexivel: 'Flexível' };
  const EDU_LEVELS = { medio: 'Ensino médio', tecnico: 'Curso técnico', superior: 'Graduação', livre: 'Curso livre' };
  const EXP_KINDS = { estagio: 'Estágio', trabalho: 'Trabalho', voluntariado: 'Voluntariado', projeto: 'Projeto escolar', freelance: 'Freelance' };
  const LANG_LEVELS = { basico: 'Básico', intermediario: 'Intermediário', avancado: 'Avançado', fluente: 'Fluente', nativo: 'Nativo' };
  const COLORS = ['#1A3C6E', '#0E4A43', '#7A2F86', '#B4601E', '#A83A27', '#0F5257', '#16233B', '#4A5A16'];
  const SKILL_SUGGESTIONS = ['Comunicação', 'Trabalho em equipe', 'Pacote Office', 'Organização', 'Resolução de problemas',
    'Criatividade', 'Inglês básico', 'Atendimento ao público', 'Canva', 'Lógica de programação'];

  // Listas repetíveis: campos de cada item
  const LISTS = {
    education: {
      title: 'Formação', icon: 'graduation-cap', add: 'Adicionar formação',
      hint: 'Escola atual, cursos técnicos e cursos livres.',
      fields: [
        { key: 'institution', label: 'Instituição', placeholder: 'CETI Pinheiro Machado', span: 2 },
        { key: 'course', label: 'Curso / série', placeholder: '3º ano do ensino médio' },
        { key: 'level', label: 'Nível', type: 'select', options: EDU_LEVELS },
        { key: 'start', label: 'Início', type: 'month' },
        { key: 'end', label: 'Conclusão', type: 'month', currentKey: 'current', currentLabel: 'Cursando' },
      ],
      summary: it => it.institution || it.course,
    },
    experiences: {
      title: 'Experiências', icon: 'briefcase', add: 'Adicionar experiência',
      hint: 'Vale estágio, trabalho, voluntariado, monitoria, grêmio e projetos da escola.',
      fields: [
        { key: 'title', label: 'Função', placeholder: 'Monitor de informática' },
        { key: 'org', label: 'Onde', placeholder: 'Escola, empresa, ONG…' },
        { key: 'kind', label: 'Tipo', type: 'select', options: EXP_KINDS },
        { key: 'start', label: 'Início', type: 'month' },
        { key: 'end', label: 'Fim', type: 'month', currentKey: 'current', currentLabel: 'Atual' },
        { key: 'description', label: 'O que você fez', type: 'textarea', max: 500, span: 2,
          placeholder: 'Ajudei colegas no laboratório, organizei a feira de ciências…' },
      ],
      summary: it => it.title || it.org,
    },
    projects: {
      title: 'Projetos', icon: 'layers', add: 'Adicionar projeto',
      hint: 'Trabalhos, apps, feiras de ciências, portfólio — mostre o que você já fez.',
      fields: [
        { key: 'name', label: 'Nome do projeto', placeholder: 'App de caronas da escola', span: 2 },
        { key: 'description', label: 'Descrição', type: 'textarea', max: 400, span: 2 },
        { key: 'url', label: 'Link (opcional)', type: 'url', placeholder: 'https://…', span: 2 },
      ],
      summary: it => it.name,
    },
    languages: {
      title: 'Idiomas', icon: 'message', add: 'Adicionar idioma',
      fields: [
        { key: 'name', label: 'Idioma', placeholder: 'Inglês' },
        { key: 'level', label: 'Nível', type: 'select', options: LANG_LEVELS },
      ],
      summary: it => it.name,
    },
    certifications: {
      title: 'Certificados e cursos', icon: 'award', add: 'Adicionar certificado',
      fields: [
        { key: 'name', label: 'Nome', placeholder: 'Introdução à programação', span: 2 },
        { key: 'issuer', label: 'Instituição', placeholder: 'Fundação Bradesco' },
        { key: 'year', label: 'Ano', type: 'number', placeholder: '2026' },
        { key: 'url', label: 'Link do certificado (opcional)', type: 'url', placeholder: 'https://…', span: 2 },
      ],
      summary: it => it.name,
    },
  };

  const EMPTY_RESUME = {
    headline: '', about: '', objective: '', looking_for: [], shift: null, available_from: null,
    education: [], experiences: [], projects: [], certifications: [], languages: [], skills: [],
    links: {}, cover_area: null, accent_color: '#1A3C6E', is_public: false, visibility: 'private', show_contact: false,
  };

  // Quem pode ver o currículo (regras aplicadas no banco — migration 008)
  const VISIBILITY = {
    private:   { icon: 'lock',       label: 'Só eu',               badge: 'Privado',
                 desc: 'Ninguém mais vê. Bom enquanto você ainda está montando.' },
    companies: { icon: 'briefcase',  label: 'Empresas e mentores', badge: 'Visível para empresas',
                 desc: 'Empresas parceiras, mentores e a equipe Vocare podem ver e te chamar para vagas.' },
    followers: { icon: 'user-check', label: 'Seguidores',          badge: 'Visível para seguidores',
                 desc: 'Empresas e mentores, mais quem você aprovou como seguidor na Comunidade.' },
    everyone:  { icon: 'users',      label: 'Todos os usuários',   badge: 'Visível para todos',
                 desc: 'Qualquer pessoa com conta na Vocare, incluindo outros estudantes.' },
  };

  /* ── Estado ─────────────────────────────────────────────── */
  let profile = null;       // linha de profiles
  let resume  = null;       // linha de student_resumes
  let isOwner = false;
  let dirty   = false;
  let saving  = false;
  let suggestions = SKILL_SUGGESTIONS;

  const $ = id => document.getElementById(id);

  /* ── Inicialização ──────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    const params   = new URLSearchParams(location.search);
    const viewId   = params.get('id');
    const user     = await Auth.requireAuth();
    if (!user) return;

    const me = Auth.profile;
    isOwner = !viewId || viewId === user.id;

    if (isOwner && me?.role !== 'student') {
      Toast.warning('O currículo é exclusivo para estudantes.');
      Auth.redirectByRole();
      return;
    }

    const targetId = isOwner ? user.id : viewId;
    if (!isOwner || params.get('view') === '1') document.body.classList.add('view-mode');
    if (!isOwner) $('backBtn').classList.remove('hidden');
    if (isOwner) initNavAvatar();

    try {
      const [p, r, vp] = await Promise.all([
        isOwner ? Promise.resolve(me) : DB.profiles.get(targetId),
        DB.resumes.get(targetId),
        isOwner ? DB.vocationalProfiles.get(targetId).catch(() => null) : Promise.resolve(null),
      ]);
      profile = p;
      resume  = { ...EMPTY_RESUME, ...(r || {}) };
      // Currículos salvos antes da migration 008 só têm is_public
      if (!r?.visibility) resume.visibility = r?.is_public ? 'companies' : 'private';
      if (vp) suggestions = [...new Set([...(vp.skills || []), ...SKILL_SUGGESTIONS])].slice(0, 14);

      if (!isOwner && !r) {
        renderUnavailable();
        return;
      }
    } catch (err) {
      Toast.error(handleError(err, 'Não foi possível carregar o perfil.'));
      if (!isOwner) { renderUnavailable(); return; }
      resume = { ...EMPTY_RESUME };
    }

    renderHeader();
    if (isOwner) {
      renderEditor();
      bindOwnerActions();
    }
    renderPreview();
    renderMeter();
    bindCommonActions();
  }

  /* ── Cabeçalho (capa, foto, nome) ───────────────────────── */
  function renderHeader() {
    const area = resume.cover_area || '';
    $('pfCover').style.backgroundImage = `url('${Art.cover(area, profile?.name || 'perfil', { glyph: 'none' })}')`;
    $('pfPhoto').insertAdjacentHTML('afterbegin', `<div id="pfPhotoImg" style="width:100%;height:100%">${Art.avatarImg(profile?.name, profile?.avatar_url)}</div>`);
    updateIdentity();
  }

  function updateIdentity() {
    $('pfName').textContent = profile?.name || 'Estudante';
    $('pfHeadline').textContent = resume.headline || [profile?.school, profile?.city].filter(Boolean).join(' · ');
    const badge = $('pfVisibilityBadge');
    if (badge) {
      const v = VISIBILITY[resume.visibility] || VISIBILITY.private;
      badge.className = `badge owner-only ${resume.visibility === 'private' ? 'badge-muted' : 'badge-success'}`;
      badge.innerHTML = `<i data-icon="${v.icon}"></i> ${v.badge}`;
    }
    $('pfCover').style.backgroundImage = `url('${Art.cover(resume.cover_area || '', profile?.name || 'perfil', { glyph: 'none' })}')`;
    document.title = `${profile?.name || 'Perfil'} — Vocare`;
  }

  /* ── Editor ─────────────────────────────────────────────── */
  function renderEditor() {
    const form = $('pfEditor');
    form.innerHTML = [
      sectionPersonalize(),
      sectionBasics(),
      sectionAbout(),
      sectionAvailability(),
      sectionList('education'),
      sectionList('experiences'),
      sectionList('projects'),
      sectionSkills(),
      sectionList('languages'),
      sectionList('certifications'),
      sectionLinks(),
      sectionPrivacy(),
    ].join('');

    form.addEventListener('input', onInput);
    form.addEventListener('change', onInput);
    form.addEventListener('click', onClick);
    form.addEventListener('keydown', onKeydown);
  }

  function section(id, icon, title, hint, body) {
    return `
      <section class="pf-section" id="sec-${id}">
        <header>
          <span class="b-icon" aria-hidden="true"><i data-icon="${icon}"></i></span>
          <div><h2>${title}</h2>${hint ? `<p>${hint}</p>` : ''}</div>
        </header>
        ${body}
      </section>`;
  }

  function field({ path, label, type = 'text', value = '', placeholder = '', max, span, options, required }) {
    const id = 'f-' + path.replace(/[^\w]/g, '-');
    const v = value ?? '';
    let input;
    if (type === 'textarea') {
      input = `<textarea id="${id}" class="form-control" data-path="${path}" ${max ? `maxlength="${max}"` : ''} placeholder="${escapeHtml(placeholder)}">${escapeHtml(v)}</textarea>`;
    } else if (type === 'select') {
      input = `<select id="${id}" class="form-control" data-path="${path}">
        <option value="">Selecione…</option>
        ${Object.entries(options).map(([k, l]) => `<option value="${k}" ${v === k ? 'selected' : ''}>${l}</option>`).join('')}
      </select>`;
    } else {
      input = `<input id="${id}" class="form-control" type="${type}" data-path="${path}" value="${escapeHtml(String(v))}"
        ${max ? `maxlength="${max}"` : ''} placeholder="${escapeHtml(placeholder)}" ${required ? 'required' : ''}>`;
    }
    const counter = max && type === 'textarea'
      ? `<div class="pf-hint"><span></span><span data-count-for="${path}">${String(v).length}/${max}</span></div>` : '';
    return `<div class="pf-field ${span === 2 ? 'span-2' : ''}"><label for="${id}">${label}</label>${input}${counter}</div>`;
  }

  function sectionPersonalize() {
    const areas = Object.keys(Art.AREA);
    const covers = areas.map(a => `
      <button type="button" class="cover-option" data-cover="${a}" aria-pressed="${resume.cover_area === a}"
              style="background-image:url('${Art.cover(a, 'opt', { glyph: 'none' })}')" aria-label="Capa ${a}">
        <span>${a}</span>
      </button>`).join('');
    const colors = COLORS.map(c => `
      <button type="button" class="color-option" data-color="${c}" aria-pressed="${resume.accent_color === c}"
              style="background:${c}" aria-label="Cor ${c}"></button>`).join('');
    return section('personalize', 'palette', 'Personalização', 'Escolha a capa do seu perfil e a cor de destaque do currículo.', `
      <div class="pf-field"><label>Capa</label><div class="cover-options">${covers}</div></div>
      <div class="pf-field" style="margin-top:var(--space-4)"><label>Cor de destaque</label><div class="color-options">${colors}</div></div>`);
  }

  function sectionBasics() {
    return section('basics', 'user', 'Dados básicos', 'Como você aparece para empresas e mentores.', `
      <div class="pf-grid cols-2">
        ${field({ path: 'p.name', label: 'Nome completo', value: profile?.name, max: 80, required: true })}
        ${field({ path: 'r.headline', label: 'Título profissional', value: resume.headline, max: 120,
                  placeholder: 'Estudante do 3º ano · interesse em tecnologia' })}
        ${field({ path: 'p.school', label: 'Escola', value: profile?.school, max: 120 })}
        ${field({ path: 'p.city', label: 'Cidade', value: profile?.city, max: 80 })}
        ${field({ path: 'p.phone', label: 'Telefone / WhatsApp', type: 'tel', value: profile?.phone, max: 20, placeholder: '(86) 9 9999-9999' })}
        <div class="pf-field"><label>E-mail</label><input class="form-control" value="${escapeHtml(profile?.email || '')}" disabled></div>
      </div>`);
  }

  function sectionAbout() {
    return section('about', 'file-text', 'Sobre você', 'Um resumo curto: quem você é, do que gosta e o que está aprendendo.', `
      <div class="pf-grid">
        ${field({ path: 'r.about', label: 'Sobre mim', type: 'textarea', value: resume.about, max: 1500,
                  placeholder: 'Tenho 17 anos, curso o 3º ano e gosto de resolver problemas com tecnologia…' })}
        ${field({ path: 'r.objective', label: 'Objetivo profissional', type: 'textarea', value: resume.objective, max: 400,
                  placeholder: 'Busco meu primeiro estágio na área de suporte de TI para aprender na prática.' })}
      </div>`);
  }

  function sectionAvailability() {
    const chips = Object.entries(LOOKING_FOR).map(([k, l]) =>
      `<button type="button" class="chip" data-toggle-looking="${k}" aria-pressed="${resume.looking_for.includes(k)}">${l}</button>`).join('');
    return section('availability', 'clock', 'Disponibilidade', 'O que você procura e quando pode começar.', `
      <div class="pf-field"><label>Tenho interesse em</label><div class="pf-choice">${chips}</div></div>
      <div class="pf-grid cols-2" style="margin-top:var(--space-4)">
        ${field({ path: 'r.shift', label: 'Turno disponível', type: 'select', options: SHIFTS, value: resume.shift || '' })}
        ${field({ path: 'r.available_from', label: 'Posso começar a partir de', type: 'date', value: resume.available_from || '' })}
      </div>`);
  }

  function sectionList(key) {
    const cfg = LISTS[key];
    return section(key, cfg.icon, cfg.title, cfg.hint || '', `
      <div id="list-${key}">${resume[key].map((it, i) => listItem(key, it, i)).join('')}</div>
      <button type="button" class="pf-add" data-add="${key}"><i data-icon="arrow-right" style="transform:rotate(-90deg)"></i> ${cfg.add}</button>`);
  }

  function listItem(key, it, i) {
    const cfg = LISTS[key];
    const fields = cfg.fields.map(f => {
      let html = field({ ...f, path: `l.${key}.${i}.${f.key}`, value: it[f.key] ?? '' });
      if (f.currentKey) {
        html = html.replace('</div>', `
          <label class="pf-check" style="margin-top:6px">
            <input type="checkbox" data-path="l.${key}.${i}.${f.currentKey}" ${it[f.currentKey] ? 'checked' : ''}> ${f.currentLabel}
          </label></div>`);
      }
      return html;
    }).join('');
    return `
      <div class="pf-item" data-item="${key}.${i}">
        <div class="pf-item-head">
          <strong>${escapeHtml(cfg.summary(it) || `Novo item`)}</strong>
          <button type="button" class="pf-icon-btn" data-remove="${key}.${i}" aria-label="Remover"><i data-icon="trash"></i></button>
        </div>
        <div class="pf-grid cols-2">${fields}</div>
      </div>`;
  }

  function sectionSkills() {
    return section('skills', 'zap', 'Habilidades', 'Digite e aperte Enter. Até 20 habilidades.', `
      <div class="pf-tags" id="skillTags">${skillTags()}</div>
      <input class="form-control" id="skillInput" maxlength="40" placeholder="Ex.: Excel, Python, oratória…" style="margin-top:var(--space-3)">
      <div class="pf-suggest" id="skillSuggest">${skillSuggest()}</div>`);
  }
  const skillTags = () => resume.skills.map((s, i) =>
    `<span class="pf-tag">${escapeHtml(s)}<button type="button" data-remove-skill="${i}" aria-label="Remover ${escapeHtml(s)}"><i data-icon="x"></i></button></span>`).join('');
  const skillSuggest = () => suggestions
    .filter(s => !resume.skills.some(k => k.toLowerCase() === s.toLowerCase())).slice(0, 8)
    .map(s => `<button type="button" data-add-skill="${escapeHtml(s)}">+ ${escapeHtml(s)}</button>`).join('');

  function sectionLinks() {
    const l = resume.links || {};
    return section('links', 'link', 'Links', 'Portfólio, LinkedIn, GitHub… (opcional)', `
      <div class="pf-grid cols-2">
        ${field({ path: 'k.linkedin', label: 'LinkedIn', type: 'url', value: l.linkedin, placeholder: 'https://linkedin.com/in/…' })}
        ${field({ path: 'k.github', label: 'GitHub', type: 'url', value: l.github, placeholder: 'https://github.com/…' })}
        ${field({ path: 'k.portfolio', label: 'Portfólio / site', type: 'url', value: l.portfolio, placeholder: 'https://…' })}
        ${field({ path: 'k.instagram', label: 'Instagram profissional', type: 'url', value: l.instagram, placeholder: 'https://instagram.com/…' })}
      </div>`);
  }

  function sectionPrivacy() {
    const options = Object.entries(VISIBILITY).map(([k, v]) => `
      <label class="pf-radio">
        <input type="radio" name="resumeVisibility" value="${k}" data-path="r.visibility" ${resume.visibility === k ? 'checked' : ''}>
        <span class="pf-radio-box">
          <i data-icon="${v.icon}"></i>
          <span><strong>${v.label}</strong><small>${v.desc}</small></span>
        </span>
      </label>`).join('');
    return section('privacy', 'shield', 'Visibilidade', 'Você decide quem vê o seu currículo. Quem você bloquear na comunidade nunca vê.', `
      <div class="pf-radios" role="radiogroup" aria-label="Quem pode ver seu currículo">${options}</div>
      <div class="pf-switch" style="margin-top:var(--space-4)">
        <div><strong>Mostrar e-mail e telefone no currículo</strong>
          <span>Desligado: quem vê seu currículo só vê seus links. Se você for menor de 18 anos, combine isso com seu responsável.</span></div>
        <label class="switch"><input type="checkbox" data-path="r.show_contact" ${resume.show_contact ? 'checked' : ''} aria-label="Mostrar contato no currículo"><i></i></label>
      </div>`);
  }

  /* ── Eventos do editor ──────────────────────────────────── */
  function onInput(e) {
    const el = e.target;
    const path = el.dataset.path;
    if (!path) return;
    const val = el.type === 'checkbox' ? el.checked : el.value;
    const [scope, ...rest] = path.split('.');

    if (scope === 'p') profile = { ...profile, [rest[0]]: val };
    else if (scope === 'r') resume[rest[0]] = (val === '' && ['shift', 'available_from'].includes(rest[0])) ? null : val;
    else if (scope === 'k') resume.links = { ...resume.links, [rest[0]]: val.trim() };
    else if (scope === 'l') {
      const [key, idx, prop] = rest;
      resume[key][+idx] = { ...resume[key][+idx], [prop]: val };
      // título do item acompanha o que é digitado
      const head = document.querySelector(`[data-item="${key}.${idx}"] .pf-item-head strong`);
      if (head) head.textContent = LISTS[key].summary(resume[key][+idx]) || 'Novo item';
    }

    const counter = document.querySelector(`[data-count-for="${CSS.escape(path)}"]`);
    if (counter) counter.textContent = `${String(val).length}/${el.maxLength}`;

    markDirty();
  }

  function onClick(e) {
    const t = e.target.closest('button');
    if (!t) return;

    if (t.dataset.cover) {
      resume.cover_area = resume.cover_area === t.dataset.cover ? null : t.dataset.cover;
      document.querySelectorAll('.cover-option').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.cover === resume.cover_area)));
      markDirty();
    } else if (t.dataset.color) {
      resume.accent_color = t.dataset.color;
      document.querySelectorAll('.color-option').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.color === resume.accent_color)));
      markDirty();
    } else if (t.dataset.toggleLooking) {
      const k = t.dataset.toggleLooking;
      resume.looking_for = resume.looking_for.includes(k) ? resume.looking_for.filter(x => x !== k) : [...resume.looking_for, k];
      t.setAttribute('aria-pressed', String(resume.looking_for.includes(k)));
      markDirty();
    } else if (t.dataset.add) {
      const key = t.dataset.add;
      resume[key] = [...resume[key], {}];
      rerenderList(key);
      const items = document.querySelectorAll(`#list-${key} .pf-item`);
      items[items.length - 1]?.querySelector('input, textarea, select')?.focus();
      markDirty();
    } else if (t.dataset.remove) {
      const [key, idx] = t.dataset.remove.split('.');
      resume[key] = resume[key].filter((_, i) => i !== +idx);
      rerenderList(key);
      markDirty();
    } else if (t.dataset.removeSkill !== undefined) {
      resume.skills = resume.skills.filter((_, i) => i !== +t.dataset.removeSkill);
      rerenderSkills();
      markDirty();
    } else if (t.dataset.addSkill) {
      addSkill(t.dataset.addSkill);
    }
  }

  function onKeydown(e) {
    if (e.target.id === 'skillInput' && (e.key === 'Enter' || e.key === ',')) {
      e.preventDefault();
      addSkill(e.target.value);
      e.target.value = '';
    }
  }

  function addSkill(raw) {
    const s = String(raw || '').trim().replace(/\s+/g, ' ');
    if (!s) return;
    if (resume.skills.length >= 20) { Toast.warning('Limite de 20 habilidades.'); return; }
    if (resume.skills.some(k => k.toLowerCase() === s.toLowerCase())) return;
    resume.skills = [...resume.skills, s];
    rerenderSkills();
    markDirty();
  }

  function rerenderList(key) {
    $(`list-${key}`).innerHTML = resume[key].map((it, i) => listItem(key, it, i)).join('');
  }
  function rerenderSkills() {
    $('skillTags').innerHTML = skillTags();
    $('skillSuggest').innerHTML = skillSuggest();
  }

  /* ── Salvar ─────────────────────────────────────────────── */
  let previewTimer;
  function markDirty() {
    dirty = true;
    $('saveBar').classList.add('show');
    $('saveBarText').textContent = 'Alterações não salvas';
    clearTimeout(previewTimer);
    previewTimer = setTimeout(() => { renderPreview(); renderMeter(); updateIdentity(); }, 120);
  }

  function validate() {
    if (!profile?.name || profile.name.trim().length < 2) return 'Informe seu nome.';
    const urls = [
      ...Object.entries(resume.links || {}).map(([k, v]) => [k, v]),
      ...resume.projects.map(p => ['projeto', p.url]),
      ...resume.certifications.map(c => ['certificado', c.url]),
    ].filter(([, v]) => v);
    const bad = urls.find(([, v]) => !safeUrl(v));
    if (bad) return `O link "${bad[1]}" precisa começar com https://`;
    return null;
  }

  async function save() {
    if (saving || !dirty) return;
    const problem = validate();
    if (problem) { Toast.warning(problem); return; }

    saving = true;
    setButtonLoading($('saveBtn'), true);
    $('saveBarText').textContent = 'Salvando…';
    try {
      const cleanList = key => resume[key]
        .map(it => Object.fromEntries(Object.entries(it).filter(([, v]) => v !== '' && v !== null && v !== undefined)))
        .filter(it => Object.keys(it).some(k => !['current', 'level', 'kind'].includes(k)));

      const payload = {
        headline: resume.headline?.trim() || null,
        about: resume.about?.trim() || null,
        objective: resume.objective?.trim() || null,
        looking_for: resume.looking_for,
        shift: resume.shift || null,
        available_from: resume.available_from || null,
        education: cleanList('education'),
        experiences: cleanList('experiences'),
        projects: cleanList('projects'),
        certifications: cleanList('certifications'),
        languages: cleanList('languages'),
        skills: resume.skills,
        links: Object.fromEntries(Object.entries(resume.links || {}).filter(([, v]) => v)),
        cover_area: resume.cover_area || null,
        accent_color: resume.accent_color,
        visibility: resume.visibility,
        is_public: resume.visibility !== 'private',   // o banco também deriva isso (migration 008)
        show_contact: !!resume.show_contact,
      };

      const [savedProfile, savedResume] = await Promise.all([
        DB.profiles.update(profile.id, {
          name: profile.name.trim(),
          school: profile.school?.trim() || null,
          city: profile.city?.trim() || null,
          phone: profile.phone?.trim() || null,
        }),
        DB.resumes.save(profile.id, payload),
      ]);
      profile = { ...profile, ...savedProfile };
      resume  = { ...EMPTY_RESUME, ...savedResume };
      dirty = false;
      $('saveBarText').textContent = 'Tudo salvo';
      setTimeout(() => { if (!dirty) $('saveBar').classList.remove('show'); }, 1400);
      Toast.success('Perfil salvo.');
      renderPreview(); renderMeter(); updateIdentity();
    } catch (err) {
      $('saveBarText').textContent = 'Não foi possível salvar';
      Toast.error(handleError(err, 'Não foi possível salvar o perfil.'));
    } finally {
      saving = false;
      setButtonLoading($('saveBtn'), false);
    }
  }

  /* ── Foto ───────────────────────────────────────────────── */
  async function onPhoto(file) {
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) { Toast.warning('Use uma imagem JPG, PNG ou WebP.'); return; }
    if (file.size > 2 * 1024 * 1024) { Toast.warning('A foto deve ter até 2 MB.'); return; }
    const box = $('pfPhotoImg');
    const old = box.innerHTML;
    box.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center"><div class="spinner"></div></div>`;
    try {
      const url = await SupaStorage.uploadAvatar(profile.id, file);
      profile = await DB.profiles.update(profile.id, { avatar_url: url });
      box.innerHTML = Art.avatarImg(profile.name, url);
      const nav = $('navAvatar');
      if (nav) nav.innerHTML = Art.avatarImg(profile.name, url);
      renderPreview(); renderMeter();
      Toast.success('Foto atualizada.');
    } catch (err) {
      box.innerHTML = old;
      Toast.error(handleError(err, 'Não foi possível enviar a foto.'));
    }
  }

  /* ── Ações ──────────────────────────────────────────────── */
  function bindOwnerActions() {
    $('saveBtn').addEventListener('click', save);
    $('photoBtn').addEventListener('click', () => $('photoInput').click());
    $('photoInput').addEventListener('change', e => onPhoto(e.target.files?.[0]));
    $('copyLinkBtn').addEventListener('click', async () => {
      const url = `${location.origin}${location.pathname}?id=${profile.id}`;
      try { await navigator.clipboard.writeText(url); Toast.success('Link copiado.'); }
      catch { Toast.info(url); }
      if (resume.visibility === 'private') Toast.warning('Seu currículo está privado: escolha quem pode vê-lo em "Visibilidade" para o link funcionar.');
    });
    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save(); }
    });
    window.addEventListener('beforeunload', e => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });
    document.querySelectorAll('.pf-tabs .chip').forEach(btn => btn.addEventListener('click', () => {
      document.body.dataset.tab = btn.dataset.tab;
      document.querySelectorAll('.pf-tabs .chip').forEach(b => {
        b.classList.toggle('active', b === btn);
        b.setAttribute('aria-selected', String(b === btn));
      });
    }));
  }

  function bindCommonActions() {
    $('printBtn').addEventListener('click', () => window.print());
  }

  /* ── Completude ─────────────────────────────────────────── */
  function completeness() {
    const checks = [
      { ok: !!profile?.avatar_url, pts: 10, label: 'Adicione uma foto', target: 'photoBtn' },
      { ok: !!resume.headline?.trim(), pts: 10, label: 'Escreva um título profissional', target: 'sec-basics' },
      { ok: (resume.about || '').trim().length >= 60, pts: 15, label: 'Conte um pouco sobre você', target: 'sec-about' },
      { ok: !!resume.objective?.trim(), pts: 5, label: 'Defina um objetivo', target: 'sec-about' },
      { ok: resume.looking_for.length > 0, pts: 10, label: 'Diga que tipo de vaga procura', target: 'sec-availability' },
      { ok: resume.education.length > 0, pts: 15, label: 'Adicione sua formação', target: 'sec-education' },
      { ok: resume.experiences.length + resume.projects.length > 0, pts: 15, label: 'Mostre uma experiência ou projeto', target: 'sec-experiences' },
      { ok: resume.skills.length >= 3, pts: 10, label: 'Liste pelo menos 3 habilidades', target: 'sec-skills' },
      { ok: resume.languages.length > 0 || Object.values(resume.links || {}).some(Boolean), pts: 5, label: 'Adicione um idioma ou link', target: 'sec-languages' },
      { ok: resume.visibility !== 'private', pts: 5, label: 'Escolha quem pode ver seu currículo', target: 'sec-privacy' },
    ];
    const score = checks.reduce((s, c) => s + (c.ok ? c.pts : 0), 0);
    return { score, todo: checks.filter(c => !c.ok) };
  }

  function renderMeter() {
    if (!isOwner) return;
    const { score, todo } = completeness();
    const msg = score >= 90 ? 'Currículo pronto para as vagas!' : score >= 60 ? 'Está ficando ótimo.' : 'Vamos completar seu perfil?';
    $('pfMeter').innerHTML = `
      <div class="pf-meter-top"><div><span class="eyebrow">Força do currículo</span><p style="margin:6px 0 0;font-weight:700">${msg}</p></div><b>${score}%</b></div>
      <div class="progress"><div class="progress-bar" style="width:${score}%"></div></div>
      ${todo.length ? `<div class="pf-todo">${todo.slice(0, 4).map(t =>
        `<button type="button" data-goto="${t.target}"><i data-icon="arrow-right"></i>${t.label}<em>+${t.pts}%</em></button>`).join('')}</div>` : ''}`;
    $('pfMeter').querySelectorAll('[data-goto]').forEach(b => b.addEventListener('click', () => {
      const el = $(b.dataset.goto);
      if (!el) return;
      if (b.dataset.goto === 'photoBtn') { el.click(); return; }
      document.body.dataset.tab = 'edit';
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => el.querySelector('input, textarea, select, button')?.focus({ preventScroll: true }), 400);
    }));
  }

  /* ── Pré-visualização do currículo ──────────────────────── */
  function renderPreview() {
    const r = resume, p = profile || {};
    const sheet = $('resumeSheet');
    sheet.style.setProperty('--accent', r.accent_color || '#1A3C6E');

    const period = it => {
      const f = m => m ? new Date(`${m}-02`).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).replace('.', '') : '';
      const a = f(it.start), b = it.current ? 'atual' : f(it.end);
      return [a, b].filter(Boolean).join(' – ');
    };
    const link = (url, text) => safeUrl(url)
      ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(text || url.replace(/^https?:\/\//, ''))}</a>` : '';
    const sec = (title, body) => body ? `<section class="rs-sec"><h3>${title}</h3>${body}</section>` : '';
    const empty = text => isOwner ? `<p class="rs-empty">${text}</p>` : '';

    const meta = [
      p.city ? `<span><i data-icon="map-pin"></i>${escapeHtml(p.city)}${p.state ? `, ${escapeHtml(p.state)}` : ''}</span>` : '',
      p.school ? `<span><i data-icon="graduation-cap"></i>${escapeHtml(p.school)}</span>` : '',
      r.show_contact && p.email ? `<span><i data-icon="mail"></i>${escapeHtml(p.email)}</span>` : '',
      r.show_contact && p.phone ? `<span><i data-icon="phone"></i>${escapeHtml(p.phone)}</span>` : '',
    ].join('');

    const main = [
      sec('Sobre', r.about?.trim() ? `<p>${escapeHtml(r.about.trim())}</p>` : empty('Escreva um resumo sobre você.')),
      sec('Objetivo', r.objective?.trim() ? `<p>${escapeHtml(r.objective.trim())}</p>` : ''),
      sec('Experiência', r.experiences.length ? r.experiences.map(it => `
        <div class="rs-entry">
          <strong>${escapeHtml(it.title || 'Função')}</strong>
          <div class="sub">${[escapeHtml(it.org || ''), EXP_KINDS[it.kind] || '', period(it)].filter(Boolean).join(' · ')}</div>
          ${it.description ? `<p>${escapeHtml(it.description)}</p>` : ''}
        </div>`).join('') : empty('Adicione estágio, voluntariado ou projetos da escola.')),
      sec('Formação', r.education.length ? r.education.map(it => `
        <div class="rs-entry">
          <strong>${escapeHtml(it.course || EDU_LEVELS[it.level] || 'Curso')}</strong>
          <div class="sub">${[escapeHtml(it.institution || ''), period(it)].filter(Boolean).join(' · ')}</div>
        </div>`).join('') : empty('Adicione sua escola atual.')),
      sec('Projetos', r.projects.length ? r.projects.map(it => `
        <div class="rs-entry">
          <strong>${escapeHtml(it.name || 'Projeto')}</strong>
          ${it.description ? `<p>${escapeHtml(it.description)}</p>` : ''}
          ${link(it.url) ? `<div class="sub">${link(it.url)}</div>` : ''}
        </div>`).join('') : ''),
    ].join('');

    const looking = r.looking_for.map(k => LOOKING_FOR[k]).filter(Boolean);
    const avail = [
      looking.length ? `<div class="rs-chips">${looking.map(l => `<span>${l}</span>`).join('')}</div>` : '',
      r.shift || r.available_from ? `<p style="margin-top:6px;font-size:12px">${[
        r.shift ? `Turno: ${SHIFTS[r.shift]}` : '',
        r.available_from ? `A partir de ${new Date(r.available_from + 'T12:00').toLocaleDateString('pt-BR')}` : '',
      ].filter(Boolean).join(' · ')}</p>` : '',
    ].join('');
    const links = Object.entries(r.links || {}).filter(([, v]) => safeUrl(v));
    const LINK_LABEL = { linkedin: 'LinkedIn', github: 'GitHub', portfolio: 'Portfólio', instagram: 'Instagram' };

    const side = [
      sec('Disponível para', avail || empty('Diga que tipo de vaga procura.')),
      sec('Habilidades', r.skills.length ? `<div class="rs-chips">${r.skills.map(s => `<span>${escapeHtml(s)}</span>`).join('')}</div>` : empty('Liste suas habilidades.')),
      sec('Idiomas', r.languages.length ? `<div class="rs-list">${r.languages.map(l =>
        `<div><strong style="font-size:12.5px">${escapeHtml(l.name || '')}</strong>${l.level ? ` · ${LANG_LEVELS[l.level] || ''}` : ''}</div>`).join('')}</div>` : ''),
      sec('Certificados', r.certifications.length ? r.certifications.map(c => `
        <div class="rs-entry"><strong>${escapeHtml(c.name || '')}</strong>
        <div class="sub">${[escapeHtml(c.issuer || ''), escapeHtml(String(c.year || ''))].filter(Boolean).join(' · ')}</div>
        ${link(c.url, 'Ver certificado') ? `<div class="sub">${link(c.url, 'Ver certificado')}</div>` : ''}</div>`).join('') : ''),
      sec('Links', links.length ? `<div class="rs-list">${links.map(([k, v]) =>
        `<div><span style="color:#5b6475;font-size:11.5px">${LINK_LABEL[k] || k}</span><br>${link(v)}</div>`).join('')}</div>` : ''),
    ].join('');

    sheet.innerHTML = `
      <div class="rs-band" style="background-image:url('${Art.cover(r.cover_area || '', p.name || 'perfil', { glyph: 'none' })}')"></div>
      <div class="rs-head">
        <div class="rs-photo">${Art.avatarImg(p.name, p.avatar_url)}</div>
        <div class="rs-name">
          <h2>${escapeHtml(p.name || 'Seu nome')}</h2>
          <p>${escapeHtml(r.headline || (isOwner ? 'Seu título profissional' : ''))}</p>
        </div>
      </div>
      ${meta ? `<div class="rs-meta">${meta}</div>` : ''}
      <div class="rs-body"><div>${main}</div><div>${side}</div></div>
      <div class="rs-foot"><span>Currículo gerado na Vocare</span><span>${r.updated_at ? `Atualizado em ${new Date(r.updated_at).toLocaleDateString('pt-BR')}` : ''}</span></div>`;
  }

  function renderUnavailable() {
    document.body.classList.add('view-mode');
    document.querySelector('.pf-wrap').innerHTML = `
      <div class="empty-state" style="margin-top:calc(var(--nav-height) + var(--space-16))">
        <div class="empty-state-icon"><i data-icon="lock"></i></div>
        <h3>Currículo indisponível</h3>
        <p>Este currículo é privado ou ainda não foi criado.</p>
      </div>`;
  }

  /* ── Utilidades ─────────────────────────────────────────── */
  function safeUrl(v) {
    if (!v) return false;
    try { const u = new URL(v); return u.protocol === 'https:' || u.protocol === 'http:'; }
    catch { return false; }
  }
})();
