---
name: Vitrine MicroSaaS BR
description: The public memory of r/MicroSaaSBR, a text-first directory of what the community launched and whether it survived.
colors:
  paper: "#fff"
  paper-recess: "#f6f6f4"
  ink: "#161616"
  ink-soft: "#4d4d4b"
  ink-faint: "#6e6e6b"
  hairline: "#e4e4e0"
  hairline-strong: "#cfcfca"
  ledger-green: "#0a7a42"
  stale-amber: "#8a5a00"
  down-red: "#b42318"
typography:
  headline:
    fontFamily: "system-ui, -apple-system, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif"
    fontSize: "32px"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  title:
    fontFamily: "system-ui, -apple-system, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif"
    fontSize: "17px"
    fontWeight: 650
    lineHeight: 1.3
    letterSpacing: "-0.005em"
  lede:
    fontFamily: "system-ui, -apple-system, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.45
  body:
    fontFamily: "system-ui, -apple-system, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "system-ui, -apple-system, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "\"tnum\""
  code:
    fontFamily: "ui-monospace, \"SF Mono\", Menlo, Consolas, monospace"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  hair: "2px"
  control: "6px"
spacing:
  gutter: "24px"
  gutter-narrow: "16px"
  column-gap: "48px"
  container: "1120px"
  filter-column: "200px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 14px"
    height: "36px"
  button-primary-hover:
    backgroundColor: "{colors.ledger-green}"
    textColor: "{colors.paper}"
  vote-box:
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "6px 0 5px"
    width: "48px"
  vote-box-hover:
    textColor: "{colors.ledger-green}"
  search-field:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "36px"
  sort-tab:
    textColor: "{colors.ink-faint}"
    typography: "{typography.body}"
    padding: "4px 0"
  sort-tab-active:
    textColor: "{colors.ink}"
  filter-option:
    textColor: "{colors.ink-soft}"
    typography: "{typography.body}"
    padding: "3px 0"
  filter-option-checked:
    textColor: "{colors.ledger-green}"
  project-row-name:
    textColor: "{colors.ink}"
    typography: "{typography.title}"
  project-row-meta:
    textColor: "{colors.ink-faint}"
    typography: "{typography.label}"
---

# Design System: Vitrine MicroSaaS BR

## Overview

**Creative North Star: "The Ledger"**

The site is a record, not a showcase. It works in the category standard set by Hacker News and the YC company directory: white paper, near-black ink, one green, hairline rules, and rows of text you can scan in seconds. The community's projects are the content. The frame stays out of the way, and its only voice is the dry Portuguese copy.

Density is high and calm. Projects are rows divided by hairlines, not cards. Filters are plain checkbox lists with tabular counts. Sorting uses text tabs. Status is written out in words and coloured only when it means trouble. Dead projects stay in the list with a struck-through name and greyed text, because the site is honest about death. Depth comes only from rules and type weight.

The world was chosen against the AI-showcase look: cream paper, serif display type, pill chips, rounded shadowed cards, emoji and hero metrics.

**Key Characteristics:**
- White ground, near-black ink, one green accent.
- System sans at four sizes (13 / 15 / 17 / 32px), with tabular numerals on every count.
- Rows and hairlines instead of containers; flat, with no drop shadows.
- Status in words; death shown by strikethrough and grey, not by a badge.
- UI icons are inline SVG drawn with a single stroke.

## Colors

A near-monochrome ink-on-paper palette with one working green and two warning hues kept for status.

### Primary
- **Ledger Green** (ledger-green): The one accent. At rest it marks links in content prose, the checked filter label, the active sort tab's underline, the follow button once pressed, the clear-filters link-button and the vote arrow. It is also the interaction colour: focus rings, text selection, caret, hover on the vote box, row names and meta links, and the primary button's hover fill. It fills the wordmark's square and the "alive" segment of the survival bar.

### Tertiary
- **Stale Amber** (stale-amber): Text colour for the "parado" (stale) status word only.
- **Down Red** (down-red): The "fora do ar" (down) status word, plus its segment in the survival bar.

