// Health check: one GET per project site plus GitHub repo stats, appended to
// content/health.json. Run it regularly (e.g. weekly); the history is what
// lets the build tell "down today" from "dead".
import { readFile, writeFile } from 'node:fs/promises';
import { buildProjects } from './lib/extract.mjs';
import { classifyResponse } from './lib/health.mjs';

const root = new URL('../', import.meta.url);
const HEALTH = new URL('content/health.json', root);
const UA = 'VitrineMicroSaaSBR-healthcheck/0.1 (+https://github.com/nelitow/vitrine-microsaas-br)';
const KEEP = 60;

const posts = JSON.parse(await readFile(new URL('content/posts.json', root), 'utf8')).posts;
const health = JSON.parse(await readFile(HEALTH, 'utf8').catch(() => '{}'));
const { projects } = buildProjects(posts);
const now = Math.floor(Date.now() / 1000);

async function checkSite(url) {
  const started = Date.now();
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: AbortSignal.timeout(20000),
      headers: { 'User-Agent': UA, Accept: 'text/html,*/*' },
    });
    const body = (await res.text()).slice(0, 200_000);
    return {
      ...classifyResponse({ status: res.status, body }),
      status: res.status,
      ms: Date.now() - started,
      lastModified: res.headers.get('last-modified'),
    };
  } catch (e) {
    const error = `${e.name} ${e.message} ${e.cause?.code ?? ''} ${e.cause?.message ?? ''}`;
    return { ...classifyResponse({ error }), status: null, ms: Date.now() - started };
  }
}

async function checkRepo(repo, prev) {
  const headers = { 'User-Agent': UA, Accept: 'application/vnd.github+json' };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const res = await fetch(`https://api.github.com/repos/${repo}`, { headers, signal: AbortSignal.timeout(20000) });
  if (res.status === 404) return { name: repo, gone: true, goneSince: prev?.goneSince ?? now, at: now };
  if (!res.ok) return prev ?? null; // rate limited etc.: keep what we had
  const r = await res.json();
  return {
    name: repo,
    gone: false,
    archived: r.archived,
    stars: r.stargazers_count,
    pushedAt: Math.floor(Date.parse(r.pushed_at) / 1000),
    at: now,
  };
}

const results = await Promise.all(projects.map(async (p) => {
  const site = await checkSite(p.url);
  const entry = health[p.key] ?? { checks: [] };
  entry.checks = [...entry.checks, { at: now, ok: site.ok, kind: site.kind, status: site.status, ms: site.ms }].slice(-KEEP);
  if (site.lastModified) entry.lastModified = Math.floor(Date.parse(site.lastModified) / 1000) || entry.lastModified;
  if (p.repo) entry.repo = await checkRepo(p.repo, entry.repo);
  health[p.key] = entry;
  return { p, site, repo: entry.repo };
}));

await writeFile(HEALTH, JSON.stringify(health, null, 1) + '\n');

for (const { p, site, repo } of results.sort((a, b) => a.site.ok - b.site.ok)) {
  const repoInfo = repo ? ` · repo ${repo.gone ? 'GONE' : `★${repo.stars}${repo.archived ? ' archived' : ''}`}` : '';
  console.log(`${site.ok ? '✓' : '✗'} ${p.name.padEnd(22)} ${String(site.status ?? '-').padEnd(4)} ${site.kind.padEnd(8)} ${String(site.ms).padStart(5)}ms${repoInfo}`);
}
