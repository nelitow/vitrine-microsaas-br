# Vitrine MicroSaaS BR

Static directory of the projects posted to r/MicroSaaSBR. It is built locally from Reddit's official API and deployed to Cloudflare Pages. There is no server, no database and no login.

## Run

```sh
cp .env.example .env      # fill in the Reddit "script" app credentials
npm run update            # fetch posts into data/posts.json, then build dist/
npm run deploy            # wrangler pages deploy dist
```

- `npm run sample` builds with fake data, so you can preview without credentials.
- `npm test` runs the extraction tests.
- `SITE_URL=https://seu-dominio npm run build` sets the URL used in canonical links, the sitemap and RSS.

The cache in `data/posts.json` grows with every fetch, so posts older than Reddit's 1000-item listing limit are kept. Full post bodies stay in that local cache; the site only publishes the title, a 220-character excerpt and a link to the original post.

## How posts become projects

- A post with an outbound product link becomes a project. Reddit, social, video and form links are ignored. Posts with no product link are skipped.
- Later posts with the same link (same domain, or the same repo or app id on shared hosts) are added to that project's timeline as updates.
- Stage (Ideia, MVP / Beta, Lançado, Com receita), revenue (R$) and categories are guessed with regexes in `scripts/lib/extract.mjs`.

To remove a project, add its key (for example `meuapp.com.br`) or a Reddit post id to `config/hidden.json` and rebuild.

## What's static, and what that means

- **Votes:** the ▲ button links to the original Reddit post. The vote count shown is Reddit's score, summed across all of the project's posts.
- **Follow** and **"new since your last visit"** are stored in each visitor's localStorage.
- **Updates:** `/feed.xml` is an RSS feed of new projects and updates.
- **SEO:** each project gets its own page at `/p/<slug>/`, with server-rendered HTML, JSON-LD, `sitemap.xml`, `robots.txt`, canonical and OG tags. There is also a "featured" badge makers can embed on their own sites.
