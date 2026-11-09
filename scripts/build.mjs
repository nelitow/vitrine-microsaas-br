// data/posts.json -> dist/ (fully static: index, one page per project, about,
// RSS, sitemap, badge). Deploy the dist/ folder to Cloudflare Pages.
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { buildProjects, STAGES } from './lib/extract.mjs';
import { row, esc, fmtDate, layout, projectPage, siteFooter, siteHeader, slug, SITE_NAME } from './lib/render.mjs';
import { hotness } from '../src/rank.mjs';
import { assess, cohorts, STATUS, DEAD_AFTER_DAYS, STALE_AFTER_DAYS, SURVIVOR_AFTER_DAYS } from './lib/health.mjs';

const root = new URL('../', import.meta.url);
const SITE_URL = (process.env.SITE_URL || 'https://vitrine-microsaas-br.pages.dev').replace(/\/$/, '');
const CONTACT = process.env.REDDIT_USERNAME ? `u/${process.env.REDDIT_USERNAME}` : 'os moderadores do r/MicroSaaSBR';

const read = (f) => readFile(new URL(f, root), 'utf8');

// content/posts.json holds hand-curated posts (committed); data/posts.json is
// the API cache or sample data (local only). Both use the same post shape.
const loadPosts = (f) => read(f).then(JSON.parse).catch(() => null);
const manual = await loadPosts('content/posts.json');
let cached = await loadPosts('data/posts.json');
if (cached?.sample && !process.env.SAMPLE) cached = null; // never ship fake data by accident
if (!manual && !cached) {
  console.error('No posts. Add some to content/posts.json, run `npm run fetch`, or `npm run sample`.');
  process.exit(1);
}
const raw = {
  fetchedAt: Math.max(manual?.fetchedAt ?? 0, cached?.fetchedAt ?? 0),
  sample: Boolean(cached?.sample),
  posts: { ...cached?.posts, ...manual?.posts },
};
// Makers can ask to be removed; list project keys or reddit post ids here.
const hidden = new Set(JSON.parse(await read('config/hidden.json').catch(() => '[]')));

const built = buildProjects(raw.posts);
const now = Date.now() / 1000;
const healthDb = JSON.parse(await read('content/health.json').catch(() => '{}'));
const projects = built.projects
  .filter((p) => !hidden.has(p.key) && !p.updates.some((u) => hidden.has(u.id)))
  .map((p) => {
    const health = assess(p, healthDb, now);
    return { ...p, health, status: health.status };
  })
  .sort((a, b) => hotness(b, now) - hotness(a, now));

const [css, js] = await Promise.all([read('src/style.css'), read('src/app.js'), read('src/rank.mjs')])
  .then(([css, app, rank]) => [css, rank.replace(/^export /gm, '') + '\n' + app]);
const site = { url: SITE_URL, css, js, fetchedAt: raw.fetchedAt };

const totalPosts = projects.reduce((s, p) => s + p.updates.length, 0);


const overrides = JSON.parse(await read('content/projects.json').catch(() => '{}'));
for (const p of projects) {
  const o = overrides[p.key] ?? {};
  p.tagline = o.tagline ?? p.pitch;
  if (o.categories) p.categories = o.categories;
}
const tally = (list) => [...list.reduce((m, v) => m.set(v, (m.get(v) ?? 0) + 1), new Map())].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'pt-BR'));
const stageCounts = STAGES.map((s) => [s, projects.filter((p) => p.stage === s).length]).filter(([, n]) => n);
const catCounts = tally(projects.flatMap((p) => p.categories));
const statusCounts = Object.keys(STATUS).map((k) => [k, projects.filter((p) => p.status === k).length]).filter(([, n]) => n);

const payload = JSON.stringify({
  projects: projects.map(({ key, name, tagline, excerpt, author, domain, stage, categories, score, comments, firstSeen, lastUpdate, revenue, status }) =>
    ({ key, name, pitch: tagline, excerpt, author, domain, stage, categories, score, comments, firstSeen, lastUpdate, revenue, status })),
}).replace(/</g, '\\u003c');