### Neutral
- **Paper** (paper): Page ground and the inverted text on the primary button.
- **Paper Recess** (paper-recess): Only the read-only embed-code field on the project page.
- **Ink** (ink): Body text, project names, pitches, nav and footer link names, emphasised facts (stage, revenue), the "morto" (dead) status, the toolbar's bottom rule, and the cohort table's header rule.
- **Ink Soft** (ink-soft): Secondary prose: the intro, the project pitch, unchecked filter labels, inactive nav links.
- **Ink Faint** (ink-faint): Meta lines, counts, dates, breadcrumbs, inactive sort tabs, and dead-row text.
- **Hairline** (hairline): Row dividers, header and footer rules, definition-list rules.
- **Hairline Strong** (hairline-strong): Control strokes (search field, vote box), separators, the "unknown" bar segment.

### Dark scheme (present, pending approval)
A `prefers-color-scheme: dark` override of every neutral, the accent and both status hues ships in the stylesheet (values in `.impeccable/design.json`). The user has not approved it yet, so it is not a settled commitment. The light values above are normative.

### Named Rules
**The One Green Rule.** Green means "this is a link, this is selected, or you are touching it". The wordmark and the alive bar segment are its only resting fills. Everything else is ink. Don't introduce a second accent.

**The Words-First Status Rule.** Health is written as a word ("parado", "fora do ar", "morto", "sobrevivente"). Colour backs up the word and never replaces it. Only the stale and down states get a hue; dead and survivor stay ink, in bold.

## Typography

**Body Font:** System UI sans (system-ui, -apple-system, Segoe UI, Roboto, Helvetica Neue, Arial)
**Code Font:** System monospace (ui-monospace, SF Mono, Menlo, Consolas), used only for the badge embed snippet.

**Character:** One family, the reader's own system face, so the site reads like a tool and not a brochure. Hierarchy comes from size and weight steps (400 / 600 / 650 / 700), never from a second family.

### Hierarchy
- **Headline** (700, 32px, 1.15, -0.02em): The page title on project, about and survival pages. It stays 32px at every width. The system has no display tier by design.
- **Title** (650, 17px, 1.3): Project names in rows and section headings (h2).
- **Lede** (400, 17px, 1.45): The project pitch under its h1 and the survival page lede, balanced or pretty-wrapped, about 46ch on project pages.
- **Body** (400, 15px, 1.5): Default text, pitches, filter options, nav, tables. Prose runs to about 68ch.
- **Label** (400–650, 13px, tabular numerals): Meta lines, counts, facet legends (650), the result count, breadcrumbs, footer, table headers (600), vote counts.

### Named Rules
**The Four Sizes Rule.** Only 13, 15, 17 and 32px exist. A new need maps to one of them.

**The Tabular Count Rule.** Every number that counts something (votes, filter counts, revenue, dates in timelines, cohort figures) uses tabular numerals.

## Layout

All content sits in a centred container (1120px max) with 24px side gutters (16px under 560px). The index is a two-column grid: a 200px sticky filter column and a fluid results column, 48px apart. The direction contract called for a 220px column; the build ships 200px, and the build is the record. Under 860px the filters collapse into a disclosure above the results, laid out as an auto-fill grid of 180px tracks. Under 560px the nav becomes a full-width horizontal scroller at 13px, and two-column definition lists stack.

The page opens with one context sentence carrying the counts inline (no hero), then the toolbar, then rows straight away. Rows are a two-track grid: content on the left, the vote box on the right edge. Project pages cap at 800px; prose pages at 720px (880px for the survival page with its table). Vertical rhythm is tight: rows pad 11/10px, list items and fact rows 8–10px, and sections open with 40–44px above their 17px heading.

## Elevation & Depth

Flat. No drop shadows and no layered surfaces. Structure comes from 1px hairline rules, a single ink-coloured rule under the toolbar and table headers, and type weight. The only `box-shadow` in the build is the active sort tab's 2px inset underline in green, which is an underline device, not elevation.

### Named Rules
**The Hairline Rule.** Separate things with a 1px rule, not a box. Use the strong ink rule only to close a control band (the toolbar, a table head).

## Shapes

