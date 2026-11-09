// Server-side HTML for rows and per-project pages, so the content is in the
// HTML for crawlers and for people without JS. app.js only filters/reorders.

export const SITE_NAME = 'Vitrine MicroSaaS BR';

export const esc = (s) => String(s ?? '').replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&#39;', '"': '&quot;' })[c]);

export const slug = (key) => key.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const TZ = 'America/Sao_Paulo';
export const fmtDate = (ts) => new Date(ts * 1000).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: TZ }).replace(/\./g, '');
export const num = (n) => Number(n).toLocaleString('pt-BR');
const isoDate = (ts) => new Date(ts * 1000).toISOString();

export const ICONS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <symbol id="i-up" viewBox="0 0 12 12"><path d="M6 2.5 10.5 9h-9z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></symbol>
  <symbol id="i-out" viewBox="0 0 12 12"><path d="M4.5 2.5h5v5M9.5 2.5 3 9" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></symbol>
</svg>`;
const icon = (id) => `<svg class="ico" width="12" height="12" aria-hidden="true"><use href="#i-${id}"/></svg>`;

const STATUS_WORD = {
  parado: ['parado', 'No ar, mas sem sinal de vida há mais de 6 meses'],
  instavel: ['fora do ar', 'Não respondeu na última verificação'],
  morto: ['morto', 'Fora do ar há semanas, ou domínio abandonado'],
};

function facts(p) {
  const out = [`<span class="stage">${esc(p.stage)}</span>`];
  if (p.revenue) out.push(`<span class="revenue" title="Receita declarada pelo maker">${esc(p.revenue)}</span>`);
  const s = STATUS_WORD[p.health?.status];
  if (s) out.push(`<span class="status status-${p.health.status}" title="${esc(s[1])}">${s[0]}</span>`);
  if (p.health?.survivor) out.push(`<span class="status status-survivor" title="No ar há mais de 6 meses">sobrevivente</span>`);
  if (p.categories.length) out.push(`<span>${esc(p.categories.join(', '))}</span>`);
  return out;
}

const SEP = '<span class="sep" aria-hidden="true"> · </span>';

export function row(p) {
  const s = slug(p.key);
  const n = p.updates.length;
  const by = p.author ? `<a href="https://www.reddit.com/user/${esc(p.author)}" rel="noopener nofollow">u/${esc(p.author)}</a>` : null;
  const meta = [
    ...facts(p),
    by,
    `<time class="when" data-ts="${p.lastUpdate}" datetime="${isoDate(p.lastUpdate)}">${fmtDate(p.lastUpdate)}</time>`,
    p.comments ? `<a href="${esc(p.latestPermalink)}" rel="noopener">${num(p.comments)} comentários</a>` : null,
    n > 1 ? `<a href="/p/${s}/">${n} posts</a>` : null,
    p.health?.stars != null ? `${num(p.health.stars)} estrelas no GitHub` : null,
  ].filter(Boolean).map((m, i) => `<span class="mi">${i ? '<span class="sep" aria-hidden="true">· </span>' : ''}${m}</span>`).join(' ');

  return `<article class="row${p.health?.status === 'morto' ? ' is-dead' : ''}" id="${s}" data-key="${esc(p.key)}">
  <div class="row-main">
    <h2 class="row-name"><a href="/p/${s}/">${esc(p.name)}</a> <span class="row-aside"><a class="row-domain" href="${esc(p.url)}" rel="noopener nofollow ugc" target="_blank">${esc(p.domain)}${icon('out')}</a><span class="new" hidden>novo</span></span></h2>
    <p class="row-pitch">${esc(p.tagline)}</p>
    <p class="row-meta">${meta} <span class="mi"><span class="sep" aria-hidden="true">· </span><button class="follow" type="button" aria-pressed="false">seguir</button></span></p>
  </div>
  <a class="vote" href="${esc(p.latestPermalink)}" rel="noopener" target="_blank" title="Votar no post original, no Reddit">${icon('up')}<b>${num(p.score)}</b></a>
</article>`;
}

export function layout({ title, description, canonical, body, jsonLd, css, extraHead = '' }) {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:type" content="website">
<meta property="og:locale" content="pt_BR">
<meta property="og:site_name" content="${SITE_NAME}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta name="twitter:card" content="summary">
<link rel="alternate" type="application/rss+xml" title="${SITE_NAME}" href="/feed.xml">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#151514" media="(prefers-color-scheme: dark)">
${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>` : ''}
${extraHead}
<style>${css}</style>
</head>
<body>
${ICONS}
${body}
</body>
</html>
`;
}

export function siteHeader(current = '') {
  const link = (href, label) => `<a href="${href}"${current === href ? ' aria-current="page"' : ''}>${label}</a>`;
  return `<header class="site-head">
  <div class="wrap site-head-in">
    <a class="logo" href="/" aria-label="${SITE_NAME}, página inicial"><svg class="logo-mark" width="22" height="22" viewBox="0 0 22 22" aria-hidden="true"><rect width="22" height="22" rx="4.5"/><path d="M6 7.2 10.2 15.8 16.4 5.2"/></svg><span class="logo-name">Vitrine</span><span class="logo-sub">MicroSaaS BR</span></a>
    <nav class="site-nav" aria-label="Principal">
      ${link('/', 'Projetos')}
      ${link('/numeros/', 'Números')}
      ${link('/sobrevivencia/', 'Quem sobreviveu')}
      ${link('/sobre/', 'Sobre')}
      <a class="nav-sub" href="https://www.reddit.com/r/MicroSaaSBR/" rel="noopener">r/MicroSaaSBR</a>
    </nav>
  </div>