const group = (title, name, items, label = (v) => v) => `<fieldset class="facet">
    <legend>${title}</legend>
    ${items.map(([v, n]) => `<label><input type="checkbox" data-filter="${name}" value="${esc(v)}"> <span>${esc(label(v))}</span> <span class="n">${n}</span></label>`).join('\n    ')}
  </fieldset>`;

const indexBody = `${siteHeader('/')}
<div class="wrap page">
  <p class="intro"><b>${projects.length} produtos</b> lançados no <a href="https://www.reddit.com/r/MicroSaaSBR/">r/MicroSaaSBR</a>, com estágio, receita declarada e se ainda estão no ar. Voto e conversa continuam no Reddit.</p>
  <div class="layout">
    <details class="filters" id="filters">
      <summary>Filtros <span id="filter-count"></span></summary>
      <div class="filters-in">
        <fieldset class="facet">
          <legend>Seu navegador</legend>
          <label><input type="checkbox" data-filter="following"> <span>Seguindo</span> <span class="n" id="following-count">0</span></label>
          <label><input type="checkbox" data-filter="unseen"> <span>Novos para você</span> <span class="n" id="unseen-count">0</span></label>
        </fieldset>
        ${group('Estágio', 'stage', stageCounts)}
        ${group('Situação', 'status', statusCounts, (k) => STATUS[k].label)}
        ${group('Categoria', 'cat', catCounts)}
        <button type="button" class="clear" id="clear" hidden>Limpar filtros</button>
      </div>
    </details>
    <section class="results" aria-label="Projetos">
      <div class="toolbar">
        <input type="search" id="q" placeholder="Buscar por nome, assunto ou maker" autocomplete="off" aria-label="Buscar projetos">
        <div class="sorts" role="group" aria-label="Ordenar">
          <button type="button" class="sort" data-sort="hot" aria-pressed="true">Em alta</button>
          <button type="button" class="sort" data-sort="new" aria-pressed="false">Recentes</button>
          <button type="button" class="sort" data-sort="top" aria-pressed="false">Mais votados</button>
        </div>
      </div>
      <p id="result-count" class="result-count" aria-live="polite"></p>
      <div id="list" class="list">
${projects.map(row).join('\n')}
      </div>
      <p id="empty" class="empty" hidden>Nenhum projeto com esses filtros. <button type="button" class="linkish" data-clear>Limpar filtros</button></p>
    </section>
  </div>
</div>
${siteFooter(raw.fetchedAt)}
<script type="application/json" id="data">${payload}</script>
<script>${js}</script>`;