Mostly square. Interactive controls (search field, primary button, vote box, embed field) get a gentle 6px radius. Status bars and the focus ring get a 2px hair radius, and legend swatches 1px. Rows, lists, tables and the page itself have no corners because they have no containers. The mark is a 4.5px-radius green square holding a square-capped stroke that reads as a V first and a check second (Vitrine, and "still alive"); the stroke is white in light mode and ground-coloured in dark (`--mark-ink`). It is also the favicon and the badge mark.

## Components

### Buttons
- **Shape:** gently rounded (6px), 36px tall, 14px side padding.
- **Primary:** ink fill, paper text, 15px weight 600, an optional trailing outbound-arrow icon. Used once per project page, labelled "Abrir" plus the project's domain.
- **Hover / Focus:** fill turns ledger green; focus shows the global 2px green outline offset 2px.
- **Link-buttons:** the clear-filters and empty-state actions are unstyled buttons in green, underlined. The follow toggle is a bare 13px text button in faint ink that turns green and 600 when pressed.

### Inputs / Fields
- **Search:** 36px tall, paper ground, 1px strong hairline, 6px radius, faint-ink placeholder. On focus the border disappears behind a 2px green outline inset by 1px.
- **Checkboxes:** native, tinted with the accent; the label beside a checked box turns green and 600.

### Navigation
- **Header:** a 58px band with a hairline below; mark plus wordmark on the left, set at 17px: "Vitrine" at 750 weight, -0.03em, then "MicroSaaS BR" at 400 in muted ink, nav on the right in soft ink. The current page goes to ink with an underline offset 6px. Hover goes to ink.
- **Sort tabs:** text buttons 18px apart in faint ink. The active tab is ink, weight 600, with a 2px green underline.
- **Breadcrumbs and footer:** 13px faint ink above a hairline; footer links in soft ink, green on hover.

### Project Row (signature)
The unit of the site. The name (17px, 650, ink, no underline until hover) is followed by the domain in 13px faint ink with an outbound arrow, and a "novo" tag in 13px soft ink when unseen. Under it, the pitch in ink (68ch max), then a wrapping meta line in 13px faint ink. Meta items wrap as whole units 12px apart with no separator dots. The stage and revenue are in ink, weight 600; status words are coloured. Dead rows strike the name through (1.5px) and grey the name and pitch.

### Vote Box (signature)
A 48px-wide column with a 1px strong-hairline stroke and 6px radius, pinned to the row's right edge. It holds a 12px one-stroke green up-triangle above a tabular 13px count. On hover the stroke and count go green (0.12s). It links out to the Reddit post; voting does not happen on the site. The project-page variant is 76px wide with a 17px count and a "votos no Reddit" caption, and lies horizontal under 560px.

### Survival Bar
An 8px (14px for the overall bar) segmented strip with a 2px radius and 2px gaps on a hairline ground. Green for alive, red for down, ink for dead, strong hairline for unchecked. The stale segment uses a lighter amber that is not a token yet (a literal in the stylesheet), not stale-amber. It always has a legend with tabular counts and an aria-label that spells out the counts.

## Do's and Don'ts

### Do:
- **Do** keep every size on 13 / 15 / 17 / 32px and every count in tabular numerals.
- **Do** separate content with 1px hairlines and leave rows uncontained.
- **Do** write status as a word; colour only the stale (amber) and down (red) states.
- **Do** strike through and grey a dead project's name instead of hiding it.
- **Do** draw UI icons as inline SVG with one stroke (1.3–1.4 on a 12px box) in `currentColor`.
- **Do** put counts inline in sentences ("20 produtos lançados…").
- **Do** keep navigation chrome and names in ink, and leave green for content links, selection and interaction.

### Don't:
- **Don't** wrap projects or sections in cards, and don't use drop or offset shadows anywhere.
- **Don't** use pill-shaped chips or tags; controls top out at a 6px radius.
- **Don't** introduce a serif or display face, or a cream or tinted page ground.
- **Don't** build stat tiles or big-number hero blocks; numbers live in sentences, tables and meta lines.
- **Don't** add a second accent hue.
- **Don't** use emoji or font glyphs as icons.
