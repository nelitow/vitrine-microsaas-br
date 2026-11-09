// Turns raw subreddit posts into project cards. Heuristic only: posts with an
// outbound product link become projects, and later posts linking the same
// product are attached as updates.

const IGNORED_HOSTS = [
  'reddit.com', 'redd.it', 'imgur.com', 'youtube.com', 'youtu.be', 'twitter.com', 'x.com',
  'instagram.com', 'linkedin.com', 'facebook.com', 'wa.me', 'whatsapp.com', 't.me', 'discord.gg',
  'discord.com', 'tiktok.com', 'forms.gle', 'docs.google.com', 'drive.google.com', 'bit.ly',
  'giphy.com', 'loom.com', 'calendly.com',
];

// Hosts where many unrelated products live, so the path identifies the project.
const SHARED_HOSTS = {
  'github.com': 2, 'gitlab.com': 2, 'apps.apple.com': 3, 'chromewebstore.google.com': 3,
  'chrome.google.com': 4, 'producthunt.com': 2, 'gumroad.com': 1, 'notion.site': 1,
};

export const CATEGORIES = {
  // "ia" is also a common Portuguese verb, so the acronym only counts in caps
  'IA': { test: (t) => /\b(IA|AI)\b/.test(t) || /\b(gpt|chatgpt|llm|openai|claude|gemini|intelig[eê]ncia artificial)/i.test(t) },
  'Finanças': /\b(finan[cç]|pix|nota fiscal|notas fiscais|nfs?-?e|contab|fatura|cobran[cç]a|boleto|investiment|or[cç]amento)/i,
  'Marketing': /\b(marketing|seo|leads?|an[uú]ncio|ads\b|tr[aá]fego|copy|redes sociais|newsletter)/i,
  'Vendas e CRM': /\b(crm|vendas|vendedor|whatsapp|atendimento|chatbot|funil)/i,
  'Produtividade': /\b(produtividade|tarefas?|agenda|agendamento|organiz|calend[aá]rio|gest[aã]o de projetos)/i,
  'Dev tools': /\b(api|devs?|desenvolvedor|deploy|hospedagem|vps|servidor(es)?|c[oó]digo|programa[cç][aã]o|no-?code|low-?code|saas boilerplate)/i,
  'Saúde': /\b(sa[uú]de|cl[ií]nica|psic[oó]log|nutri|m[eé]dic|academia|fitness|treino|terapeut)/i,
  'Educação': /\b(educa[cç]|curso|estud|alunos?|professor|concurso|enem|escola|aula)/i,
  'E-commerce': /\b(e-?commerce|loja|shopify|nuvemshop|marketplace|mercado livre|dropshipping)/i,
  'Jurídico': /\b(advogad|jur[ií]dic|contrato|lgpd|processo judicial)/i,
  'RH': /\b(rh|recrutamento|vagas? de emprego|curr[ií]culo|contrata[cç][aã]o|ponto eletr[oô]nico)/i,
  'Jogos': /\b(jogo|game|clicker|gamifica)/i,
  'Esportes': /\b(futebol|rebaixamento|campeonato|brasileir[aã]o|esportes?|apostas?)/i,
  'Imobiliário': /\b(imobili[aá]ri|im[oó]ve|aluguel|alugar|onde morar|condom[ií]nio|corretor)/i,
};

export const STAGES = ['Ideia', 'MVP / Beta', 'Lançado', 'Com receita'];

const MONEY = /R\$\s?\d[\d.,]*\s?(?:k|mil)?/i;

export function detectStage(text) {
  if (/\bmrr\b|faturamento|faturando|clientes? pagantes?|primeir[ao]s? (vendas?|clientes? pagantes?)|assinantes? pagantes?|receita (entrando|recorrente)|j[aá] (tem|temos) receita/i.test(text)) return 'Com receita';
  if (/\b(lancei|lan[cç]amos|lan[cç]ado|lan[cç]ou|acabei de lan[cç]ar|est[aá] no ar|j[aá] est[aá] online|saiu do forno)\b/i.test(text)) return 'Lançado';
  if (/\b(mvp|beta|prot[oó]tipo|validando|valida[cç][aã]o|early access|lista de espera|waitlist|em desenvolvimento|rodando (apenas|s[oó]) (na|em) minha m[aá]quina)\b/i.test(text)) return 'MVP / Beta';
  if (/\b(ideia|pensando em criar|vale a pena criar|validar a ideia)\b/i.test(text)) return 'Ideia';
  return 'Lançado';
}

export function detectRevenue(text) {
  const m = text.match(new RegExp(`(?:mrr|faturamento|faturando|receita)[^.\\n]{0,40}?(${MONEY.source})|(${MONEY.source})[^.\\n]{0,20}?(?:mrr|/\\s?m[eê]s|por m[eê]s|mensa)`, 'i'));
  return m ? (m[1] || m[2]).replace(/\s+/g, ' ').trim() : null;
}

export function detectCategories(text) {
  return Object.entries(CATEGORIES).filter(([, re]) => re.test(text)).map(([k]) => k).slice(0, 3);
}

function hostMatches(host, list) {
  return list.some((h) => host === h || host.endsWith('.' + h));
}

