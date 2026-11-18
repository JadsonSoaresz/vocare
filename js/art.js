/* ============================================================
   VOCARE — Arte gerada
   js/art.js · Capas ilustradas por área e avatares ilustrados,
   gerados em SVG a partir de uma semente (nome). Sem imagens
   externas: cada profissão/pessoa ganha uma arte própria e estável.

   Art.cover(area, seed)        → data URL da capa
   Art.coverStyle(profession)   → "background-image:url(...)" (usa thumbnail_url se existir)
   Art.avatar(seed)             → data URL do avatar
   Art.avatarImg(name, alt)     → <img> pronto (usa avatar_url se passado)
   Elementos com data-cover="Área" [data-seed] e data-avatar="Nome"
   são preenchidos automaticamente.
   ============================================================ */

'use strict';

const Art = (() => {
  /* Paths dos glifos (mesma base dos ícones de css/icons.css) */
  const GLYPHS = {
    "laptop": "<path d=\"M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16\"/>",
    "heart-pulse": "<path d=\"M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z\"/><path d=\"M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27\"/>",
    "book": "<path d=\"M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z\"/><path d=\"M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z\"/>",
    "wrench": "<path d=\"M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z\"/>",
    "scale": "<path d=\"m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z\"/><path d=\"m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z\"/><path d=\"M7 21h10\"/><path d=\"M12 3v18\"/><path d=\"M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2\"/>",
    "palette": "<circle cx=\"13.5\" cy=\"6.5\" r=\".5\"/><circle cx=\"17.5\" cy=\"10.5\" r=\".5\"/><circle cx=\"8.5\" cy=\"7.5\" r=\".5\"/><circle cx=\"6.5\" cy=\"12.5\" r=\".5\"/><path d=\"M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z\"/>",
    "bar-chart": "<path d=\"M3 3v18h18\"/><path d=\"M18 17V9\"/><path d=\"M13 17V5\"/><path d=\"M8 17v-3\"/>",
    "megaphone": "<path d=\"m3 11 18-5v12L3 14v-3z\"/><path d=\"M11.6 16.8a3 3 0 1 1-5.8-1.6\"/>",
    "flask": "<path d=\"M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a1 1 0 0 0 .9 1.45h12.76a1 1 0 0 0 .9-1.45l-5.069-10.127A2 2 0 0 1 14 9.527V2\"/><path d=\"M8.5 2h7\"/><path d=\"M7 16h10\"/>",
    "leaf": "<path d=\"M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z\"/><path d=\"M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12\"/>",
    "shield": "<path d=\"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10\"/>",
    "sprout": "<path d=\"M7 20h10\"/><path d=\"M10 20c5.5-2.5.8-6.4 3-10\"/><path d=\"M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4 0 5.5.8z\"/><path d=\"M14.1 6a7 7 0 0 0-1.1 4c1.9-.1 3.3-.6 4.3-1.4 1-1 1.6-2.3 1.7-4.6-2.7.1-4 1-4.9 2z\"/>",
    "dumbbell": "<path d=\"m6.5 6.5 11 11\"/><path d=\"m21 21-1-1\"/><path d=\"m3 3 1 1\"/><path d=\"m18 22 4-4\"/><path d=\"m2 6 4-4\"/><path d=\"m3 10 7-7\"/><path d=\"m14 21 7-7\"/>",
    "chef-hat": "<path d=\"M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z\"/><line x1=\"6\" x2=\"18\" y1=\"17\" y2=\"17\"/>",
    "shirt": "<path d=\"M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z\"/>",
    "users": "<path d=\"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2\"/><circle cx=\"9\" cy=\"7\" r=\"4\"/><path d=\"M22 21v-2a4 4 0 0 0-3-3.87\"/><path d=\"M16 3.13a4 4 0 0 1 0 7.75\"/>",
    "plane": "<path d=\"M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z\"/>",
    "compass": "<circle cx=\"12\" cy=\"12\" r=\"10\"/><polygon points=\"16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76\"/>"
  };

  const AREA = {
    'Tecnologia':       { bg: '#1E2A4A', a: '#2E4C8F', b: '#7FA6FF', ink: '#E8EEFF', g: 'laptop' },
    'Saúde':            { bg: '#0E4A43', a: '#17705F', b: '#8FD6C1', ink: '#EFFFF9', g: 'heart-pulse' },
    'Educação':         { bg: '#7A3E12', a: '#B4601E', b: '#F6C66B', ink: '#FFF6E6', g: 'book' },
    'Engenharia':       { bg: '#2B2F36', a: '#454C57', b: '#A9B4C2', ink: '#F2F4F7', g: 'wrench' },
    'Direito':          { bg: '#1A3C6E', a: '#2C5895', b: '#C9A45C', ink: '#F7F1E3', g: 'scale' },
    'Artes':            { bg: '#4B1D5C', a: '#7A2F86', b: '#F3A7C6', ink: '#FFF0F7', g: 'palette' },
    'Administração':    { bg: '#5A1F33', a: '#8A2F4E', b: '#F2B5A0', ink: '#FFF1EC', g: 'bar-chart' },
    'Comunicação':      { bg: '#0F5257', a: '#1B7A80', b: '#F0A500', ink: '#EAFBFB', g: 'megaphone' },
    'Ciências':         { bg: '#1D3557', a: '#2F5D8A', b: '#A8DADC', ink: '#F1FAEE', g: 'flask' },
    'Meio Ambiente':    { bg: '#1F4D2B', a: '#2F7342', b: '#B7E4A7', ink: '#F1FBEF', g: 'leaf' },
    'Agronegócio':      { bg: '#4A5A16', a: '#6B7F22', b: '#E9C46A', ink: '#FBF8E8', g: 'sprout' },
    'Gastronomia':      { bg: '#7A2318', a: '#A83A27', b: '#F4A261', ink: '#FFF3EC', g: 'chef-hat' },
    'Segurança':        { bg: '#222B36', a: '#364353', b: '#8FA3B8', ink: '#EEF2F6', g: 'shield' },
    'Esportes':         { bg: '#0B5D4B', a: '#0E8064', b: '#F0A500', ink: '#ECFFF8', g: 'dumbbell' },
    'Moda':             { bg: '#6B1E45', a: '#962B60', b: '#F7C1D9', ink: '#FFF0F6', g: 'shirt' },
    'Ciências Sociais': { bg: '#3D2C6B', a: '#5A45A0', b: '#C7B8F5', ink: '#F5F2FF', g: 'users' },
    'Turismo':          { bg: '#0E4D64', a: '#137399', b: '#F6D186', ink: '#EEFAFF', g: 'plane' },
  };
  const DEFAULT_AREA = { bg: '#1A3C6E', a: '#2C5895', b: '#F0A500', ink: '#F7F1E3', g: 'compass' };

  /* ── utilidades ── */
  function hash(str) {
    let h = 2166136261;
    for (const ch of String(str || '')) { h ^= ch.codePointAt(0); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(seed) {            // mulberry32
    let t = hash(seed);
    return () => {
      t = (t + 0x6D2B79F5) | 0;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }
  const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
  const between = (r, min, max) => min + r() * (max - min);
  const f = n => Math.round(n * 10) / 10;
  const toUrl = svg => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  const cache = new Map();
  function memo(key, fn) {
    if (!cache.has(key)) cache.set(key, fn());
    return cache.get(key);
  }

  /* ── Capa de área ── */
  function cover(area, seed, opts = {}) {
    return memo(`c|${area}|${seed}|${opts.glyph || ""}`, () => {
      const p = AREA[area] || DEFAULT_AREA;
      const r = rng(`${area}|${seed || area}`);
      const W = 400, H = 240;
      const parts = [`<rect width="${W}" height="${H}" fill="${p.bg}"/>`];

      // Forma principal: disco grande à direita
      const cx = between(r, 270, 350), cy = between(r, 40, 200), rad = between(r, 95, 140);
      parts.push(`<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(rad)}" fill="${p.a}"/>`);

      // Forma secundária
      const kind = pick(r, ['half', 'ring', 'pill', 'quarter']);
      if (kind === 'half') {
        const x = between(r, 150, 260), R = between(r, 50, 70);
        parts.push(`<path d="M${f(x - R)} ${H} A${f(R)} ${f(R)} 0 0 1 ${f(x + R)} ${H} Z" fill="${p.b}"/>`);
      } else if (kind === 'ring') {
        parts.push(`<circle cx="${f(cx - rad * 0.55)}" cy="${f(cy + rad * 0.45)}" r="${f(between(r, 34, 50))}" fill="none" stroke="${p.b}" stroke-width="14"/>`);
      } else if (kind === 'pill') {
        const x = between(r, 170, 250), y = between(r, 30, 150), rot = pick(r, [-30, -15, 15, 30]);
        parts.push(`<rect x="${f(x)}" y="${f(y)}" width="120" height="44" rx="22" fill="${p.b}" transform="rotate(${rot} ${f(x + 60)} ${f(y + 22)})"/>`);
      } else {
        parts.push(`<path d="M${W} ${H} L${W - 110} ${H} A110 110 0 0 1 ${W} ${H - 110} Z" fill="${p.b}"/>`);
      }

      // Pequeno detalhe em âmbar (cor da marca)
      parts.push(`<circle cx="${f(between(r, 200, 380))}" cy="${f(between(r, 20, 60))}" r="${f(between(r, 7, 12))}" fill="#F0A500"/>`);

      // Malha de pontos
      const gx = pick(r, [24, 250]), gy = pick(r, [24, 150]);
      for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) {
        parts.push(`<circle cx="${gx + i * 14}" cy="${gy + j * 14}" r="1.8" fill="${p.ink}" fill-opacity="0.28"/>`);
      }

      // Arcos finos
      parts.push(`<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(rad + 22)}" fill="none" stroke="${p.ink}" stroke-opacity="0.18" stroke-width="1.5"/>`);

      // Glifo da área, grande, em traço
      const g = GLYPHS[p.g] || GLYPHS.compass;
      const glyphY = opts.glyph === "none" ? null : opts.glyph === "top" ? 30 : H / 2 - 44;
      if (glyphY !== null) parts.push(`<g transform="translate(36 ${f(glyphY)}) scale(3.6)" fill="none" stroke="${p.ink}" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round">${g}</g>`);

      return toUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">${parts.join('')}</svg>`);
    });
  }

  function coverStyle(prof, opts) {
    const src = prof?.thumbnail_url || cover(prof?.area, prof?.name, opts);
    return `background-image:url('${String(src).replace(/'/g, '%27')}');background-size:cover;background-position:center`;
  }

  /* ── Avatar ilustrado ── */
  const AV = {
    bg:    ['#F6E3C5', '#DDE7F7', '#E3F1E4', '#F7DCE0', '#E8E1F5', '#FBE8D3', '#D9EEF0'],
    skin:  ['#F2D3B1', '#E5B98F', '#C98E62', '#A86B45', '#7A4A2C', '#5C3920'],
    hair:  ['#1F1A17', '#3B2A20', '#6B4226', '#A0522D', '#2A2A35', '#C8A06A'],
    shirt: ['#1A3C6E', '#F0A500', '#2F7342', '#7A2F86', '#B4601E', '#2C5895', '#0F5257', '#A83A27'],
    style: ['short', 'long', 'curly', 'bun', 'buzz', 'side', 'long', 'curly'],
  };

  function avatar(seed) {
    return memo(`a|${seed}`, () => {
      const r = rng(`avatar|${seed}`);
      const bg = pick(r, AV.bg), skin = pick(r, AV.skin), hair = pick(r, AV.hair);
      const shirt = pick(r, AV.shirt), style = pick(r, AV.style);
      const back = [], front = [];

      if (style === 'long') {
        back.push(`<path d="M19 27C19 15 25.5 11.5 32 11.5S45 15 45 27L46.5 47H17.5Z" fill="${hair}"/>`);
        front.push(`<path d="M20.5 27C20 17 26 13.5 32 13.5C39 13.5 44 17.5 43.5 27C41 21.5 37 19.5 31 20C26.5 20.4 23 23 20.5 27Z" fill="${hair}"/>`);
      } else if (style === 'curly') {
        [[21.5, 23, 5], [24.5, 17, 5.5], [31, 14, 6.2], [38, 16.5, 5.6], [42.5, 22.5, 5], [20.5, 29, 3.6], [43.5, 29, 3.6]]
          .forEach(([x, y, rr]) => front.push(`<circle cx="${x}" cy="${y}" r="${rr}" fill="${hair}"/>`));
      } else if (style === 'bun') {
        front.push(`<circle cx="32" cy="9.5" r="5.5" fill="${hair}"/>`);
        front.push(`<path d="M20.5 27C20 17 26 13.5 32 13.5C39 13.5 44 17.5 43.5 27C41 22 37 20 32 20C27 20 23 22 20.5 27Z" fill="${hair}"/>`);
      } else if (style === 'buzz') {
        front.push(`<path d="M21 25C21 17 26 15 32 15S43 17 43 25C40 21 36 19.5 32 19.5S24 21 21 25Z" fill="${hair}"/>`);
      } else if (style === 'side') {
        front.push(`<path d="M20.5 28C19 16 27 12.5 33 13C41 13.5 45 19 43.5 28C42 22 36 19 28 21C25 22 22 24 20.5 28Z" fill="${hair}"/>`);
      } else {
        front.push(`<path d="M20.5 26C20.5 17 26 14 32 14S43.5 17 43.5 26C41.5 21.5 37 20 32 20S22.5 21.5 20.5 26Z" fill="${hair}"/>`);
      }

      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">`
        + `<rect width="64" height="64" fill="${bg}"/>`
        + back.join('')
        + `<rect x="28" y="36" width="8" height="9" rx="3" fill="${skin}"/>`
        + `<path d="M9 64C9 51 19 44.5 32 44.5S55 51 55 64Z" fill="${shirt}"/>`
        + `<path d="M28 44.6L32 49.5L36 44.6Z" fill="${skin}"/>`
        + `<ellipse cx="32" cy="28" rx="11" ry="12.5" fill="${skin}"/>`
        + front.join('')
        + `<circle cx="28" cy="29" r="1.3" fill="#1D1D1F"/><circle cx="36" cy="29" r="1.3" fill="#1D1D1F"/>`
        + `<path d="M29.5 34Q32 35.8 34.5 34" fill="none" stroke="#1D1D1F" stroke-width="1.2" stroke-linecap="round"/>`
        + `</svg>`;
      return toUrl(svg);
    });
  }

  function avatarImg(name, avatarUrl = null) {
    const safe = escapeHtml(name || '');
    const src = avatarUrl ? escapeHtml(avatarUrl) : avatar(name || 'vocare');
    return `<img src="${src}" alt="${safe}" loading="lazy" style="width:100%;height:100%;object-fit:cover;border-radius:inherit">`;
  }

  /* ── Hidratação automática de elementos estáticos ── */
  function hydrate(root = document) {
    root.querySelectorAll('[data-cover]').forEach(el => {
      el.style.backgroundImage = `url('${cover(el.dataset.cover, el.dataset.seed || el.dataset.cover)}')`;
      el.style.backgroundSize = 'cover';
      el.style.backgroundPosition = 'center';
    });
    root.querySelectorAll('[data-avatar]').forEach(el => {
      if (!el.querySelector('img')) el.innerHTML = avatarImg(el.dataset.avatar);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => hydrate());
  else hydrate();

  return { cover, coverStyle, avatar, avatarImg, hydrate, AREA };
})();

window.Art = Art;