</header>`;
}

export function siteFooter(fetchedAt) {
  return `<footer class="site-foot">
  <div class="wrap">
    <p>Mantido por gente do <a href="https://www.reddit.com/r/MicroSaaSBR/">r/MicroSaaSBR</a>, sem fins lucrativos. Votos e comentários ficam no Reddit. Atualizado em ${fmtDate(fetchedAt / 1000)}.</p>
    <p><a href="/sobre/#remover">Tirar ou corrigir um projeto</a><span class="sep" aria-hidden="true"> · </span><a href="/feed.xml">RSS</a><span class="sep" aria-hidden="true"> · </span><a href="https://github.com/nelitow/vitrine-microsaas-br">Código</a></p>
  </div>
</footer>`;
}

const clip = (s, max) => (s.length <= max ? s : s.slice(0, s.lastIndexOf(' ', max)) + '…');

export function projectPage(p, site) {
  const s = slug(p.key);
  const timeline = [...p.updates].reverse().map((u, i, arr) => `<li>
    <time datetime="${isoDate(u.created)}">${fmtDate(u.created)}${i === arr.length - 1 ? ', lançamento' : ''}</time>
    <a href="${esc(u.permalink)}" rel="noopener">${esc(u.title)}</a>
    ${u.score || u.comments ? `<span class="tl-meta">${num(u.score)} votos · ${num(u.comments)} comentários</span>` : ''}
  </li>`).join('\n');
  const description = clip(`${p.name}: ${p.tagline}. ${p.excerpt ?? ''}`, 158);
  const h = p.health ?? {};
  const statusLine = {
    ativo: 'No ar na última verificação.',
    parado: 'No ar, mas sem sinal de vida há mais de 6 meses.',
    instavel: 'Não respondeu na última verificação.',
    morto: `Fora do ar desde ${h.diedAt ? fmtDate(h.diedAt) : '?'}.`,
    desconhecido: 'Ainda não verificado.',
  }[p.status];
  const embed = `<a href="${site.url}/p/${s}/"><img src="${site.url}/badge.svg" alt="Na ${SITE_NAME}" width="200" height="40"></a>`;
  return layout({
    title: `${p.name}: ${clip(p.tagline, 60)} | ${SITE_NAME}`,
    description,
    canonical: `${site.url}/p/${s}/`,
    css: site.css,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: p.name,
      url: p.url,
      description: p.tagline,
      applicationCategory: p.categories[0] ?? 'BusinessApplication',
      datePublished: new Date(p.firstSeen * 1000).toISOString().slice(0, 10),
      ...(p.author && { author: { '@type': 'Person', name: `u/${p.author}`, url: `https://www.reddit.com/user/${p.author}` } }),
    },
    body: `${siteHeader()}
<main class="wrap page project${p.status === 'morto' ? ' is-dead' : ''}" data-key="${esc(p.key)}">
  <p class="crumbs"><a href="/">Projetos</a> / ${esc(p.name)}</p>
  <header class="project-head">
    <div>
      <h1>${esc(p.name)}</h1>
      <p class="project-pitch">${esc(p.tagline)}</p>
      <p class="project-links"><a class="button" href="${esc(p.url)}" rel="noopener nofollow ugc" target="_blank">Abrir ${esc(p.domain)}${icon('out')}</a> <button class="follow button-quiet" type="button" aria-pressed="false">seguir</button></p>
    </div>
    <a class="vote vote-lg" href="${esc(p.latestPermalink)}" rel="noopener" target="_blank" title="Votar no post original, no Reddit">${icon('up')}<b>${num(p.score)}</b><span>votos no Reddit</span></a>
  </header>
  ${p.excerpt ? `<p class="project-summary">${esc(p.excerpt)}${p.excerpt.endsWith('…') ? ` <a href="${esc(p.updates[0].permalink)}" rel="noopener">Continua no Reddit</a>` : ''}</p>` : ''}
  <dl class="facts">
    <dt>Estágio</dt><dd>${esc(p.stage)}</dd>
    ${p.revenue ? `<dt>Receita declarada</dt><dd>${esc(p.revenue)}</dd>` : ''}
    <dt>Situação</dt><dd>${statusLine}${h.survivor ? ' Sobrevivente: no ar há mais de 6 meses.' : ''}</dd>
    ${p.categories.length ? `<dt>Categorias</dt><dd>${esc(p.categories.join(', '))}</dd>` : ''}
    ${p.author ? `<dt>Maker</dt><dd><a href="https://www.reddit.com/user/${esc(p.author)}" rel="noopener nofollow">u/${esc(p.author)}</a></dd>` : ''}
    ${p.repo ? `<dt>Código</dt><dd><a href="https://github.com/${esc(p.repo)}" rel="noopener">${esc(p.repo)}</a>${h.stars != null ? `, ${num(h.stars)} estrelas` : ''}</dd>` : ''}
    <dt>No sub desde</dt><dd>${fmtDate(p.firstSeen)}</dd>
  </dl>
  <p class="note">Estágio, receita e categoria são lidos do texto dos posts e podem estar errados. <a href="/sobre/#remover">Corrigir</a>.</p>
  <section class="timeline">
    <h2>Posts no r/MicroSaaSBR</h2>
    <ol>${timeline}</ol>
  </section>
  <section class="maker-badge">
    <h2>É seu?</h2>
    <p>Cole o selo no rodapé do seu site. Ele aponta para esta página.</p>
    <img src="/badge.svg" alt="Na ${SITE_NAME}" width="200" height="40">
    <textarea readonly rows="3" aria-label="Código do selo">${esc(embed)}</textarea>
  </section>
</main>
${siteFooter(site.fetchedAt)}
<script>/*__JS__*/</script>`,
  }).replace('/*__JS__*/', () => site.js);
}
