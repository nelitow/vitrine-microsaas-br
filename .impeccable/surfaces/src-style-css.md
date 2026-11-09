---
version: 1
slug: "src-style-css"
primary_target: "src/style.css"
related_targets: ["scripts/build.mjs","scripts/lib/render.mjs"]
---

# Surface: index (and shared shell for /p/, /sobre/, /sobrevivencia/)

Mode: Operate. Visitors scan, filter and open projects; a newcomer from Google has to understand any row in seconds.

## Direction contract

THESIS: The category standard (the canon), done straight. A text-first directory at the level of Hacker News and the YC company directory. It turns down the AI-showcase look: cream paper, serif display, pill chips, rounded shadow cards, emoji, hero metrics.

OWN-WORLD: White ground and near-black ink. A single green accent is used only for links, active filters and the vote arrow. System sans at four sizes; tabular numerals for every count. Projects are rows separated by hairlines, with no card containers. Filters are checkbox lists with counts in a left column. Status is written as words, and dead rows get a struck-through name and greyed text. Icons are inline SVG drawn with one stroke.

STORY: The visitor sees how many projects there are and that the list is the sub's memory. They scan rows of name, pitch and facts, narrow the list with the sidebar, then open a project or go vote on Reddit. The survival page tells who is alive and who died, in plain sentences and one table.

FIRST VIEWPORT: A thin header with the wordmark left and the nav right. Below it, one sentence of context with the counts inline (not a hero). The left column (220px) holds filters. The right column has search plus sort as text tabs and the result count, then the first rows right away. On desktop, about 8 rows fit in the first viewport. The vote count sits at the right edge of each row.

FORM: Canon (user chose the standing exit). References: Hacker News, YC company directory. Seed key 943657c7.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
