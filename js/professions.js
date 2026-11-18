/* ============================================================
   VOCARE — Explorar Profissões (Estudante)
   js/professions.js · Busca, filtros, cards, modal de detalhe
   ============================================================ */

'use strict';

(async () => {

  /* ── 1. Autenticação ── */
  const user = await Auth.requireStudent();
  if (!user) return;

  const profile = Auth.profile;
  _initTopNav(profile);

  /* ── 2. Estado interno ── */
  let _allProfessions   = [];  // lista completa fundida com compatibilidade
  let _filtered         = [];  // lista após filtros/busca
  let _activeArea       = 'all';
  let _sortByCompat     = false;
  let _searchQuery      = '';

  /* ── 3. Carregar dados em paralelo ── */
  const [professionsRes, recommendationsRes] = await Promise.allSettled([
    DB.professions.list(),
    DB.recommendations.getForStudent(user.id, 50),
  ]);

  const professions   = professionsRes.status === 'fulfilled'   ? professionsRes.value   : [];
  const recommendations = recommendationsRes.status === 'fulfilled' ? recommendationsRes.value : [];

  // Mapa de compatibilidade por profession_id
  const compatMap = {};
  for (const rec of recommendations) {
    if (rec.profession_id) {
      compatMap[rec.profession_id] = rec.compatibility_score || 0;
    }
  }

  // Fundir compatibilidade nas profissões
  _allProfessions = professions.map(p => ({
    ...p,
    compatibility_score: compatMap[p.id] ?? null,
  }));

  // Construir chips de área
  _buildAreaChips();

  // Renderizar com estado inicial
  _applyFilters();

  // Verificar se veio com ?id= na URL
  const openId = getQueryParam('id');
  if (openId) {
    const match = _allProfessions.find(p => String(p.id) === String(openId));
    if (match) {
      await _openModal(match);
    }
  }

  /* ── 4. Event listeners ── */

  // Busca com debounce
  const searchInput = document.getElementById('searchInput');
  const clearBtn    = document.getElementById('clearSearch');

  if (searchInput) {
    const debouncedSearch = debounce((val) => {
      _searchQuery = val.trim().toLowerCase();
      _applyFilters();
    }, 300);

    searchInput.addEventListener('input', (e) => {
      const val = e.target.value;
      if (clearBtn) clearBtn.style.display = val ? '' : 'none';
      debouncedSearch(val);
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      clearBtn.style.display = 'none';
      _searchQuery = '';
      _applyFilters();
    });
  }

  // Fechar modal ao clicar no overlay
  const modalOverlay = document.getElementById('professionModal');
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) _closeModal();
    });
  }

  // Fechar modal com Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') _closeModal();
  });

  /* ──────────────────────────────────────────────
     Funções internas
  ────────────────────────────────────────────── */

  /* ── Construir chips de área ── */
  function _buildAreaChips() {
    const areas = [...new Set(_allProfessions.map(p => p.area).filter(Boolean))].sort();
    const chipsContainer = document.getElementById('filterChips');
    if (!chipsContainer) return;

    // Limpar apenas os chips dinâmicos (manter "Todas" e "Mais compatíveis")
    const dynamicChips = chipsContainer.querySelectorAll('[data-area]');
    dynamicChips.forEach(c => c.remove());

    const frag = document.createDocumentFragment();
    for (const area of areas) {
      const btn = document.createElement('button');
      btn.className = 'chip';
      btn.dataset.area = area;
      btn.innerHTML = `${areaIcon(area)} ${escapeHtml(area)}`;
      btn.setAttribute('aria-pressed', 'false');
      btn.addEventListener('click', () => _setAreaFilter(area));
      frag.appendChild(btn);
    }
    chipsContainer.appendChild(frag);

    // Listeners para chips fixos
    const allChip    = chipsContainer.querySelector('[data-filter="all"]');
    const compatChip = chipsContainer.querySelector('[data-filter="sort-compat"]');

    if (allChip) {
      allChip.addEventListener('click', () => {
        _sortByCompat = false;
        _setAreaFilter('all');
      });
    }
    if (compatChip) {
      compatChip.addEventListener('click', () => {
        _sortByCompat = !_sortByCompat;
        compatChip.classList.toggle('active', _sortByCompat);
        _applyFilters();
      });
    }
  }

  function _setAreaFilter(area) {
    _activeArea = area;
    // Atualizar chip ativo
    document.querySelectorAll('#filterChips .chip[data-filter="all"], #filterChips .chip[data-area]').forEach(c => {
      const isAll  = c.dataset.filter === 'all';
      const isArea = c.dataset.area === area;
      c.classList.toggle('active', (area === 'all' && isAll) || isArea);
      c.setAttribute('aria-pressed', String((area === 'all' && isAll) || isArea));
    });
    _applyFilters();
  }

  /* ── Aplicar filtros e renderizar ── */
  function _applyFilters() {
    let list = [..._allProfessions];

    // Filtro de área
    if (_activeArea !== 'all') {
      list = list.filter(p => p.area === _activeArea);
    }

    // Busca
    if (_searchQuery) {
      list = list.filter(p =>
        (p.name  || '').toLowerCase().includes(_searchQuery) ||
        (p.area  || '').toLowerCase().includes(_searchQuery) ||
        (p.description || '').toLowerCase().includes(_searchQuery)
      );
    }

    // Ordenação
    if (_sortByCompat) {
      list.sort((a, b) => (b.compatibility_score ?? -1) - (a.compatibility_score ?? -1));
    } else {
      list.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'pt-BR'));
    }

    _filtered = list;
    _renderGrid();
    _updateResultsBar();
  }

  /* ── Atualizar contagem de resultados ── */
  function _updateResultsBar() {
    const bar = document.getElementById('resultsBar');
    if (!bar) return;
    const n = _filtered.length;
    bar.textContent = n === 0
      ? 'Nenhuma profissão encontrada'
      : `${n} ${n !== 1 ? 'profissões encontradas' : 'profissão encontrada'}`;
  }

  /* ── Renderizar grid ── */
  function _renderGrid() {
    const grid = document.getElementById('professionsGrid');
    if (!grid) return;

    if (_filtered.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-state-icon" aria-hidden="true"><i data-icon="search"></i></div>
          <h3>Nenhuma profissão encontrada</h3>
          <p>Tente outro termo de busca ou selecione uma área diferente.</p>
          <button class="btn btn-outline btn-sm mt-3" onclick="_resetFilters()">Limpar filtros</button>
        </div>`;
      return;
    }

    grid.innerHTML = _filtered.map(p => _professionCardHTML(p)).join('');
  }

  /* ── HTML de card de profissão ── */
  function _professionCardHTML(p) {
    const score   = p.compatibility_score;
    const hasScore = score !== null && score !== undefined;
    const sal      = p.salary_range && typeof p.salary_range === 'object' ? p.salary_range : null;
    const salTxt   = sal ? `R$ ${_short(sal.min)} – ${_short(sal.max)} / mês` : '';
    const OUTLOOK  = {
      growing:   '<i data-icon="trending-up"></i> Em alta',
      stable:    '<i data-icon="arrow-right"></i> Estável',
      declining: '<i data-icon="trending-down"></i> Em queda',
    };

    return `
      <div class="profession-grid-card" role="listitem" tabindex="0"
           data-id="${escapeHtml(String(p.id || ''))}"
           aria-label="${escapeHtml(p.name || 'Profissão')}${hasScore ? ', ' + score + '% compatível' : ''}"
           onclick="window._openProfessionCard('${escapeHtml(String(p.id || ''))}')"
           onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();window._openProfessionCard('${escapeHtml(String(p.id || ''))}')}">
        <div style="overflow:hidden">
          <div class="profession-grid-thumb" style="${Art.coverStyle(p)}" aria-hidden="true">
            ${OUTLOOK[p.market_outlook] ? `<span class="thumb-outlook">${OUTLOOK[p.market_outlook]}</span>` : ''}
          </div>
        </div>
        <div class="profession-grid-body">
          <div class="profession-grid-area-badge">
            <span class="badge badge-secondary">${escapeHtml(p.area || '')}</span>
          </div>
          <div class="profession-grid-name">${escapeHtml(p.name || 'Profissão')}</div>
          ${salTxt ? `<div class="profession-grid-salary">${salTxt}</div>` : ''}
          ${hasScore ? compatBar(score) : ''}
          ${hasScore
            ? `<div style="margin-top:var(--space-1);font-size:var(--text-xs);font-weight:var(--fw-semi);color:${_compatColor(score)}">${score}% compatível</div>`
            : ''}
        </div>
        <div class="profession-grid-footer">
          <button class="btn btn-outline-secondary btn-block"
                  onclick="event.stopPropagation();window._openProfessionCard('${escapeHtml(String(p.id || ''))}')">
            Ver detalhes <i data-icon="arrow-right"></i>
          </button>
        </div>
      </div>`;
  }

  /* ── Abrir modal de profissão ── */
  window._openProfessionCard = async (id) => {
    const cached = _allProfessions.find(p => String(p.id) === String(id));
    if (cached) await _openModal(cached);
  };

  async function _openModal(profession) {
    const overlay = document.getElementById('professionModal');
    const inner   = document.getElementById('professionModalInner');
    if (!overlay || !inner) return;

    // Mostrar modal com loader
    inner.innerHTML = `
      <div style="min-height:300px;display:flex;align-items:center;justify-content:center">
        <div class="spinner spinner-lg" aria-label="Carregando"></div>
      </div>`;
    overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Carregar dados completos e mentores da área em paralelo
    const [fullProfRes, mentorsRes] = await Promise.allSettled([
      DB.professions.get(profession.id),
      DB.mentors.list({ area: profession.area }),
    ]);

    const p       = fullProfRes.status === 'fulfilled' ? fullProfRes.value : profession;
    const mentors = mentorsRes.status === 'fulfilled'  ? mentorsRes.value  : [];

    // Compatibilidade (pode já estar no objeto fundido)
    const score = profession.compatibility_score ?? p.compatibility_score ?? null;

    inner.innerHTML = _buildModalHTML(p, score, mentors);

    // Foco no botão fechar
    setTimeout(() => {
      const closeBtn = inner.querySelector('.profession-modal-close');
      if (closeBtn) closeBtn.focus();
    }, 60);
  }

  /* ── Fechar modal ── */
  window._closeModal = function() {
    const overlay = document.getElementById('professionModal');
    if (!overlay) return;
    overlay.classList.add('hidden');
    document.body.style.overflow = '';
  };
  // Compatibilidade com closeModal() global
  function _closeModal() { window._closeModal(); }

  /* ── Construir HTML do modal ── */
  function _buildModalHTML(p, score, mentors) {
    const scoreHtml = score !== null && score !== undefined
      ? `<div style="margin-top:var(--space-3)">${compatBadge(score)}</div>`
      : '';

    // Seção de vídeo
    const videoHtml = p.vlog_url
      ? `<div style="margin-bottom:var(--space-5)">
          <h4 style="font-size:var(--text-base);font-weight:var(--fw-semi);margin-bottom:var(--space-3);color:var(--color-text)">
            Vídeos sobre esta carreira
          </h4>
          <div style="${Art.coverStyle(p, { glyph: 'none' })};border-radius:var(--radius-xl);padding:var(--space-8) var(--space-5) var(--space-5);text-align:center;position:relative;overflow:hidden">
            <div style="position:absolute;inset:0;background:linear-gradient(to top,rgba(12,20,36,0.7),rgba(12,20,36,0.15))"></div>
            <div style="position:relative;z-index:1">
              <p style="font-size:var(--text-sm);color:rgba(255,255,255,0.9);margin-bottom:var(--space-4);font-weight:500">
                ${escapeHtml(p.name)} no YouTube
              </p>
              <a href="${escapeHtml(p.vlog_url)}" target="_blank" rel="noopener noreferrer"
                 onclick="event.stopPropagation()"
                 style="display:inline-flex;align-items:center;gap:8px;background:#fff;color:var(--color-primary);font-weight:700;font-size:var(--text-sm);padding:10px 20px;border-radius:999px;text-decoration:none;box-shadow:0 4px 12px rgba(0,0,0,0.2);transition:transform 0.15s ease"
                 onmouseover="this.style.transform='scale(1.04)'"
                 onmouseout="this.style.transform='scale(1)'">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#FF0000" aria-hidden="true">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-2.7A17.11 17.11 0 0012 4a17 17 0 00-3.82.69 4.83 4.83 0 01-3.77 2.7A17.37 17.37 0 004 12a17.37 17.37 0 00.41 5.61 4.83 4.83 0 003.77 2.7A17 17 0 0012 21a17.11 17.11 0 003.82-.69 4.83 4.83 0 003.77-2.7A17.37 17.37 0 0020 12a17.37 17.37 0 00-.41-5.31z"/>
                  <polygon fill="#fff" points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/>
                </svg>
                Ver vídeos no YouTube
              </a>
            </div>
          </div>
        </div>`
      : '';

    // Grade de informações
    const EDUCATION_LABELS = {
      high_school:  'Ensino Médio',
      technical:    'Técnico',
      bachelors:    'Graduação',
      masters:      'Pós-graduação',
      phd:          'Doutorado',
    };
    const OUTLOOK_LABELS = {
      growing:  '<i data-icon="trending-up"></i> Crescente',
      stable:   '<i data-icon="arrow-right"></i> Estável',
      declining:'<i data-icon="trending-down"></i> Em queda',
    };

    const education = EDUCATION_LABELS[p.education_required] || p.education_required || '—';
    const salary    = p.salary_range
      ? (typeof p.salary_range === 'object'
          ? `R$ ${_fmt(p.salary_range.min)} – R$ ${_fmt(p.salary_range.max)}`
          : escapeHtml(String(p.salary_range)))
      : '—';
    const outlook   = OUTLOOK_LABELS[p.market_outlook] || p.market_outlook || '—';

    const infoGrid = `
      <div class="profession-info-grid">
        <div class="profession-info-item">
          <div class="profession-info-label">Formação</div>
          <div class="profession-info-value">${escapeHtml(education)}</div>
        </div>
        <div class="profession-info-item">
          <div class="profession-info-label">Salário médio</div>
          <div class="profession-info-value">${salary}</div>
        </div>
        <div class="profession-info-item" style="grid-column:1/-1">
          <div class="profession-info-label">Mercado de trabalho</div>
          <div class="profession-info-value">${escapeHtml(outlook)}</div>
        </div>
      </div>`;

    // Lista de mentores
    const mentorsSection = mentors.length > 0
      ? `<div style="margin-bottom:var(--space-4)">
          <h4 style="font-size:var(--text-base);font-weight:var(--fw-semi);margin-bottom:var(--space-3)">
            Mentores desta área
          </h4>
          <div>
            ${mentors.slice(0, 4).map(m => {
              const mp = m.profile || {};
              const name = mp.name || 'Mentor';
              const avatarHtml  = Art.avatarImg(name, mp.avatar_url);
              const avatarStyle = '';
              return `
                <div class="modal-mentor-item"
                     role="button" tabindex="0"
                     onclick="navigate('mentors.html?id=${escapeHtml(String(m.id || ''))}')"
                     onkeydown="if(event.key==='Enter')navigate('mentors.html?id=${escapeHtml(String(m.id || ''))}')"
                     aria-label="Ver perfil de ${escapeHtml(name)}">
                  <div class="modal-mentor-avatar" ${avatarStyle}>${avatarHtml}</div>
                  <div style="flex:1;min-width:0">
                    <p style="font-weight:var(--fw-semi);font-size:var(--text-sm);color:var(--color-text);margin-bottom:2px">${escapeHtml(name)}</p>
                    <p style="font-size:var(--text-xs);color:var(--color-muted);margin:0">${escapeHtml(m.profession || m.area || '')}</p>
                  </div>
                  <div class="star-rating" aria-label="${m.reputation_score || 0} estrelas">
                    ${renderStars(m.reputation_score || 0, 10)}
                  </div>
                </div>`;
            }).join('')}
          </div>
        </div>`
      : '';

    // Usa skills_required se existir, senão usa tags do banco
    const skillsList = (Array.isArray(p.skills_required) && p.skills_required.length > 0)
      ? p.skills_required
      : (Array.isArray(p.tags) ? p.tags : []);

    const skills = skillsList.length > 0
      ? `<div style="margin-bottom:var(--space-4)">
          <h4 style="font-size:var(--text-base);font-weight:var(--fw-semi);margin-bottom:var(--space-2)">
            Habilidades necessárias
          </h4>
          <div class="flex flex-wrap gap-2">
            ${skillsList.map(s => `<span class="skill-chip pending">${escapeHtml(s)}</span>`).join('')}
          </div>
        </div>`
      : '';

    return `
      <!-- Modal header -->
      <div class="profession-modal-header" style="${Art.coverStyle(p, { glyph: 'top' })}">
        <button class="profession-modal-close" onclick="window._closeModal()" aria-label="Fechar"><i data-icon="x"></i></button>
        <div>
          <span class="area-tag" style="font-size:var(--text-xs);color:#fff;font-weight:700;letter-spacing:0.04em">
            ${escapeHtml(p.area || '')}
          </span>
          <h2 id="modalProfName" style="color:#fff;font-size:clamp(1.5rem,4vw,2rem);line-height:1.1;margin-top:var(--space-2)">${escapeHtml(p.name || 'Profissão')}</h2>
        </div>
        ${scoreHtml}
      </div>

      <!-- Modal body -->
      <div class="modal-body" style="padding-bottom:var(--space-2)">

        ${p.description
          ? `<p style="color:var(--color-text-soft);font-size:var(--text-sm);line-height:1.65;margin-bottom:var(--space-4)">${escapeHtml(p.description)}</p>`
          : ''}

        ${infoGrid}

        ${videoHtml}

        ${skills}

        ${mentorsSection}

      </div>

      <!-- Modal footer -->
      <div class="modal-footer" style="padding:var(--space-4) var(--space-5)">
        <button class="btn btn-ghost" onclick="window._closeModal()">Fechar</button>
        <button class="btn btn-primary"
                onclick="navigate('career-plan.html?profession_id=${escapeHtml(String(p.id || ''))}')">
          <i data-icon="clipboard"></i> Criar plano de carreira
        </button>
      </div>`;
  }

  /* ── Reset filtros (usado inline) ── */
  window._resetFilters = function() {
    _searchQuery  = '';
    _activeArea   = 'all';
    _sortByCompat = false;
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';
    const clearBtn = document.getElementById('clearSearch');
    if (clearBtn) clearBtn.style.display = 'none';
    // Resetar chips
    document.querySelectorAll('#filterChips .chip').forEach(c => {
      c.classList.toggle('active', c.dataset.filter === 'all');
      c.setAttribute('aria-pressed', String(c.dataset.filter === 'all'));
    });
    _applyFilters();
  };

  /* ── Top nav ── */
  function _initTopNav(p) {
    const avatarEl  = document.getElementById('navAvatar');
    const dropdown  = document.getElementById('navDropdown');
    const nameEl    = document.getElementById('dropdownName');
    const logoutBtn = document.getElementById('logoutBtn');

    if (p && nameEl) nameEl.textContent = p.name || '';

    if (avatarEl && p) avatarEl.innerHTML = Art.avatarImg(p.name, p.avatar_url);

    if (avatarEl && dropdown) {
      avatarEl.addEventListener('click', () => {
        const open = !dropdown.classList.contains('hidden');
        dropdown.classList.toggle('hidden', open);
        avatarEl.setAttribute('aria-expanded', String(!open));
      });
      avatarEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); avatarEl.click(); }
      });
      document.addEventListener('click', (e) => {
        if (!avatarEl.contains(e.target) && !dropdown.contains(e.target)) {
          dropdown.classList.add('hidden');
          avatarEl.setAttribute('aria-expanded', 'false');
        }
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        setButtonLoading(logoutBtn, true);
        try {
          await Auth.logout();
          navigate(CONFIG.ROUTES.LOGIN);
        } catch (err) {
          Toast.error(handleError(err));
          setButtonLoading(logoutBtn, false);
        }
      });
    }
  }

  /* ── Helpers de formatação ── */

  function _compatColor(score) {
    if (score >= 70) return 'var(--color-success)';
    if (score >= 45) return '#92400E';
    return 'var(--color-danger)';
  }

  function _fmt(n) {
    if (!n && n !== 0) return '—';
    return Number(n).toLocaleString('pt-BR');
  }

  // 4500 → "4,5 mil"
  function _short(n) {
    if (!n && n !== 0) return '—';
    const k = Number(n) / 1000;
    return `${k.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil`;
  }

})();