export function productKey(rawUrl) {
  let u;
  try { u = new URL(rawUrl); } catch { return null; }
  if (!/^https?:$/.test(u.protocol)) return null;
  const host = u.hostname.toLowerCase().replace(/^www\./, '');
  if (hostMatches(host, IGNORED_HOSTS)) return null;
  if (u.hostname === 'play.google.com') {
    const id = u.searchParams.get('id');
    return id ? `play.google.com/${id}` : null;
  }
  const segs = SHARED_HOSTS[host];
  if (segs) {
    const parts = u.pathname.split('/').filter(Boolean).slice(0, segs);
    return parts.length ? `${host}/${parts.join('/')}`.toLowerCase() : null;
  }
  return host;
}

const URL_RE = /https?:\/\/[^\s)\]>"'<]+/g;

export function findProductLink(post) {
  const candidates = [];
  if (!post.is_self && post.url) candidates.push(post.url);
  candidates.push(...(post.selftext.match(URL_RE) ?? []));
  const links = candidates
    .map((c) => c.replace(/[.,;:!?*]+$/, ''))
    .map((url) => ({ url, key: productKey(url) }))
    .filter((l) => l.key);
  // A product's own site beats its GitHub/app-store page when both are linked.
  return links.find((l) => !l.key.includes('/')) ?? links[0] ?? null;
}

// "owner/repo" of the first GitHub repository linked, used for health checks.
export function findRepo(text) {
  const m = text.match(/github\.com\/([\w.-]+)\/([\w.-]+)/i);
  return m ? `${m[1]}/${m[2].replace(/\.git$/, '')}`.toLowerCase() : null;
}

export function nameFromKey(key) {
  if (key.includes('/')) {
    const last = key.split('/').pop();
    return prettify(last.split('.').pop());
  }
  const labels = key.split('.');
  const generic = new Set(['com', 'br', 'net', 'org', 'io', 'app', 'ai', 'co', 'dev', 'site', 'online', 'tech', 'vercel', 'netlify', 'pages', 'web', 'lovable', 'bolt', 'replit', 'onrender', 'herokuapp', 'framer', 'webflow', 'carrd', 'bubbleapps', 'wixsite', 'github']);
  const meaningful = labels.filter((l) => !generic.has(l));
  return prettify(meaningful[0] ?? labels[0]);
}

function prettify(s) {
  return s.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function excerpt(md, max = 220) {
  const text = md
    .replace(URL_RE, '')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`~|]+/g, ' ')
    .replace(/&amp;/g, '&').replace(/&#x200B;/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*,\s*:\s*/g, ': ')
    .replace(/\s+([,:;])(?=\s)/g, '$1')
    .trim()
    .replace(/(\s+em)?\s*:?$/i, '');
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(' ')).replace(/[,.;:\s-]+$/, '') + '…';
}

export function buildProjects(posts) {
  const byKey = new Map();
  let skipped = 0;
  const sorted = Object.values(posts)
    .filter((p) => !p.removed && p.author !== '[deleted]')
    .sort((a, b) => a.created_utc - b.created_utc);

  for (const p of sorted) {
    const link = findProductLink(p);
    if (!link) { skipped++; continue; }
    const text = `${p.title}\n${p.selftext}`;
    const entry = {
      id: p.id,
      title: p.title,
      permalink: 'https://www.reddit.com' + p.permalink,
      created: p.created_utc,
      score: p.score,
      comments: p.num_comments,
      flair: p.flair,
      author: p.author,
      stage: detectStage(text),
      revenue: detectRevenue(text),
      categories: detectCategories(text),
      excerpt: excerpt(p.selftext),
      repo: findRepo(`${p.url ?? ''}\n${p.selftext}`),
    };
    const proj = byKey.get(link.key);
    if (proj) {
      proj.posts.push(entry);
    } else {
      byKey.set(link.key, { key: link.key, url: link.url, name: p.name || nameFromKey(link.key), posts: [entry] });
    }
  }

  const projects = [...byKey.values()].map((proj) => {
    const first = proj.posts[0];
    const latest = proj.posts[proj.posts.length - 1];
    const stageRank = Math.max(...proj.posts.map((e) => STAGES.indexOf(e.stage)));
    return {
      key: proj.key,
      name: proj.name,
      url: proj.url,
      domain: proj.key,
      pitch: first.title,
      excerpt: first.excerpt || latest.excerpt,
      author: first.author,
      stage: STAGES[stageRank],
      revenue: [...proj.posts].reverse().find((e) => e.revenue)?.revenue ?? null,
      categories: [...new Set(proj.posts.flatMap((e) => e.categories))].slice(0, 3),
      flairs: [...new Set(proj.posts.map((e) => e.flair).filter(Boolean))],
      score: proj.posts.reduce((s, e) => s + e.score, 0),
      comments: proj.posts.reduce((s, e) => s + e.comments, 0),
      firstSeen: first.created,
      lastUpdate: latest.created,
      latestPermalink: latest.permalink,
      repo: [...proj.posts].reverse().find((e) => e.repo)?.repo ?? null,
      updates: proj.posts.map(({ id, title, permalink, created, score, comments }) => ({ id, title, permalink, created, score, comments })),
    };
  });

  return { projects, skipped };
}
