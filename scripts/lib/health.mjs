// Classifies each project from its check history (content/health.json).
// A project is only declared dead after repeated failures over time, so one
// bad check (deploy in progress, flaky host) never buries anyone.

const DAY = 86400;
export const DEAD_AFTER_DAYS = 14;        // failing continuously this long = dead
export const DEAD_FAST_DAYS = 2;          // ...or this long if the failure is unambiguous
export const STALE_AFTER_DAYS = 180;      // no activity signal for this long = stale
export const SURVIVOR_AFTER_DAYS = 180;   // alive this long after launch = survivor

// Failures that rarely fix themselves: domain gone, parked/for sale, page gone.
const PERMANENT = new Set(['dns', 'parked', 'gone', 'repo-gone']);

export const STATUS = {
  ativo: { label: 'No ar', order: 0 },
  parado: { label: 'Parado', order: 1 },
  instavel: { label: 'Fora do ar', order: 2 },
  morto: { label: 'Morto', order: 3 },
  desconhecido: { label: 'Não verificado', order: 4 },
};

const PARKED = /domain (is )?for sale|buy this domain|this domain (name )?(is|may be) for sale|dom[ií]nio (est[aá] )?[àa] venda|compre este dom[ií]nio|sedoparking|parkingcrew|bodis\.com|hugedomains|afternic|dan\.com\/buy|domain parking|parked free|registro\.br\/dominio-expirado|DEPLOYMENT_NOT_FOUND|There isn't a GitHub Pages site here|no-such-app|Site not found · GitHub Pages|This deployment has been (disabled|paused)|Project not found|ERR_NGROK_\d+/i;

export function classifyResponse({ status, body = '', error }) {
  if (error) {
    if (/ENOTFOUND|EAI_AGAIN|ENODATA/.test(error)) return { ok: false, kind: 'dns' };
    if (/CERT|SSL|TLS|self.signed/i.test(error)) return { ok: false, kind: 'tls' };
    if (/timeout|aborted/i.test(error)) return { ok: false, kind: 'timeout' };
    return { ok: false, kind: 'network' };
  }
  if (PARKED.test(body)) return { ok: false, kind: 'parked' };
  if (status === 404 || status === 410) return { ok: false, kind: 'gone' };
  // Bot walls (Cloudflare, Vercel firewall) answer 403/429/503 to scripts while
  // the site works fine in a browser, so they don't count against a project.
  if ([401, 403, 429].includes(status)) return { ok: true, kind: 'blocked' };
  if (status >= 500) return { ok: false, kind: 'server' };
  if (status >= 400) return { ok: false, kind: 'http' };
  return { ok: true, kind: 'ok' };
}

export function assess(project, health, now = Date.now() / 1000) {
  const h = health?.[project.key];
  const checks = h?.checks ?? [];
  if (!checks.length) return { status: 'desconhecido', survivor: false };

  const last = checks[checks.length - 1];
  const repo = h.repo ?? null;
  let status;
  let diedAt = null;

  if (!last.ok || repo?.gone) {
    // Start of the current failure streak.
    let i = checks.length - 1;
    while (i > 0 && !checks[i - 1].ok) i--;
    const since = repo?.gone && last.ok ? repo.goneSince : checks[i].at;
    const streak = checks.slice(i);
    const days = (now - since) / DAY;
    const permanent = (repo?.gone) || streak.every((c) => PERMANENT.has(c.kind));
    const dead = streak.length >= 2 && (days >= DEAD_AFTER_DAYS || (permanent && days >= DEAD_FAST_DAYS));
    status = dead ? 'morto' : 'instavel';
    if (dead) diedAt = since;
  } else {
    const signals = [project.lastUpdate, repo && !repo.archived ? repo.pushedAt : null, h.lastModified].filter(Boolean);
    const lastActivity = Math.max(...signals);
    status = repo?.archived || (now - lastActivity) / DAY > STALE_AFTER_DAYS ? 'parado' : 'ativo';
  }

  const ageDays = ((diedAt ?? now) - project.firstSeen) / DAY;
  return {
    status,
    diedAt,
    ageDays: Math.round(ageDays),
    survivor: status !== 'morto' && status !== 'instavel' && ageDays >= SURVIVOR_AFTER_DAYS,
    lastCheck: last.at,
    lastKind: last.kind,
    stars: repo?.stars ?? null,
  };
}

// Survival by launch month: how many launched, how many are dead now.
export function cohorts(projects) {
  const rows = new Map();
  for (const p of projects) {
    const d = new Date(p.firstSeen * 1000);
    const k = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    const r = rows.get(k) ?? { month: k, launched: 0, ativo: 0, parado: 0, instavel: 0, morto: 0, desconhecido: 0 };
    r.launched++;
    r[p.health.status]++;
    rows.set(k, r);
  }
  return [...rows.values()].sort((a, b) => b.month.localeCompare(a.month));
}
