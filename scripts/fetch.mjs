// Pulls posts from r/MicroSaaSBR through Reddit's official OAuth API and merges
// them into data/posts.json. The cache accumulates across runs, so posts that
// fall off the 1000-item listing limit are kept.
import { readFile, writeFile, mkdir } from 'node:fs/promises';

const SUBREDDIT = 'MicroSaaSBR';
const CACHE = new URL('../data/posts.json', import.meta.url);
const { REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USERNAME, REDDIT_PASSWORD } = process.env;

if (!REDDIT_CLIENT_ID || !REDDIT_CLIENT_SECRET || !REDDIT_USERNAME) {
  console.error('Missing REDDIT_CLIENT_ID / REDDIT_CLIENT_SECRET / REDDIT_USERNAME in .env (see .env.example)');
  process.exit(1);
}

const UA = `script:vitrine-microsaas-br:0.1 (by /u/${REDDIT_USERNAME})`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getToken() {
  const res = await fetch('https://www.reddit.com/api/v1/access_token', {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${REDDIT_CLIENT_ID}:${REDDIT_CLIENT_SECRET}`).toString('base64'),
      'User-Agent': UA,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    // Script apps tied to an automated account log in as that account;
    // without a password we fall back to app-only auth.
    body: REDDIT_PASSWORD
      ? new URLSearchParams({ grant_type: 'password', username: REDDIT_USERNAME, password: REDDIT_PASSWORD }).toString()
      : 'grant_type=client_credentials',
  });
  if (!res.ok) throw new Error(`token request failed: ${res.status} ${await res.text()}`);
  return (await res.json()).access_token;
}

async function listing(token, path, maxPages) {
  const out = [];
  let after = null;
  for (let page = 0; page < maxPages; page++) {
    const url = new URL(`https://oauth.reddit.com/r/${SUBREDDIT}/${path}`);
    url.searchParams.set('limit', '100');
    url.searchParams.set('raw_json', '1');
    if (after) url.searchParams.set('after', after);
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}`, 'User-Agent': UA } });
    if (!res.ok) throw new Error(`${url} -> ${res.status}`);
    const remaining = Number(res.headers.get('x-ratelimit-remaining') ?? 100);
    const reset = Number(res.headers.get('x-ratelimit-reset') ?? 0);
    const body = await res.json();
    out.push(...body.data.children.map((c) => c.data));
    after = body.data.after;
    if (!after) break;
    await sleep(remaining < 5 ? (reset + 1) * 1000 : 700);
  }
  return out;
}

const pick = (p) => ({
  id: p.id,
  title: p.title,
  author: p.author,
  created_utc: p.created_utc,
  score: p.score,
  num_comments: p.num_comments,
  flair: p.link_flair_text || null,
  url: p.url,
  is_self: p.is_self,
  permalink: p.permalink,
  // selftext stays in the local cache only; the build publishes a short excerpt
  selftext: p.selftext || '',
  removed: Boolean(p.removed_by_category) || p.selftext === '[removed]' || p.selftext === '[deleted]',
});

let cache = {};
try {
  cache = JSON.parse(await readFile(CACHE, 'utf8')).posts ?? {};
} catch {}

const token = await getToken();
const fresh = [
  ...(await listing(token, 'new', 10)),
  ...(await listing(token, 'top?t=all', 10)),
];

let added = 0;
for (const p of fresh) {
  if (!cache[p.id]) added++;
  cache[p.id] = pick(p);
}

await mkdir(new URL('../data/', import.meta.url), { recursive: true });
await writeFile(CACHE, JSON.stringify({ fetchedAt: Date.now(), sample: false, posts: cache }, null, 1));
console.log(`fetched ${fresh.length} posts (${added} new), cache now ${Object.keys(cache).length}`);
