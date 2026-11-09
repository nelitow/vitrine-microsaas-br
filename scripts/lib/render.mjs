// Server-side HTML for cards and per-project pages, so the content is in the
// HTML for crawlers and for people without JS. app.js only filters/reorders.

export const esc = (s) => String(s ?? '').replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&#39;', '"': '&quot;' })[c]);

export const slug = (key) => key.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const fmtDate = (ts) => new Date(ts * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'America/Sao_Paulo' });

const stageClass = (s) => 'stage-' + slug(s);

export function card(p) {
  const n = p.updates.length;
  return `<article class="card" id="${esc(slug(p.key))}" data-key="${esc(p.key)}">
  <header class="card-head">
    <h2 class="card-name"><a href="/p/${esc(slug(p.key))}/">${esc(p.name)}</a></h2>
    <a class="card-domain" href="${esc(p.url)}" rel="noopener nofollow ugc" target="_blank">${esc(p.domain)} ↗</a>
    <span class="badge-new" hidden>novo</span>
  </header>
  <p class="card-pitch">${esc(p.pitch)}</p>
  ${p.excerpt ? `<p class="card-excerpt">${esc(p.excerpt)}</p>` : ''}
  <div class="tags">
    <span class="tag ${stageClass(p.stage)}">${esc(p.stage)}</span>
    ${p.revenue ? `<span class="tag tag-revenue">${esc(p.revenue)}</span>` : ''}
    ${p.categories.map((c) => `<span class="tag tag-cat">${esc(c)}</span>`).join('')}
  </div>
  <footer class="card-foot">
    <a class="vote" href="${esc(p.latestPermalink)}" rel="noopener" target="_blank" title="Vote no post original no Reddit"><span aria-hidden="true">▲</span> <b>${p.score}</b></a>
    <span class="meta">💬 ${p.comments}</span>
    <span class="meta">u/${esc(p.author)}</span>
    <time class="meta when" data-ts="${p.lastUpdate}" datetime="${new Date(p.lastUpdate * 1000).toISOString()}">${fmtDate(p.lastUpdate)}</time>
    ${n > 1 ? `<a class="meta updates-link" href="/p/${esc(slug(p.key))}/">${n} posts</a>` : ''}
    <button class="follow" type="button" aria-pressed="false">Seguir</button>
  </footer>
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
<meta property="og:site_name" content="Vitrine MicroSaaS BR">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta name="twitter:card" content="summary">
<link rel="alternate" type="application/rss+xml" title="Vitrine MicroSaaS BR" href="/feed.xml">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<meta name="theme-color" content="#f6f3ec">
${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>` : ''}
${extraHead}
<style>${css}</style>
</head>
<body>
${body}
</body>
</html>
`;
}

export function siteHeader(stats) {
  return `<header class="site-head">
  <a class="logo" href="/"><span class="logo-mark">▲</span> Vitrine <em>MicroSaaS BR</em></a>
  <nav class="site-nav">
    <a href="/sobre/">Sobre</a>
    <a href="/feed.xml">RSS</a>
    <a href="https://www.reddit.com/r/MicroSaaSBR/" rel="noopener">r/MicroSaaSBR</a>
  </nav>
  ${stats ? `<p class="stats">${stats}</p>` : ''}
</header>`;
}

export function siteFooter(fetchedAt) {
  return `<footer class="site-foot">
  <p>Projeto da comunidade, sem fins lucrativos. Dados públicos do <a href="https://www.reddit.com/r/MicroSaaSBR/">r/MicroSaaSBR</a> via API oficial do Reddit; os votos e comentários acontecem lá. Atualizado em ${fmtDate(fetchedAt / 1000)}.</p>
  <p>É seu projeto e quer remover ou corrigir? <a href="/sobre/#remover">Veja como</a>.</p>
</footer>`;
}

const clip = (s, max) => (s.length <= max ? s : s.slice(0, s.lastIndexOf(' ', max)) + '…');

export function projectPage(p, site) {
  const s = slug(p.key);
  const timeline = [...p.updates].reverse().map((u, i, arr) => `<li>
    <time datetime="${new Date(u.created * 1000).toISOString()}">${fmtDate(u.created)}</time>
    <a href="${esc(u.permalink)}" rel="noopener">${esc(u.title)}</a>
    <span class="meta">▲ ${u.score} · 💬 ${u.comments}${i === arr.length - 1 ? ' · lançamento' : ''}</span>
  </li>`).join('\n');
  const description = clip(`${p.name}: ${p.pitch}${p.excerpt ? '. ' + p.excerpt : ''}`, 158);
  return layout({
    title: clip(`${p.name} — ${p.pitch}`, 62) + ' | Vitrine MicroSaaS BR',
    description,
    canonical: `${site.url}/p/${s}/`,
    css: site.css,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: p.name,
      url: p.url,
      description: p.pitch,
      applicationCategory: p.categories[0] ?? 'BusinessApplication',
      datePublished: new Date(p.firstSeen * 1000).toISOString().slice(0, 10),
      author: { '@type': 'Person', name: `u/${p.author}`, url: `https://www.reddit.com/user/${p.author}` },
    },
    body: `${siteHeader()}
<main class="project">
  <p class="crumbs"><a href="/">← Todos os projetos</a></p>
  ${card(p)}
  <section class="timeline">
    <h3>Linha do tempo no r/MicroSaaSBR</h3>
    <ol>${timeline}</ol>
  </section>
  <section class="maker-badge">
    <h3>É o seu projeto?</h3>
    <p>Coloque o selo no seu site:</p>
    <img src="/badge.svg" alt="Na Vitrine MicroSaaS BR" width="200" height="40">
    <textarea readonly rows="2">&lt;a href="${esc(`${site.url}/p/${s}/`)}"&gt;&lt;img src="${esc(site.url)}/badge.svg" alt="Na Vitrine MicroSaaS BR" width="200" height="40"&gt;&lt;/a&gt;</textarea>
  </section>
</main>
${siteFooter(site.fetchedAt)}
<script>/*__JS__*/</script>`,
  }).replace('/*__JS__*/', () => site.js);
}
