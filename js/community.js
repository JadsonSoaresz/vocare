/* ============================================================
   VOCARE — Comunidade
   js/community.js · Feed (community/index.html) e perfil social
   (community/profile.html?id=<uuid>).

   Perfis são privados por padrão: seguir vira pedido até ser
   aceito. Feed só tem conquistas geradas pelo banco (sem texto
   livre). Bloquear desfaz vínculos e impede novos pedidos.
   ============================================================ */

'use strict';

(() => {
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  const ROLE_HOME = {
    student: '/student/dashboard.html',
    mentor:  '/mentor/dashboard.html',
    company: '/company/dashboard.html',
    admin:   '/admin/dashboard.html',
  };
  const ROLE_LABEL = { student: 'Estudante', mentor: 'Mentor', company: 'Empresa', admin: 'Equipe Vocare' };
  const NAV = {
    student: [['/student/dashboard.html', 'home', 'Início'], ['/student/professions.html', 'search', 'Explorar'],
              ['/community/index.html', 'users', 'Comunidade'], ['/student/career-plan.html', 'clipboard', 'Plano'],
              ['/student/profile.html', 'file-text', 'Currículo']],
    mentor:  [['/mentor/dashboard.html', 'home', 'Painel'], ['/community/index.html', 'users', 'Comunidade'], ['/mentor/profile.html', 'user', 'Meu perfil']],
    company: [['/company/dashboard.html', 'home', 'Painel'], ['/community/index.html', 'users', 'Comunidade']],
    admin:   [['/admin/dashboard.html', 'home', 'Painel'], ['/community/index.html', 'users', 'Comunidade']],
  };

  let me = null;            // profile do usuário logado
  let followState = {};     // { [userId]: 'pending' | 'accepted' }
  let mySettings = null;

  const $id = id => document.getElementById(id);
  const profileUrl = id => `/community/profile.html?id=${encodeURIComponent(id)}`;

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    const user = await Auth.requireAuth();
    if (!user) return;
    me = Auth.profile || { id: user.id, role: 'student' };

    initNavAvatar();
    buildNav();
    buildSettingsModal();

    try {
      [followState, mySettings] = await Promise.all([
        DB.social.myFollowState(me.id),
        DB.social.getSettings(me.id),
      ]);
    } catch (err) {
      showSetupError(err);
      return;
    }

    if (document.body.dataset.page === 'feed') initFeed();
    else initProfile();
  }

  /* ── Navegação por papel ───────────────────────────────── */
  function buildNav() {
    const links = NAV[me.role] || NAV.student;
    const norm = p => p.replace(/\.html$/, '').replace(/\/index$/, '').replace(/\/$/, '');
    const here = norm(location.pathname);
    $id('cmNavLinks').innerHTML = links.map(([href, icon, label]) => {
      const active = here === norm(href) || (href.startsWith('/community') && here.startsWith('/community'));
      return `<a href="${href}" class="btn btn-ghost btn-sm" ${active ? 'style="font-weight:600;color:var(--color-primary)"' : ''}><i data-icon="${icon}"></i> ${label}</a>`;
    }).join('');
    $id('cmBrand').href = ROLE_HOME[me.role] || '/';
    $id('myProfileLink').href = profileUrl(me.id);
    document.querySelectorAll('[data-open-settings]').forEach(b => b.addEventListener('click', openSettings));
  }

  /* ── Pessoas ───────────────────────────────────────────── */
  function subtitle(p) {
    if (p.role === 'student') return [p.school, p.city].filter(Boolean).join(' · ') || 'Estudante';
    return [ROLE_LABEL[p.role], p.city].filter(Boolean).join(' · ');
  }

  function rolePill(role) {
    return role && role !== 'student' ? `<span class="role-pill ${role}">${ROLE_LABEL[role] || role}</span>` : '';
  }

  function personRow(p, actions = '') {
    return `
      <div class="person" data-person="${escapeHtml(p.id)}">
        <a class="person-av" href="${profileUrl(p.id)}" tabindex="-1" aria-hidden="true">${Art.avatarImg(p.name, p.avatar_url)}</a>
        <div class="person-info">
          <a href="${profileUrl(p.id)}">${escapeHtml(p.name || 'Usuário')}${rolePill(p.role)}</a>
          <span>${escapeHtml(subtitle(p))}</span>
        </div>
        ${actions ? `<div class="person-actions">${actions}</div>` : ''}
      </div>`;
  }

  function followButton(userId, small = true) {
    if (userId === me.id) return '';
    const st = followState[userId];
    const cls = small ? 'btn-sm' : '';
    if (st === 'accepted') return `<button class="btn btn-outline ${cls}" data-follow="${userId}"><i data-icon="check"></i> Seguindo</button>`;
    if (st === 'pending')  return `<button class="btn btn-outline ${cls}" data-follow="${userId}"><i data-icon="clock"></i> Pedido enviado</button>`;
    return `<button class="btn btn-primary ${cls}" data-follow="${userId}">Seguir</button>`;
  }

  // Clique em qualquer botão de seguir da página
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-follow]');
    if (!btn) return;
    const id = btn.dataset.follow;
    const st = followState[id];
    if (st === 'accepted' && !confirm('Deixar de seguir?')) return;
    setButtonLoading(btn, true);
    try {
      if (st) {
        await DB.social.unfollow(me.id, id);
        delete followState[id];
        Toast.info(st === 'pending' ? 'Pedido cancelado.' : 'Você deixou de seguir.');
      } else {
        const row = await DB.social.follow(me.id, id);
        followState[id] = row.status;
        Toast.success(row.status === 'pending' ? 'Pedido enviado. Aguarde a aprovação.' : 'Agora você segue este perfil.');
      }
      document.querySelectorAll(`[data-follow="${CSS.escape(id)}"]`).forEach(b => {
        b.outerHTML = followButton(id, !b.classList.contains('btn-lg') && document.body.dataset.page === 'feed');
      });
      if (document.body.dataset.page === 'profile') initProfile();
    } catch (err) {
      Toast.error(handleError(err, 'Não foi possível concluir a ação.'));
      setButtonLoading(btn, false);
    }
  });

  /* ── Conquistas ────────────────────────────────────────── */
  function activityView(a) {
    const p = a.payload || {};
    switch (a.kind) {
      case 'joined':
        return { icon: 'compass', text: 'entrou na Vocare.' };
      case 'test_completed':
        return { icon: 'target', text: `concluiu o teste vocacional${p.top_area ? ` — destaque em <b>${escapeHtml(p.top_area)}</b>` : ''}.` };
      case 'plan_created':
        return {
          icon: 'route', text: 'criou um plano de carreira.',
          media: p.profession ? `
            <div class="act-media" style="background-image:url('${Art.cover(p.area || '', p.profession, { glyph: 'none' })}')">
              <div><small>Rumo a</small><strong>${escapeHtml(p.profession)}</strong></div>
            </div>` : '',
        };
      case 'goals_completed': {
        const pct = p.total ? Math.round((p.done / p.total) * 100) : 0;
        return {
          icon: 'flag', text: `bateu <b>${Number(p.done) || 0} de ${Number(p.total) || 0}</b> metas do plano de carreira.`,
          media: p.total ? `<div class="act-progress"><div class="progress"><div class="progress-bar" style="width:${pct}%"></div></div></div>` : '',
        };
      }
      case 'resume_updated':
        return { icon: 'file-text', text: 'atualizou o currículo.' };
      default:
        return { icon: 'award', text: 'teve uma nova conquista.' };
    }
  }

  function activityCard(a) {
    const actor = a.actor || {};
    const v = activityView(a);
    const kudos = a.kudos || [];
    const mine = kudos.some(k => k.user_id === me.id);
    const own = a.actor_id === me.id;
    return `
      <article class="act" data-activity="${escapeHtml(a.id)}">
        <div class="act-top">
          <a class="act-av" href="${profileUrl(a.actor_id)}" aria-hidden="true" tabindex="-1">
            ${Art.avatarImg(actor.name, actor.avatar_url)}
            <span class="act-badge"><i data-icon="${v.icon}"></i></span>
          </a>
          <p class="act-text">
            <a href="${profileUrl(a.actor_id)}">${escapeHtml(own ? 'Você' : (actor.name || 'Alguém'))}</a>${rolePill(actor.role)} ${v.text}
            <span class="act-time">${timeAgo(a.created_at)}</span>
          </p>
        </div>
        ${v.media || ''}
        <div class="act-foot">
          ${own
            ? (kudos.length ? `<span class="text-xs text-muted"><i data-icon="award"></i> ${kudos.length} ${kudos.length === 1 ? 'aplauso' : 'aplausos'}</span>` : '')
            : `<button class="kudos-btn" data-kudos="${escapeHtml(a.id)}" aria-pressed="${mine}">
                 <i data-icon="award"></i> ${mine ? 'Aplaudido' : 'Aplaudir'}${kudos.length ? ` · ${kudos.length}` : ''}
               </button>`}
        </div>
      </article>`;
  }

  let activitiesById = {};
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-kudos]');
    if (!btn) return;
    const a = activitiesById[btn.dataset.kudos];
    if (!a) return;
    const on = btn.getAttribute('aria-pressed') !== 'true';
    btn.disabled = true;
    try {
      await DB.social.kudos(a.id, me.id, on);
      a.kudos = on ? [...(a.kudos || []), { user_id: me.id }] : (a.kudos || []).filter(k => k.user_id !== me.id);
      btn.closest('.act').outerHTML = activityCard(a);
    } catch (err) {
      Toast.error(handleError(err));
      btn.disabled = false;
    }
  });

  function renderActivities(container, list, emptyHtml) {
    list.forEach(a => { activitiesById[a.id] = a; });
    container.innerHTML = list.length ? list.map(activityCard).join('') : emptyHtml;
  }

  /* ── Página: feed ──────────────────────────────────────── */
  async function initFeed() {
    renderMeCard();
    loadRequests();
    loadSuggestions();
    bindSearch();

    const following = Object.entries(followState).filter(([, s]) => s === 'accepted').map(([id]) => id);
    try {
      const list = await DB.social.activities({ actorIds: [me.id, ...following], limit: 40 });
      renderActivities($id('feed'), list, `
        <div class="sp-locked">
          <div class="ico"><i data-icon="users"></i></div>
          <h3>Seu feed está vazio</h3>
          <p>Siga colegas e mentores para acompanhar as conquistas deles aqui.</p>
        </div>`);
    } catch (err) {
      $id('feed').innerHTML = '';
      Toast.error(handleError(err, 'Não foi possível carregar o feed.'));
    }
  }

  async function renderMeCard() {
    let counts = { followers: 0, following: 0 };
    try { counts = await DB.social.counts(me.id); } catch {}
    $id('meCard').innerHTML = `
      ${personRow(me)}
      <div class="sp-stats" style="margin:var(--space-3) 0 var(--space-4)">
        <a href="${profileUrl(me.id)}#followers" style="text-decoration:none"><b>${counts.followers}</b><span>seguidores</span></a>
        <a href="${profileUrl(me.id)}#following" style="text-decoration:none"><b>${counts.following}</b><span>seguindo</span></a>
      </div>
      <p class="text-xs text-muted" style="margin-bottom:var(--space-3)">
        ${mySettings.is_private
          ? '<i data-icon="lock"></i> Perfil privado: só seguidores aprovados veem suas conquistas.'
          : '<i data-icon="eye"></i> Perfil público: qualquer pessoa logada vê suas conquistas.'}
      </p>
      <div class="flex gap-2">
        <a href="${profileUrl(me.id)}" class="btn btn-outline btn-sm flex-1">Ver meu perfil</a>
        <button class="btn btn-ghost btn-sm" data-open-settings aria-label="Privacidade e perfil"><i data-icon="shield"></i></button>
      </div>`;
    $id('meCard').querySelector('[data-open-settings]').addEventListener('click', openSettings);
  }

  async function loadRequests() {
    const card = $id('requestsCard');
    try {
      const list = await DB.social.pendingRequests(me.id);
      if (!list.length) { card.classList.add('hidden'); return; }
      card.classList.remove('hidden');
      card.innerHTML = `<h3>Pedidos para seguir <span class="count">${list.length}</span></h3>` +
        list.map(p => personRow(p, `
          <button class="btn btn-primary btn-sm" data-accept="${p.id}">Aceitar</button>
          <button class="btn btn-ghost btn-sm" data-reject="${p.id}" aria-label="Recusar"><i data-icon="x"></i></button>`)).join('');
      card.onclick = async (e) => {
        const acc = e.target.closest('[data-accept]'), rej = e.target.closest('[data-reject]');
        const btn = acc || rej;
        if (!btn) return;
        setButtonLoading(btn, true);
        try {
          if (acc) { await DB.social.accept(me.id, acc.dataset.accept); Toast.success('Pedido aceito.'); }
          else { await DB.social.removeFollower(me.id, rej.dataset.reject); Toast.info('Pedido recusado.'); }
          loadRequests(); renderMeCard();
        } catch (err) { Toast.error(handleError(err)); setButtonLoading(btn, false); }
      };
    } catch { card.classList.add('hidden'); }
  }

  async function loadSuggestions() {
    const card = $id('suggestCard');
    try {
      const list = await DB.social.suggestions(me.id, me, Object.keys(followState));
      card.innerHTML = `<h3>Pessoas para seguir</h3>` + (list.length
        ? list.map(p => personRow(p, followButton(p.id))).join('')
        : '<p class="text-sm text-muted">Use a busca para encontrar colegas e mentores.</p>');
    } catch { card.classList.add('hidden'); }
  }

  function bindSearch() {
    const input = $id('peopleSearch'), box = $id('searchResults');
    const run = debounce(async () => {
      const q = input.value.trim();
      if (q.length < 2) { box.classList.add('hidden'); return; }
      try {
        const list = await DB.social.search(me.id, q);
        box.innerHTML = list.length
          ? list.map(p => personRow(p, followButton(p.id))).join('')
          : `<p class="text-sm text-muted" style="padding:var(--space-3)">Ninguém encontrado com "${escapeHtml(q)}".</p>`;
        box.classList.remove('hidden');
      } catch (err) { Toast.error(handleError(err)); }
    }, 250);
    input.addEventListener('input', run);
    document.addEventListener('click', e => { if (!e.target.closest('.cm-search')) box.classList.add('hidden'); });
    input.addEventListener('keydown', e => { if (e.key === 'Escape') { box.classList.add('hidden'); input.blur(); } });
  }

  /* ── Página: perfil social ─────────────────────────────── */
  let currentTab = (location.hash || '#activity').slice(1);

  async function initProfile() {
    const param = new URLSearchParams(location.search).get('id');
    const id = param || me.id;
    if (!UUID.test(id)) { renderProfileMissing(); return; }
    const isMe = id === me.id;

    let target, settings, counts, rel = { iFollow: null, followsMe: null, iBlocked: false };
    try {
      [target, settings, counts, rel] = await Promise.all([
        isMe ? Promise.resolve(me) : DB.profiles.get(id),
        isMe ? Promise.resolve(mySettings) : DB.social.getSettings(id),
        DB.social.counts(id),
        isMe ? Promise.resolve(rel) : DB.social.relation(me.id, id),
      ]);
    } catch (err) {
      renderProfileMissing();
      return;
    }
    if (!target) { renderProfileMissing(); return; }
    if (rel.iFollow) followState[id] = rel.iFollow; else delete followState[id];

    const canView = isMe || (!rel.iBlocked && (!settings.is_private || rel.iFollow === 'accepted'));
    document.title = `${target.name || 'Perfil'} — Vocare`;

    $id('spCover').style.backgroundImage = `url('${Art.cover(settings.cover_area || '', target.name || 'perfil', { glyph: 'none' })}')`;
    $id('spPhoto').innerHTML = Art.avatarImg(target.name, target.avatar_url);
    $id('spName').innerHTML = `${escapeHtml(target.name || 'Usuário')}${rolePill(target.role)}`;
    $id('spSub').innerHTML = `${escapeHtml(subtitle(target))}${settings.is_private ? ' · <i data-icon="lock"></i> Perfil privado' : ''}`;
    $id('spBio').textContent = settings.bio || '';
    $id('spStats').innerHTML = `
      <button type="button" data-goto-tab="followers"><b>${counts.followers}</b><span>seguidores</span></button>
      <button type="button" data-goto-tab="following"><b>${counts.following}</b><span>seguindo</span></button>
      <button type="button" data-goto-tab="activity"><b>${counts.activities}</b><span>conquistas</span></button>`;
    $id('spStats').querySelectorAll('[data-goto-tab]').forEach(b => b.onclick = () => switchTab(b.dataset.gotoTab));

    await renderProfileActions(target, isMe, rel);

    document.querySelectorAll('#spTabs .tab-item').forEach(t => t.onclick = () => switchTab(t.dataset.tab));
    switchTab(['activity', 'followers', 'following'].includes(currentTab) ? currentTab : 'activity');

    function switchTab(tab) {
      currentTab = tab;
      try { history.replaceState(null, '', `#${tab}`); } catch { /* file:// ou sandbox */ }
      document.querySelectorAll('#spTabs .tab-item').forEach(t => {
        t.classList.toggle('active', t.dataset.tab === tab);
        t.setAttribute('aria-selected', String(t.dataset.tab === tab));
      });
      const body = $id('spBody');
      if (rel.iBlocked) {
        body.innerHTML = locked('shield', 'Você bloqueou este perfil', 'Desbloqueie para voltar a ver as conquistas e permitir que essa pessoa te siga.');
        return;
      }
      if (!canView) {
        body.innerHTML = locked('lock', 'Este perfil é privado',
          rel.iFollow === 'pending' ? 'Seu pedido foi enviado. Quando for aceito, você verá as conquistas aqui.'
                                    : 'Siga para pedir acesso às conquistas e conexões.');
        return;
      }
      body.innerHTML = '<div class="skeleton" style="height:120px;border-radius:20px"></div>';
      if (tab === 'activity') {
        DB.social.activities({ actorIds: [target.id], limit: 40 })
          .then(list => renderActivities(body, list, locked('award', 'Nenhuma conquista ainda', 'As conquistas aparecem quando o teste, o plano ou as metas avançam.')))
          .catch(err => { body.innerHTML = ''; Toast.error(handleError(err)); });
      } else {
        (tab === 'followers' ? DB.social.followers(target.id) : DB.social.following(target.id))
          .then(list => {
            body.innerHTML = list.length
              ? `<div class="cm-card">${list.map(p => personRow(p, followButton(p.id))).join('')}</div>`
              : locked('users', tab === 'followers' ? 'Nenhum seguidor ainda' : 'Ainda não segue ninguém', '');
          })
          .catch(err => { body.innerHTML = ''; Toast.error(handleError(err)); });
      }
    }
  }

  async function renderProfileActions(target, isMe, rel) {
    const box = $id('spActions');
    if (isMe) {
      box.innerHTML = `
        <button class="btn btn-primary btn-sm" data-open-settings><i data-icon="shield"></i> Editar perfil social</button>
        ${me.role === 'student' ? `<a class="btn btn-outline btn-sm" href="/student/profile.html"><i data-icon="file-text"></i> Meu currículo</a>` : ''}`;
      box.querySelector('[data-open-settings]').addEventListener('click', openSettings);
      return;
    }

    // "Ver currículo" quando o banco permite (empresa/mentor/admin + currículo publicado)
    let resumeBtn = '';
    if (target.role === 'student' && ['company', 'mentor', 'admin'].includes(me.role)) {
      try {
        const r = await DB.resumes.get(target.id);
        if (r) resumeBtn = `<a class="btn btn-outline btn-sm" href="/student/profile.html?id=${encodeURIComponent(target.id)}"><i data-icon="file-text"></i> Ver currículo</a>`;
      } catch {}
    }

    box.innerHTML = `
      ${rel.iBlocked ? `<button class="btn btn-outline btn-sm" data-unblock>Desbloquear</button>` : followButton(target.id, false)}
      ${resumeBtn}
      <div class="dropdown" style="position:relative">
        <button class="btn btn-ghost btn-sm btn-icon" id="spMore" aria-label="Mais opções" aria-haspopup="true">•••</button>
        <div class="dropdown-menu sp-menu hidden" id="spMenu" role="menu">
          ${rel.followsMe ? `<button class="dropdown-item" data-remove-follower role="menuitem"><i data-icon="user"></i> Remover seguidor</button>` : ''}
          ${rel.iBlocked ? '' : `<button class="dropdown-item danger" data-block role="menuitem"><i data-icon="shield"></i> Bloquear</button>`}
        </div>
      </div>`;

    const menu = $id('spMenu');
    $id('spMore').onclick = (e) => { e.stopPropagation(); menu.classList.toggle('hidden'); };
    document.addEventListener('click', () => menu.classList.add('hidden'));
    if (!menu.querySelector('button')) $id('spMore').parentElement.remove();

    box.querySelector('[data-unblock]')?.addEventListener('click', async () => {
      try { await DB.social.unblock(me.id, target.id); Toast.success('Perfil desbloqueado.'); initProfile(); }
      catch (err) { Toast.error(handleError(err)); }
    });
    box.querySelector('[data-block]')?.addEventListener('click', async () => {
      if (!confirm(`Bloquear ${target.name}? Vocês deixam de se seguir e essa pessoa não poderá te seguir de novo.`)) return;
      try { await DB.social.block(me.id, target.id); delete followState[target.id]; Toast.success('Perfil bloqueado.'); initProfile(); }
      catch (err) { Toast.error(handleError(err)); }
    });
    box.querySelector('[data-remove-follower]')?.addEventListener('click', async () => {
      try { await DB.social.removeFollower(me.id, target.id); Toast.info('Seguidor removido.'); initProfile(); }
      catch (err) { Toast.error(handleError(err)); }
    });
  }

  function locked(icon, title, text) {
    return `<div class="sp-locked"><div class="ico"><i data-icon="${icon}"></i></div><h3>${title}</h3>${text ? `<p>${text}</p>` : ''}</div>`;
  }

  function renderProfileMissing() {
    $id('spRoot').innerHTML = `<div style="padding-top:calc(var(--nav-height) + var(--space-16))">
      ${locked('user', 'Perfil não encontrado', 'O link pode estar errado ou o perfil não está disponível para você.')}</div>`;
  }

  /* ── Modal: privacidade e perfil social ────────────────── */
  function buildSettingsModal() {
    document.body.insertAdjacentHTML('beforeend', `
      <div id="socialSettingsModal" class="modal-overlay hidden" role="dialog" aria-modal="true" aria-labelledby="ssTitle"
           onclick="closeModalOnOverlay(event, 'socialSettingsModal')">
        <div class="modal" style="max-width:520px">
          <div class="modal-header">
            <h3 id="ssTitle">Privacidade e perfil social</h3>
            <button class="modal-close" onclick="closeModal('socialSettingsModal')" aria-label="Fechar"><i data-icon="x"></i></button>
          </div>
          <div class="modal-body">
            <div style="display:flex;justify-content:space-between;gap:var(--space-4);align-items:flex-start;margin-bottom:var(--space-5)">
              <div>
                <strong style="font-size:var(--text-sm)">Perfil privado</strong>
                <p class="text-xs text-muted" style="margin:2px 0 0">Ligado: para te seguir, a pessoa precisa da sua aprovação e só seguidores aprovados veem suas conquistas. Recomendado para menores de 18 anos.</p>
              </div>
              <input type="checkbox" id="ssPrivate" style="width:22px;height:22px;flex-shrink:0;accent-color:var(--color-text)">
            </div>
            <label for="ssBio" style="font-size:var(--text-sm);font-weight:600;display:block;margin-bottom:6px">Bio</label>
            <textarea id="ssBio" class="form-control" maxlength="160" rows="3" placeholder="Ex.: 3º ano no CETI · curto tecnologia e design" style="width:100%"></textarea>
            <div class="text-xs text-muted" style="text-align:right;margin-top:4px"><span id="ssBioCount">0</span>/160</div>
            <label style="font-size:var(--text-sm);font-weight:600;display:block;margin:var(--space-4) 0 6px">Capa</label>
            <div class="cm-modal-cover-options" id="ssCovers"></div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-ghost" onclick="closeModal('socialSettingsModal')">Cancelar</button>
            <button class="btn btn-primary" id="ssSave">Salvar</button>
          </div>
        </div>
      </div>`);

    $id('ssBio').addEventListener('input', e => { $id('ssBioCount').textContent = e.target.value.length; });
    $id('ssCovers').addEventListener('click', e => {
      const b = e.target.closest('[data-cover-opt]');
      if (!b) return;
      const pressed = b.getAttribute('aria-pressed') === 'true';
      $id('ssCovers').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', 'false'));
      b.setAttribute('aria-pressed', String(!pressed));
    });
    $id('ssSave').addEventListener('click', async () => {
      const btn = $id('ssSave');
      const chosen = $id('ssCovers').querySelector('[aria-pressed="true"]');
      const goingPublic = mySettings.is_private && !$id('ssPrivate').checked;
      if (goingPublic && !confirm('Tornar o perfil público? Pedidos pendentes serão aceitos automaticamente.')) return;
      setButtonLoading(btn, true);
      try {
        mySettings = await DB.social.saveSettings(me.id, {
          is_private: $id('ssPrivate').checked,
          bio: $id('ssBio').value.trim() || null,
          cover_area: chosen ? chosen.dataset.coverOpt : null,
        });
        closeModal('socialSettingsModal');
        Toast.success('Perfil social atualizado.');
        if (document.body.dataset.page === 'feed') { renderMeCard(); loadRequests(); }
        else initProfile();
      } catch (err) {
        Toast.error(handleError(err));
      } finally {
        setButtonLoading(btn, false);
      }
    });
  }

  function openSettings() {
    if (!mySettings) return;
    $id('ssPrivate').checked = !!mySettings.is_private;
    $id('ssBio').value = mySettings.bio || '';
    $id('ssBioCount').textContent = ($id('ssBio').value || '').length;
    $id('ssCovers').innerHTML = Object.keys(Art.AREA).map(a => `
      <button type="button" data-cover-opt="${a}" aria-pressed="${mySettings.cover_area === a}" aria-label="Capa ${a}"
              style="background-image:url('${Art.cover(a, 'opt', { glyph: 'none' })}')"></button>`).join('');
    document.getElementById('navDropdown')?.classList.add('hidden');
    openModal('socialSettingsModal');
  }

  function showSetupError(err) {
    console.error('[Comunidade]', err);
    const main = document.querySelector('.cm-wrap');
    main.innerHTML = `<div style="padding-top:calc(var(--nav-height) + var(--space-16))">
      ${locked('wrench', 'Comunidade indisponível', 'Não foi possível carregar a comunidade. Se você é o administrador, execute a migration 007_social.sql no Supabase.')}</div>`;
  }
})();
