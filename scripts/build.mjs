// data/posts.json -> dist/ (fully static: index, one page per project, about,
// RSS, sitemap, badge). Deploy the dist/ folder to Cloudflare Pages.
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { buildProjects, CATEGORIES, STAGES } from './lib/extract.mjs';
import { card, esc, layout, projectPage, siteFooter, siteHeader, slug } from './lib/render.mjs';
import { hotness } from '../src/rank.mjs';

const root = new URL('../', import.meta.url);
const SITE_URL = (process.env.SITE_URL || 'https://vitrine-microsaas-br.pages.dev').replace(/\/$/, '');
const CONTACT = process.env.REDDIT_USERNAME ? `u/${process.env.REDDIT_USERNAME}` : 'os moderadores do r/MicroSaaSBR';

const read = (f) => readFile(new URL(f, root), 'utf8');

let raw;
try {
  raw = JSON.parse(await read('data/posts.json'));
} catch {
  console.error('No data/posts.json yet. Run `npm run fetch` (real data) or `npm run sample` (fake data).');
  process.exit(1);
}
// Makers can ask to be removed; list project keys or reddit post ids here.
const hidden = new Set(JSON.parse(await read('config/hidden.json').catch(() => '[]')));

const built = buildProjects(raw.posts);
const now = Date.now() / 1000;
const projects = built.projects
  .filter((p) => !hidden.has(p.key) && !p.updates.some((u) => hidden.has(u.id)))
  .sort((a, b) => hotness(b, now) - hotness(a, now));

const [css, js] = await Promise.all([read('src/style.css'), read('src/app.js'), read('src/rank.mjs')])
  .then(([css, app, rank]) => [css, rank.replace(/^export /gm, '') + '\n' + app]);
const site = { url: SITE_URL, css, js, fetchedAt: raw.fetchedAt };

const totalPosts = projects.reduce((s, p) => s + p.updates.length, 0);
const cats = Object.keys(CATEGORIES).filter((c) => projects.some((p) => p.categories.includes(c)));
const payload = JSON.stringify({
  sample: Boolean(raw.sample),
  projects: projects.map(({ key, name, pitch, excerpt, author, domain, stage, categories, score, comments, firstSeen, lastUpdate, revenue }) =>
    ({ key, name, pitch, excerpt, author, domain, stage, categories, score, comments, firstSeen, lastUpdate, revenue })),
}).replace(/</g, '\\u003c');

const chips = (name, values) => values.map((v) =>
  `<button type="button" class="chip" data-filter="${name}" data-value="${esc(v)}" aria-pressed="false">${esc(v)}</button>`).join('');

const indexBody = `${siteHeader(`<b>${projects.length}</b> projetos · <b>${totalPosts}</b> posts da comunidade`)}
${raw.sample ? '<p class="sample-banner">⚠️ Dados de exemplo. Rode <code>npm run fetch</code> para os posts reais.</p>' : ''}
<section class="hero">
  <h1>O que a comunidade brasileira de micro-SaaS está construindo</h1>
  <p>Todo projeto postado no r/MicroSaaSBR, organizado. Filtre por categoria e estágio, siga os que te interessam e veja quando postam novidades.</p>
</section>
<section class="controls" aria-label="Filtros">
  <input type="search" id="q" placeholder="Buscar projeto, ideia, maker…" autocomplete="off" aria-label="Buscar">
  <div class="sorts" role="tablist">
    <button type="button" class="sort" data-sort="hot" aria-pressed="true">Em alta</button>
    <button type="button" class="sort" data-sort="new" aria-pressed="false">Novos</button>
    <button type="button" class="sort" data-sort="updated" aria-pressed="false">Atualizados</button>
    <button type="button" class="sort" data-sort="top" aria-pressed="false">Mais votados</button>
    <button type="button" class="sort" data-sort="comments" aria-pressed="false">Mais comentados</button>
  </div>
  <div class="chips">${chips('stage', STAGES.filter((s) => projects.some((p) => p.stage === s)))}</div>
  <div class="chips">${chips('cat', cats)}</div>
  <div class="chips personal">
    <button type="button" class="chip" data-filter="following" aria-pressed="false">★ Seguindo <span id="following-count"></span></button>
    <button type="button" class="chip" data-filter="unseen" aria-pressed="false">Novidades desde sua última visita <span id="unseen-count"></span></button>
  </div>
</section>
<p id="result-count" class="result-count" aria-live="polite"></p>
<main id="list" class="list">
${projects.map(card).join('\n')}
</main>
<p id="empty" class="empty" hidden>Nada por aqui com esses filtros.</p>
${siteFooter(raw.fetchedAt)}
<script type="application/json" id="data">${payload}</script>
<script>${js}</script>`;

