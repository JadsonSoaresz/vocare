/* ============================================================
   VOCARE — Dashboard (Estudante)
   js/dashboard.js · Carrega dados em paralelo e popula o layout
   ============================================================ */

'use strict';

(async () => {

  /* ── 1. Autenticação e verificação de onboarding ── */
  const user = await Auth.requireStudent();
  if (!user) return; // requireStudent() redireciona se não autenticado

  const profile = Auth.profile;

  // Se não fez onboarding ainda → redirecionar
  try {
    const status = await Auth.checkOnboardingStatus(user.id);
    if (!status.completedOnboarding) {
      navigate(CONFIG.ROUTES.ONBOARDING);
      return;
    }
  } catch (err) {
    console.warn('[Dashboard] Erro ao verificar onboarding:', err.message);
  }

  /* ── 2. Popular header com dados do usuário ── */
  _populateHeader(profile);
  _initTopNav(profile);

  /* ── 3. Carregar dados em paralelo ── */
  const [recommendations, mentors, careerPlan, jobs, vocProfile, allProfessions] = await Promise.allSettled([
    DB.recommendations.getForStudent(user.id, CONFIG.BUSINESS.TOP_RECOMMENDATIONS),
    DB.mentors.list({ available: true }),
    DB.careerPlans.get(user.id),
    DB.jobs.listForStudent(profile),
    DB.vocationalProfiles.get(user.id),
    DB.professions.list(),
  ]);

  /* ── 4. Renderizar cada seção ── */
  const recs     = recommendations.status === 'fulfilled' ? recommendations.value : [];
  const vp       = vocProfile?.status === 'fulfilled' ? vocProfile.value : null;
  const allProfs = allProfessions?.status === 'fulfilled' ? allProfessions.value : [];

  // Show "Refazer teste" link when test is done
  if (vp?.completed_test) {
    const retakeLink = document.getElementById('retakeTestLink');
    if (retakeLink) retakeLink.style.display = 'inline';
  }

  // Always recalculate scores from current profile — fixes stale/wrong scores
  let recsToRender;
  if (vp?.completed_test && allProfs.length > 0) {
    const freshScored = _computeFreshScores(allProfs, vp);
    // Enxuto: só as profissões com nota mínima de confiança, no máximo TOP_RECOMMENDATIONS
    const qualified = freshScored.filter(p => p.score >= CONFIG.BUSINESS.MIN_COMPATIBILITY_SCORE);
    const topScored = (qualified.length > 0 ? qualified : freshScored).slice(0, CONFIG.BUSINESS.TOP_RECOMMENDATIONS);
    recsToRender = topScored.map(p => ({
      compatibility_score: p.score,
      profession: p,
    }));
    // Persist updated scores in background (non-blocking)
    if (topScored.length > 0) {
      DB.recommendations.save(
        user.id,
        topScored.map(p => ({ professionId: p.id, score: p.score }))
      ).catch(() => {});
    }
  } else if (recs.length === 0 && vp?.completed_test) {
    recsToRender = _buildSyntheticRecs(vp);
  } else {
    recsToRender = recs;
  }

  _renderRecommendations(recsToRender, vp);
  _renderHeroMatch(recsToRender);
  _renderVlogs(recsToRender);

  _renderMentors(
    mentors.status === 'fulfilled' ? mentors.value : []
  );

  _renderCareerPlan(
    careerPlan.status === 'fulfilled' ? careerPlan.value : null
  );

  _renderJobs(
    jobs.status === 'fulfilled' ? jobs.value : []
  );

  /* ── 5. Notificações ── */
  try {
    const unread = await DB.notifications.countUnread(user.id);
    if (unread > 0) {
      document.getElementById('notifBadge')?.classList.remove('hidden');
    }
  } catch {}

  /* ──────────────────────────────────────────────
     Funções internas
  ────────────────────────────────────────────── */

  function _populateHeader(p) {
    if (!p) return;
    const firstName = (p.name || '').split(' ')[0] || 'Estudante';
    const greeting  = document.getElementById('greetingText');
    const subtitle  = document.getElementById('greetingSubtitle');
    const avatarEl  = document.getElementById('headerAvatar');

    const hour   = new Date().getHours();
    const saudacao = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
    if (greeting) greeting.innerHTML = `${saudacao}, <em>${escapeHtml(firstName)}</em>.`;
    if (subtitle) subtitle.textContent = p.school
      ? `${p.school} · vamos continuar de onde você parou.`
      : 'Vamos continuar de onde você parou.';

    const dateEl = document.getElementById('greetingDate');
    if (dateEl) {
      dateEl.textContent = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
    }

    if (avatarEl) avatarEl.innerHTML = Art.avatarImg(p.name, p.avatar_url);
  }

  /* ── Arte do topo: área com maior compatibilidade ── */
  function _renderHeroMatch(recs) {
    const art   = document.getElementById('dashHeroArt');
    const match = document.getElementById('dashHeroMatch');
    const top   = recs && recs[0];
    if (!art || !match || !top?.profession) return;
    const p = top.profession;
    art.removeAttribute('data-cover');
    art.style.cssText += ';' + Art.coverStyle(p, { glyph: 'top' });
    match.innerHTML = `
      <div style="min-width:0">
        <small>Sua maior compatibilidade</small>
        <strong>${escapeHtml(p.name || '')}</strong>
      </div>
      ${top.compatibility_score ? `<span class="dash-hero-score">${Math.round(top.compatibility_score)}%</span>` : ''}`;
    art.style.cursor = 'pointer';
    art.onclick = () => navigate(`professions.html?id=${encodeURIComponent(p.id || '')}`);
  }

  function _initTopNav(p) {
    const avatarEl  = document.getElementById('navAvatar');
    const dropdown  = document.getElementById('navDropdown');
    const nameEl    = document.getElementById('dropdownName');
    const emailEl   = document.getElementById('dropdownEmail');
    const logoutBtn = document.getElementById('logoutBtn');

    if (p) {
      if (nameEl)  nameEl.textContent  = p.name  || '';
      if (emailEl) emailEl.textContent = p.email || '';

      if (avatarEl) avatarEl.innerHTML = Art.avatarImg(p.name, p.avatar_url);
    }

    // Toggle dropdown
    if (avatarEl && dropdown) {
      avatarEl.addEventListener('click', () => {
        const open = !dropdown.classList.contains('hidden');
        dropdown.classList.toggle('hidden', open);
        avatarEl.setAttribute('aria-expanded', String(!open));
      });
      avatarEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          avatarEl.click();
        }
      });
      document.addEventListener('click', (e) => {
        if (!avatarEl.contains(e.target) && !dropdown.contains(e.target)) {
          dropdown.classList.add('hidden');
          avatarEl.setAttribute('aria-expanded', 'false');
        }
      });
    }

    // Logout
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

  /* ── Renderizar recomendações (profissões) ── */
  function _renderRecommendations(recs, vp) {
    const container = document.getElementById('recommendedScroll');
    if (!container) return;

    if (!recs || recs.length === 0) {
      const testDone = vp?.completed_test;
      container.innerHTML = `
        <div class="empty-state" style="min-width:100%;padding:var(--space-8) var(--space-4)">
          <div class="empty-state-icon" aria-hidden="true"><i data-icon="target"></i></div>
          <h3>${testDone ? 'Calculando recomendações...' : 'Nenhuma recomendação ainda'}</h3>
          <p>${testDone
            ? 'Suas profissões compatíveis serão exibidas em breve.'
            : 'Conclua o teste vocacional para ver profissões indicadas para você.'
          }</p>
          ${!testDone ? '<a href="test.html" class="btn btn-primary btn-sm mt-3">Fazer o teste</a>' : ''}
        </div>`;
      return;
    }

    container.innerHTML = recs.map(rec => {
      const p     = rec.profession || {};
      const score = rec.compatibility_score || 0;
      return `
        <div class="profession-scroll-card" role="button" tabindex="0"
             onclick="navigate('professions.html?id=${escapeHtml(p.id || '')}')"
             onkeydown="if(event.key==='Enter')navigate('professions.html?id=${escapeHtml(p.id || '')}')"
             aria-label="${escapeHtml(p.name || 'Profissão')}">
          <div class="card-thumb" style="${Art.coverStyle(p)}" aria-hidden="true">
            <span class="thumb-score">${Math.round(score)}%</span>
          </div>
          <div class="card-info">
            <div class="card-name">${escapeHtml(p.name || 'Profissão')}</div>
            <div class="card-area">${escapeHtml(p.area || '')}</div>
            ${compatBar(score)}
            <div style="margin-top:var(--space-1);font-size:var(--text-xs);font-weight:var(--fw-semi);color:${_compatColor(score)}">${score}% compatível</div>
          </div>
        </div>`;
    }).join('') + _exploreCard(recs.length, 'Explore todas as profissões', 'Compare salários, mercado e rotina de 45 carreiras.', 'professions.html');
  }

  /* ── Card "explorar mais" para completar a grade ── */
  function _exploreCard(count, title, text, href) {
    if (count >= 4) return '';
    return `
      <a class="explore-card" href="${href}">
        <span class="explore-card-icon" aria-hidden="true"><i data-icon="arrow-right"></i></span>
        <strong>${title}</strong>
        <span>${text}</span>
      </a>`;
  }

  /* ── Renderizar vlogs ── */
  function _renderVlogs(recs) {
    const container = document.getElementById('vlogsScroll');
    if (!container) return;

    // Pegar profissões que têm vlog_url
    const withVlog = recs
      .filter(r => r.profession?.vlog_url || r.profession?.thumbnail_url)
      .slice(0, 6);

    // Se não tiver vlogs reais, mostrar cards de área com placeholder
    const items = withVlog.length > 0 ? withVlog : recs.slice(0, 4);

    if (!items || items.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="min-width:100%;padding:var(--space-8) var(--space-4)">
          <div class="empty-state-icon" aria-hidden="true"><i data-icon="video"></i></div>
          <h3>Nenhum vlog disponível</h3>
          <p>Os vlogs de profissões aparecerão aqui em breve.</p>
        </div>`;
      return;
    }

    container.innerHTML = items.map(rec => {
      const p    = rec.profession || {};
      const target = p.vlog_url
        ? `window.open('${escapeHtml(p.vlog_url)}','_blank','noopener')`
        : `navigate('professions.html?id=${escapeHtml(p.id || '')}')`;
      return `
        <div class="vlog-card" role="button" tabindex="0"
             onclick="${target}"
             onkeydown="if(event.key==='Enter'){${target}}"
             aria-label="Vlog: ${escapeHtml(p.name || 'Profissão')}">
          <div class="vlog-thumb-wrap" style="${Art.coverStyle(p)}">
            <div class="vlog-play-overlay" aria-hidden="true">
              <div class="vlog-play-btn"><i data-icon="play"></i></div>
            </div>
            <span class="vlog-tag" aria-hidden="true"><i data-icon="video"></i> ${p.vlog_url ? 'YouTube' : 'Em breve'}</span>
          </div>
          <div class="vlog-info">
            <div class="vlog-title">Um dia como ${escapeHtml(p.name || 'profissional')}</div>
            <div class="vlog-area">${escapeHtml(p.area || '')}</div>
          </div>
        </div>`;
    }).join('') + _exploreCard(items.length, 'Mais histórias de profissionais', 'Vídeos reais de quem já trabalha na área.', 'professions.html');
  }

  /* ── Renderizar mentores ── */
  function _renderMentors(mentorList) {
    const container = document.getElementById('mentorsScroll');
    if (!container) return;

    if (!mentorList || mentorList.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="min-width:100%;padding:var(--space-8) var(--space-4)">
          <div class="empty-state-icon" aria-hidden="true"><i data-icon="user"></i></div>
          <h3>Nenhum mentor disponível</h3>
          <p>Novos mentores são adicionados regularmente.</p>
        </div>`;
      return;
    }

    const top = mentorList.filter(m => m.is_available).slice(0, 8);
    const display = top.length > 0 ? top : mentorList.slice(0, 8);

    container.innerHTML = display.map(mentor => {
      const p          = mentor.profile || {};
      const name       = p.name || 'Mentor';
      const profession = mentor.profession || mentor.area || '';
      const score      = mentor.reputation_score || 0;
      const isAvail    = mentor.is_available;
      return `
        <div class="mentor-scroll-card" role="button" tabindex="0"
             onclick="navigate('mentors.html?id=${escapeHtml(mentor.id || '')}')"
             onkeydown="if(event.key==='Enter')navigate('mentors.html?id=${escapeHtml(mentor.id || '')}')"
             aria-label="Mentor ${escapeHtml(name)}">
          <div class="mentor-scroll-avatar">${Art.avatarImg(name, p.avatar_url)}</div>
          <div class="mentor-scroll-name">${escapeHtml(name)}</div>
          <div class="mentor-scroll-profession">${escapeHtml(profession)}</div>
          <div class="star-rating" style="justify-content:center;margin-bottom:var(--space-2)" aria-label="${score} de 10 estrelas">
            ${renderStars(score, 10)}
          </div>
          ${isAvail
            ? `<span class="badge badge-success" style="font-size:0.65rem">Disponível</span>`
            : `<span class="badge badge-muted" style="font-size:0.65rem">Indisponível</span>`
          }
        </div>`;
    }).join('');
  }

  /* ── Renderizar plano de carreira ── */
  function _renderCareerPlan(plan) {
    const container = document.getElementById('careerPlanArea');
    if (!container) return;

    if (!plan) {
      container.innerHTML = `
        <div class="career-plan-card">
          <div class="plan-art" style="background-image:url('${Art.cover('', 'plano')}')" aria-hidden="true"></div>
          <div class="career-plan-header">
            <div class="career-plan-icon" aria-hidden="true"><i data-icon="route"></i></div>
            <div>
              <p class="plan-title">Crie seu plano de carreira</p>
              <p class="plan-sub">Trilha de estudos, cursos gratuitos e metas semanais.</p>
            </div>
          </div>
          <a href="career-plan.html" class="btn btn-plan btn-block">Criar plano agora</a>
        </div>`;
      return;
    }

    const professionName = plan.profession?.name || 'Profissão';
    const goals          = Array.isArray(plan.weekly_goals) ? plan.weekly_goals : [];
    const total          = goals.length;
    const done           = goals.filter(g => g.status === 'done' || g.completed === true).length;
    const pct            = total > 0 ? Math.round((done / total) * 100) : 0;

    container.innerHTML = `
      <div class="career-plan-card" role="region" aria-label="Plano de carreira">
        <div class="plan-art" style="background-image:url('${Art.cover(plan.profession?.area, professionName)}')" aria-hidden="true"></div>
        <div class="career-plan-header">
          <div class="career-plan-icon" aria-hidden="true"><i data-icon="route"></i></div>
          <div style="flex:1;min-width:0">
            <p class="plan-title">${escapeHtml(professionName)}</p>
            <p class="plan-sub">
              ${done} de ${total} meta${total !== 1 ? 's' : ''} concluída${done !== 1 ? 's' : ''}
            </p>
          </div>
          <span class="plan-pct">${pct}%</span>
        </div>
        <div class="progress-labeled">
          <div class="progress" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100" aria-label="${pct}% do plano concluído">
            <div class="progress-bar" style="width:${pct}%;transition:width 0.8s var(--ease-out)"></div>
          </div>
        </div>
        <a href="career-plan.html" class="btn btn-plan btn-block">Ver plano completo</a>
      </div>`;
  }

  /* ── Renderizar vagas ── */
  function _renderJobs(jobList) {
    const container = document.getElementById('jobsArea');
    if (!container) return;

    if (!jobList || jobList.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon" aria-hidden="true"><i data-icon="briefcase"></i></div>
          <h3>Nenhuma vaga disponível</h3>
          <p>Vagas para estudantes aparecerão aqui em breve.</p>
        </div>`;
      return;
    }

    const JOB_TYPE_LABELS = {
      internship: 'Estágio',
      trainee:    'Trainee',
      job:        'Emprego',
      apprentice: 'Jovem aprendiz',
      part_time:  'Meio período',
      full_time:  'Tempo integral',
      volunteer:  'Voluntário',
      freelance:  'Freelance',
    };

    container.innerHTML = jobList.slice(0, 5).map(job => {
      const company   = job.company || {};
      const typeLabel = JOB_TYPE_LABELS[job.job_type] || job.job_type || 'Vaga';
      const areas     = Array.isArray(job.areas) ? job.areas : (job.area ? [job.area] : []);
      const logoHtml  = company.avatar_url
        ? `<img src="${escapeHtml(company.avatar_url)}" alt="${escapeHtml(company.name || '')}">`
        : escapeHtml(initials(company.name || 'Empresa'));
      const logoBg    = (Art.AREA[areas[0]] || Art.AREA['Direito']).bg;
      return `
        <div class="job-card" role="article" aria-label="${escapeHtml(job.title || 'Vaga')}">
          <div class="job-card-header">
            <div class="job-company-logo" style="background:${logoBg}">${logoHtml}</div>
            <div style="flex:1;min-width:0">
              <p style="font-weight:var(--fw-semi);font-size:var(--text-base);color:var(--color-text);margin-bottom:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                ${escapeHtml(job.title || 'Vaga')}
              </p>
              <p style="font-size:var(--text-sm);color:var(--color-muted);margin:0">
                ${escapeHtml(company.name || 'Empresa')}
              </p>
            </div>
            <span class="badge badge-secondary">${escapeHtml(typeLabel)}</span>
          </div>
          <div class="job-meta">
            ${job.location ? `<span><i data-icon="map-pin"></i> ${escapeHtml(job.location)}</span>` : ''}
            ${areas.length > 0 ? `<span><i data-icon="layers"></i> ${areas.slice(0, 3).map(escapeHtml).join(' · ')}</span>` : ''}
          </div>
        </div>`;
    }).join('');
  }


  /* ── Recalcular scores a partir do perfil atual ── */
  function _computeFreshScores(professions, vp) {
    const AREA_NORMALIZE = {
      'tecnologia': 'tecnologia', 'ti': 'tecnologia', 'computação': 'tecnologia',
      'informática': 'tecnologia', 'software': 'tecnologia', 'programação': 'tecnologia',
      'desenvolvimento': 'tecnologia', 'computador': 'tecnologia', 'digital': 'tecnologia',
      'saúde': 'saúde', 'medicina': 'saúde', 'enfermagem': 'saúde', 'farmácia': 'saúde',
      'educação': 'educação', 'ensino': 'educação', 'pedagogia': 'educação',
      'direito': 'direito', 'jurídico': 'direito', 'advocacia': 'direito', 'lei': 'direito',
      'engenharia': 'engenharia', 'construção': 'engenharia',
      'administração': 'administração', 'gestão': 'administração', 'negócios': 'administração',
      'comunicação': 'comunicação', 'marketing': 'comunicação', 'jornalismo': 'comunicação',
      'artes': 'artes', 'design': 'artes', 'arte': 'artes', 'música': 'artes',
      'ciências': 'ciências', 'biologia': 'ciências', 'química': 'ciências',
      'agronegócio': 'agronegócio', 'agricultura': 'agronegócio',
      'gastronomia': 'gastronomia', 'culinária': 'gastronomia',
      'meio ambiente': 'meio ambiente', 'ambiental': 'meio ambiente',
      'ciências sociais': 'ciências sociais', 'serviço social': 'ciências sociais', 'sociologia': 'ciências sociais',
      'turismo': 'turismo', 'hotelaria': 'turismo',
      'esportes': 'esportes', 'educação física': 'esportes',
      'moda': 'moda',
      'segurança': 'segurança',
    };
    const INTEREST_MAP = {
      'computador': 'tecnologia', 'computadores': 'tecnologia', 'programação': 'tecnologia',
      'código': 'tecnologia', 'software': 'tecnologia', 'jogo': 'tecnologia', 'jogos': 'tecnologia',
      'tecnologia': 'tecnologia', 'robótica': 'tecnologia', 'internet': 'tecnologia',
      'médico': 'saúde', 'médica': 'saúde', 'hospital': 'saúde', 'saúde': 'saúde',
      'biologia': 'saúde', 'remédio': 'saúde',
      'ensinar': 'educação', 'professor': 'educação', 'escola': 'educação',
      'direito': 'direito', 'lei': 'direito', 'justiça': 'direito',
      'matemática': 'engenharia', 'construir': 'engenharia',
      'empresa': 'administração', 'empreender': 'administração', 'negócios': 'administração',
      'escrever': 'comunicação', 'comunicar': 'comunicação', 'mídia': 'comunicação',
      'desenhar': 'artes', 'arte': 'artes', 'pintura': 'artes', 'design': 'artes',
      'animais': 'meio ambiente', 'plantas': 'meio ambiente', 'natureza': 'meio ambiente',
      'cozinhar': 'gastronomia', 'culinária': 'gastronomia',
      'fazenda': 'agronegócio', 'agricultura': 'agronegócio',
    };

    function norm(area) {
      return AREA_NORMALIZE[(area || '').toLowerCase()] || (area || '').toLowerCase();
    }

    // Aceita string[] legado ou {name, compatibility_score}[] retornado pela IA
    function normalizeRecommended(list) {
      return (list || [])
        .map(r => {
          if (typeof r === 'string') return { name: r, score: null };
          const score = typeof r?.compatibility_score === 'number' ? r.compatibility_score
                      : typeof r?.score === 'number'                ? r.score
                      : null;
          return { name: r?.name || r?.profession || '', score };
        })
        .filter(r => r.name);
    }

    // Sobreposição real entre tags da profissão e o perfil do estudante (nada de hash aleatório)
    function tagOverlapCount(tags, interests, traits) {
      const words = new Set(
        [...interests, ...traits].map(w => (w || '').toLowerCase().trim()).filter(Boolean)
      );
      if (!tags.length || words.size === 0) return 0;
      let count = 0;
      for (const tag of tags) {
        for (const w of words) {
          if (tag.includes(w) || w.includes(tag)) { count++; break; }
        }
      }
      return count;
    }

    const raw = vp?.raw_profile?.test || {};
    const aiProfile = {
      top_areas:               raw.top_areas               || vp?.top_areas               || [],
      recommended_professions: raw.recommended_professions || vp?.recommended_professions || [],
      interests:               raw.interests               || vp?.interests               || [],
      traits:                  raw.traits                  || vp?.personality_traits       || [],
    };

    const topAreas    = aiProfile.top_areas.map(norm);
    const recommended = normalizeRecommended(aiProfile.recommended_professions);

    // Derive implied areas from interests
    const interestAreas = new Set();
    aiProfile.interests.forEach(interest => {
      const key = (interest || '').toLowerCase();
      if (INTEREST_MAP[key]) interestAreas.add(INTEREST_MAP[key]);
      Object.entries(INTEREST_MAP).forEach(([k, v]) => {
        if (key.includes(k) || k.includes(key)) interestAreas.add(v);
      });
    });

    const allMatchAreas = [...new Set([...topAreas, ...interestAreas])];

    return professions
      .filter(p => p.id)
      .map(prof => {
        const name = (prof.name || '').toLowerCase();
        const area = norm(prof.area);
        const tags = Array.isArray(prof.tags) ? prof.tags.map(t => (t || '').toLowerCase()) : [];

        const recMatch = recommended.find(r => {
          const rn = r.name.toLowerCase();
          return name === rn || name.includes(rn) || rn.includes(name);
        });
        const areaMatch = allMatchAreas.some(a => area === a || area.includes(a) || a.includes(area));

        let score;
        if (recMatch) {
          // Confia no julgamento da IA sobre a conversa inteira do estudante
          score = recMatch.score != null ? Math.round(recMatch.score) : 82;
        } else {
          const overlap = tagOverlapCount(tags, aiProfile.interests, aiProfile.traits);
          score = areaMatch
            ? 48 + Math.min(31, overlap * 7)   // 48–79
            : 15 + Math.min(23, overlap * 6);  // 15–38
        }

        return { ...prof, score: Math.max(1, Math.min(99, score)) };
      })
      .sort((a, b) => b.score - a.score);
  }

  /* ── Gerar recomendações sintéticas do perfil vocacional ── */
  function _buildSyntheticRecs(vp) {
    const raw = vp?.raw_profile?.test || {};
    const list  = (raw.recommended_professions || vp?.recommended_professions || []).slice(0, CONFIG.BUSINESS.TOP_RECOMMENDATIONS);
    const areas = raw.top_areas || vp?.top_areas || [];
    return list.map((item, i) => {
      const isObj = item && typeof item === 'object';
      const name  = isObj ? (item.name || 'Profissão') : item;
      const score = isObj && typeof item.compatibility_score === 'number'
        ? Math.round(item.compatibility_score)
        : Math.max(60, 88 - i * 8); // fallback só quando a IA não retornou nota
      return {
        compatibility_score: score,
        profession: { id: null, name, area: areas[0] || '' },
      };
    });
  }

  /* ── Helpers ── */

  function _compatColor(score) {
    if (score >= 70) return 'var(--color-success)';
    if (score >= 45) return '#92400E';
    return 'var(--color-danger)';
  }

})();