const index = layout({
  title: `${SITE_NAME}: os produtos do r/MicroSaaSBR`,
  description: `${projects.length} micro-SaaS brasileiros lançados no r/MicroSaaSBR, com estágio, receita declarada e quem continua no ar.`,
  canonical: `${SITE_URL}/`,
  css,
  jsonLd: {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Produtos do r/MicroSaaSBR',
    itemListElement: projects.slice(0, 50).map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE_URL}/p/${slug(p.key)}/`, name: p.name })),
  },
  body: indexBody,
});

const about = layout({
  title: `Sobre | ${SITE_NAME}`,
  description: `De onde vêm os projetos da ${SITE_NAME}, como entrar e como pedir remoção.`,
  canonical: `${SITE_URL}/sobre/`,
  css,
  body: `${siteHeader('/sobre/')}
<main class="wrap page prose">
  <h1>Sobre</h1>
  <p>O r/MicroSaaSBR lança produto toda semana, e em um mês o post já sumiu do feed. Esta página guarda o que foi lançado, em que pé está e se continua de pé.</p>
  <h2>De onde vêm os dados</h2>
  <p>Cada projeto é um post do sub com link para um produto. Posts seguintes com o mesmo link viram a linha do tempo do projeto. A seleção e os resumos são feitos à mão: aqui não tem cópia dos posts nem dos comentários, só o título, um resumo curto e o link para o original.</p>
  <p>Estágio, receita e categoria saem do texto dos posts e podem estar errados. Receita é sempre a declarada pelo maker; ninguém audita.</p>
  <h2>Quem está no ar</h2>
  <p>Um robô visita o site de cada projeto de tempos em tempos e, quando há repositório no GitHub, confere commits e estrelas. As regras estão em <a href="/sobrevivencia/#regras">Quem sobreviveu</a>.</p>
  <h2>Como entrar</h2>
  <p>Poste o projeto no r/MicroSaaSBR com o link do produto. Para atualizações entrarem na linha do tempo, use o mesmo link. Se o post fala de MRR, faturamento ou clientes pagantes, o estágio vira "Com receita".</p>
  <h2>Acompanhar</h2>
  <p>"Seguir" guarda o projeto só neste navegador; o filtro "Seguindo" mostra os seus. Para receber tudo, use o <a href="/feed.xml">RSS</a>.</p>
  <h2 id="remover">Tirar ou corrigir</h2>
  <p>Se o projeto é seu e você não quer ele aqui, ou se algo está errado, fale com ${esc(CONTACT)} no Reddit. Apagar o post no Reddit também tira o projeto daqui na próxima atualização.</p>
</main>
${siteFooter(raw.fetchedAt)}`,
});

const count = (st) => projects.filter((p) => p.status === st).length;
const checked = projects.filter((p) => p.status !== 'desconhecido');
const dead = projects.filter((p) => p.status === 'morto').sort((a, b) => b.health.diedAt - a.health.diedAt);
const survivors = projects.filter((p) => p.health.survivor).sort((a, b) => a.firstSeen - b.firstSeen);
const pct = (n, d) => (d ? Math.round((n / d) * 100) + '%' : '–');
const months = (days) => (days < 45 ? `${days} dias` : `${Math.round(days / 30)} meses`);
const fmtMonth = (k) => new Date(k + '-15').toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).replace(/\.| de/g, '');
const ORDER = ['ativo', 'parado', 'instavel', 'morto', 'desconhecido'];
const bar = (r, total) => `<div class="bar" role="img" aria-label="${ORDER.filter((k) => r[k]).map((k) => `${STATUS[k].label}: ${r[k]}`).join(', ')}">${
  ORDER.map((k) => (r[k] ? `<i class="b-${k}" style="width:${(r[k] / total) * 100}%"></i>` : '')).join('')}</div>`;
const lastCheck = Math.max(0, ...projects.map((p) => p.health.lastCheck ?? 0));
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
const all = Object.fromEntries(ORDER.map((k) => [k, count(k)]));
const sentence = checked.length
  ? `Dos ${checked.length} projetos verificados, ${plural(all.ativo, 'está no ar e ativo', 'estão no ar e ativos')}${[all.parado && plural(all.parado, 'está parado', 'estão parados'), all.instavel && plural(all.instavel, 'está fora do ar', 'estão fora do ar')].filter(Boolean).map((x) => ', ' + x).join('')} e ${all.morto === 0 ? 'nenhum morreu' : plural(all.morto, 'morreu', 'morreram')}.`
  : 'Nenhum projeto verificado ainda.';
const graveRow = (p) => `<li><a href="/p/${slug(p.key)}/">${esc(p.name)}</a> <span class="muted">${esc(p.domain)}</span><br><span class="muted">${fmtDate(p.firstSeen)} a ${fmtDate(p.health.diedAt)}, viveu ${months(p.health.ageDays)}</span></li>`;

const survival = layout({
  title: `Quantos micro-SaaS brasileiros sobrevivem | ${SITE_NAME}`,
  description: `Quantos projetos do r/MicroSaaSBR continuam no ar: ${all.ativo} ativos, ${all.parado} parados e ${all.morto} mortos de ${projects.length}.`,
  canonical: `${SITE_URL}/sobrevivencia/`,
  css,
  body: `${siteHeader('/sobrevivencia/')}
<main class="wrap page prose prose-wide">
  <h1>Quem sobreviveu</h1>
  <p class="lede">${sentence}</p>
  <p class="muted">Taxa de sobrevivência: ${pct(checked.length - all.morto, checked.length)}.${lastCheck ? ` Última verificação em ${fmtDate(lastCheck)}.` : ''} Os números só ficam interessantes com o tempo: um projeto precisa de semanas fora do ar para ser declarado morto.</p>

  <h2>Por mês de lançamento</h2>
  <table class="cohorts">
    <thead><tr><th scope="col">Lançamento</th><th scope="col" class="num">Projetos</th><th scope="col" class="num">No ar</th><th scope="col" class="num">Mortos</th><th scope="col" class="num">Vivos</th><th scope="col"><span class="sr-only">Distribuição</span></th></tr></thead>
    <tbody>${cohorts(projects).map((r) => `<tr><td>${fmtMonth(r.month)}</td><td class="num">${r.launched}</td><td class="num">${r.ativo + r.parado}</td><td class="num">${r.morto}</td><td class="num">${pct(r.launched - r.morto - r.desconhecido, r.launched - r.desconhecido)}</td><td class="bar-cell">${bar(r, r.launched)}</td></tr>`).join('')}</tbody>
  </table>

  <div class="two-col">
    <section>
      <h2>Cemitério</h2>
      ${dead.length ? `<ul class="plain">${dead.map(graveRow).join('')}</ul>` : '<p>Vazio. Por enquanto.</p>'}
    </section>
    <section>
      <h2>Há mais de 6 meses no ar</h2>
      ${survivors.length ? `<ul class="plain">${survivors.map((p) => `<li><a href="/p/${slug(p.key)}/">${esc(p.name)}</a> <span class="muted">desde ${fmtDate(p.firstSeen)}</span></li>`).join('')}</ul>` : '<p>Ninguém chegou lá ainda.</p>'}
    </section>
  </div>

  <h2 id="regras">Como cada projeto é classificado</h2>
  <dl class="rules">
    <dt>No ar</dt><dd>O site respondeu normalmente na última verificação.</dd>
    <dt>Parado</dt><dd>No ar, mas sem sinal de vida há mais de ${STALE_AFTER_DAYS / 30} meses: nenhum post no sub, commit no GitHub ou mudança no site. Repositório arquivado também conta.</dd>
    <dt>Fora do ar</dt><dd>Falhou na última verificação. Pode ser só um deploy.</dd>
    <dt>Morto</dt><dd>Falhou em verificações seguidas por ${DEAD_AFTER_DAYS} dias. Domínio expirado ou à venda, página removida ou repositório apagado contam depois de 2 dias.</dd>
    <dt>Sobrevivente</dt><dd>Continua no ar ${SURVIVOR_AFTER_DAYS / 30} meses depois do lançamento.</dd>
  </dl>
  <p class="muted">Site que bloqueia robô conta como no ar. Viu um erro? <a href="/sobre/#remover">Avise</a>.</p>
</main>
${siteFooter(raw.fetchedAt)}`,
});

const xmlEsc = (s) => String(s).replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]);
const rssItems = projects
  .flatMap((p) => p.updates.map((u, i) => ({ p, u, isLaunch: i === 0 })))
  .sort((a, b) => b.u.created - a.u.created)
  .slice(0, 60)
  .map(({ p, u, isLaunch }) => `  <item>
    <title>${xmlEsc(`${isLaunch ? 'Novo' : 'Atualização'}: ${p.name}, ${u.title}`)}</title>
    <link>${SITE_URL}/p/${slug(p.key)}/</link>
    <guid isPermaLink="false">reddit-${u.id}</guid>
    <pubDate>${new Date(u.created * 1000).toUTCString()}</pubDate>
    <description>${xmlEsc(`${p.stage}${p.categories.length ? ' · ' + p.categories.join(', ') : ''}. ${p.tagline}`)}</description>
  </item>`)
  .join('\n');
const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
  <title>${SITE_NAME}</title>
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
  <url><loc>${SITE_URL}/sobrevivencia/</loc></url>
${projects.map((p) => `  <url><loc>${SITE_URL}/p/${slug(p.key)}/</loc><lastmod>${iso(p.lastUpdate)}</lastmod></url>`).join('\n')}
</urlset>
`;

const files = {
  'index.html': index,
  'sobre/index.html': about,
  'sobrevivencia/index.html': survival,
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
