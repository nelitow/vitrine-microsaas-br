// Merges hand-entered posts (JSON array on stdin) into content/posts.json.
// Fields: title, author, date (YYYY-MM-DD), score, comments, text, and
// optionally permalink (reddit URL), url (product link), name, flair.
import { readFile, writeFile } from 'node:fs/promises';

const FILE = new URL('../content/posts.json', import.meta.url);
const db = JSON.parse(await readFile(FILE, 'utf8'));
const input = JSON.parse(await new Response(process.stdin).text());

for (const p of input) {
  const permalink = p.permalink
    ? new URL(p.permalink).pathname
    : `/r/MicroSaaSBR/search/?restrict_sr=1&q=${encodeURIComponent(p.title)}`;
  const id = p.permalink?.match(/comments\/(\w+)/)?.[1] ?? 'm-' + p.title.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').slice(0, 40);
  db.posts[id] = {
    id,
    title: p.title,
    author: p.author ?? null,
    created_utc: Math.floor(Date.parse(p.date + 'T12:00:00-03:00') / 1000),
    score: p.score ?? 0,
    num_comments: p.comments ?? 0,
    flair: p.flair ?? null,
    url: p.url ?? 'https://www.reddit.com' + permalink,
    is_self: !p.url,
    permalink,
    selftext: p.text ?? '',
    removed: false,
    ...(p.name && { name: p.name }),
  };
  console.log(`${db.posts[id] ? 'saved' : ''} ${id}`);
}
db.fetchedAt = Date.now();
await writeFile(FILE, JSON.stringify(db, null, 1) + '\n');