const index = layout({
  title: 'Vitrine MicroSaaS BR — projetos da comunidade r/MicroSaaSBR',
  description: `${projects.length} micro-SaaS brasileiros postados no r/MicroSaaSBR. Filtre por categoria e estágio, siga projetos e acompanhe as novidades.`,
  canonical: `${SITE_URL}/`,
  css,
  jsonLd: {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Projetos do r/MicroSaaSBR',
    itemListElement: projects.slice(0, 50).map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE_URL}/p/${slug(p.key)}/`, name: p.name })),
  },
  body: indexBody,
});

const about = layout({
  title: 'Sobre | Vitrine MicroSaaS BR',
  description: 'Como a Vitrine MicroSaaS BR funciona, como aparecer nela e como pedir remoção.',
  canonical: `${SITE_URL}/sobre/`,
  css,
  body: `${siteHeader()}
<main class="prose">
  <h1>Sobre a Vitrine</h1>
  <p>Uma vitrine feita pela e para a comunidade do <a href="https://www.reddit.com/r/MicroSaaSBR/">r/MicroSaaSBR</a>. Sem fins lucrativos, sem login, sem anúncios.</p>
  <h2>Como funciona</h2>
  <p>Os posts públicos do subreddit são lidos pela API oficial do Reddit. Todo post com link para um produto vira um projeto aqui; posts posteriores com o mesmo link entram como atualizações na linha do tempo. Categoria, estágio e receita são inferidos automaticamente do texto, então podem errar.</p>
  <p>Mostramos só o título e um trecho curto. O post completo, os votos e os comentários continuam no Reddit: o botão ▲ leva ao post original para você votar lá.</p>
  <h2>Como aparecer</h2>
  <p>Poste seu projeto no r/MicroSaaSBR com o link do produto. Ele aparece aqui na próxima atualização. Ao postar novidades, use o mesmo link para elas entrarem na linha do tempo. Mencione "MRR", "faturamento" ou "clientes pagantes" para o estágio ser detectado.</p>
  <h2>Acompanhar novidades</h2>
  <p>Clique em <b>Seguir</b> num projeto e use o filtro "Seguindo" (fica salvo só no seu navegador). Ou assine o <a href="/feed.xml">feed RSS</a>.</p>
  <h2 id="remover">Remover ou corrigir</h2>
  <p>É seu projeto e não quer ele aqui, ou algo está errado? Fale com ${esc(CONTACT)} no Reddit e removemos na próxima atualização. Apagar o post no Reddit também remove daqui.</p>
</main>
${siteFooter(raw.fetchedAt)}`,
});

const xmlEsc = (s) => String(s).replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]);
const rssItems = projects
  .flatMap((p) => p.updates.map((u, i) => ({ p, u, isLaunch: i === 0 })))
  .sort((a, b) => b.u.created - a.u.created)
  .slice(0, 60)
  .map(({ p, u, isLaunch }) => `  <item>
    <title>${xmlEsc(`${isLaunch ? 'Novo' : 'Atualização'}: ${p.name} — ${u.title}`)}</title>
    <link>${SITE_URL}/p/${slug(p.key)}/</link>
    <guid isPermaLink="false">reddit-${u.id}</guid>
    <pubDate>${new Date(u.created * 1000).toUTCString()}</pubDate>
    <description>${xmlEsc(`${p.stage}${p.categories.length ? ' · ' + p.categories.join(', ') : ''}. ${p.excerpt}`)}</description>
  </item>`)
  .join('\n');
const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
  <title>Vitrine MicroSaaS BR</title>
  <link>${SITE_URL}/</link>
  <description>Projetos novos e atualizações da comunidade r/MicroSaaSBR</description>
  <language>pt-BR</language>
${rssItems}
</channel></rss>
`;

const iso = (ts) => new Date(ts * 1000).toISOString().slice(0, 10);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE_URL}/</loc><lastmod>${iso(raw.fetchedAt / 1000)}</lastmod></url>
  <url><loc>${SITE_URL}/sobre/</loc></url>
${projects.map((p) => `  <url><loc>${SITE_URL}/p/${slug(p.key)}/</loc><lastmod>${iso(p.lastUpdate)}</lastmod></url>`).join('\n')}
</urlset>
`;

const files = {
  'index.html': index,
  'sobre/index.html': about,
  'feed.xml': rss,
  'sitemap.xml': sitemap,
  'robots.txt': `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`,
  'badge.svg': await read('src/badge.svg'),
  'favicon.svg': await read('src/favicon.svg'),
  '_headers': '/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n',
};
for (const p of projects) files[`p/${slug(p.key)}/index.html`] = projectPage(p, site);

const dist = new URL('dist/', root);
await rm(dist, { recursive: true, force: true });
for (const [name, content] of Object.entries(files)) {
  const target = new URL(name, dist);
  await mkdir(new URL('./', target), { recursive: true });
  await writeFile(target, content);
}

console.log(`built ${projects.length} projects (${totalPosts} posts), ${built.skipped} posts without a product link skipped, ${hidden.size} hidden${raw.sample ? ' [SAMPLE DATA]' : ''}`);
