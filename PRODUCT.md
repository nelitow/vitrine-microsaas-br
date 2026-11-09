# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
Primary: makers and lurkers of r/MicroSaaSBR (Brazilian indie/bootstrapped software builders) browsing what peers launched, following projects they care about, and checking which ones are still alive. Secondary: outsiders landing from Google or a shared link (potential customers, press, investors, devs who never open Reddit) who need enough context to understand a project in seconds.

## Product Purpose
A curated, public record of the products launched in r/MicroSaaSBR: what exists, what stage it reached, who made it, and whether it survived. Success means makers share their page and badge, community members return to see what's new and who died, and outsiders discover Brazilian micro-SaaS through search.

## Positioning
Not a launch platform or upvote contest: it is the subreddit's memory. Every entry traces back to a real community post, and the site tracks survival over time (alive, stale, down, dead, survivor) using automated checks, which no generic directory does.

## Operating Context
Static site built locally (Node, no dependencies) and deployed to Cloudflare Pages. Content is hand-curated today (posts pasted in and stored in content/posts.json) because Reddit's public API is closing; health checks run via `npm run check` and accumulate history. Voting and discussion stay on Reddit; follow state lives in the visitor's browser; RSS for updates.

## Capabilities and Constraints
- Index with search, sort (Em alta, Novos, Atualizados, Mais votados, Mais comentados), filters by stage, category, health status, following, unseen.
- Per-project page with timeline of posts and embeddable badge; About page; Survival page with cohorts and graveyard; RSS; sitemap.
- Stage, revenue and category are inferred heuristically and can be wrong; the site must say so.
- Only titles, short self-written excerpts and links are published; never full post bodies or comments.
- Non-commercial; makers can opt out.
- Name is open: "Vitrine MicroSaaS BR" is the working name and may be replaced during redesign (user decides before shipping).

## Brand Commitments
- Language: Brazilian Portuguese.
- Voice: dry, witty editorial, like a good Brazilian tech newsletter. Short, opinionated, a bit of humor (the graveyard is fair game), no hype, no startup clichés.
- Must not read as AI-generated; the community openly mocks "visual de IA" and AI slop.

## Evidence on Hand
Real project entries in content/posts.json (about 20 projects, November 2026 posts plus a few from earlier in the year) and real health-check history in content/health.json. No testimonials, partnerships, traffic numbers or endorsements exist; do not invent any.

## Product Principles
1. The community's work is the hero; the site is the frame.
2. Every claim traces to a source (a post, a check); inferred labels are labeled as such.
3. Honest about death: survival data is shown plainly, with humor but without mockery of individual makers.
4. Fast and readable for someone with zero context.
