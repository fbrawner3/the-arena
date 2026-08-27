# The Arena

Launch, approve, and monitor DBOS-orchestrated workflows (Triple Threat, Gauntlet) from one page. Replaces Mattermost's role as the launch/approve/notify surface for both — Mattermost is being retired from the platform, this is its replacement, not an addition alongside it.

Live at `http://arena.<your-internal-domain>` (redirects to `/arena`) or `http://<any-node-ip>:31010/arena`.

## Why this exists

Triple Threat's original launch/approve UI was Mattermost slash-commands plus a bare static page (`/tt-approvals`). Both were hard to extend, easy to lose track of, and gave no visibility into what a gate approval actually meant before clicking it. The Arena replaces that with a single page that shows real content, not just a bare "approve" button.

## Where it lives

Arena is **not** a separate service or deployment. It's a set of routes inside `geekygramps-mcp` itself:

```
src/dbos/arena/
  registry.ts          workflow-type registry (id, color, capability flags per type)
  routes.ts             GET /arena, /arena/api/*, /arena/assets/*
  page.ts               the entire page: HTML + embedded vanilla JS, one big template literal
  trilium-browser.ts    read-only Trilium tree browsing for the source picker
  assets/               brand images (icons/logos), served via /arena/assets/:file
```

Rides the same Fastify instance, same NodePort (31010), same `X-MCP-Token` gate as everything else in this app. `GET /arena` and `GET /arena/assets/*` are exempted from that gate (same reasoning as the older `/tt-approvals`: a browser navigating directly, or an `<img>` tag, never sends a custom header) — the token is baked into the rendered page and sent by its own `fetch()` calls against the still-gated API routes.

No new Docker image, no new NetworkPolicy, no new Argo Application. Ships as part of the normal `geekygramps-mcp` build/push/values-bump/Argo-sync cycle.

## Workflow-type registry

The whole point of building this generically: `registry.ts` declares what each workflow type can do, and the UI branches on those flags instead of hardcoding "Triple Threat vs Gauntlet" logic everywhere. Adding a third DBOS workflow type later means adding an entry here, not rewriting the page.

| Flag | Triple Threat | Gauntlet |
|---|---|---|
| `hasApprovalGates` | yes — pauses at 5 named gates, needs a human click to continue | no — fully autonomous start to finish |
| `hasBlockerSystem` | yes — a blocker workshop with decision/evidence/verify | no — Gauntlet produces findings, not blockers |
| `hasEventStream` | yes — granular per-line event log available | no — coarse status only (`requested → independent_reviews → cross_agent_challenge → succeeded/failed`) |
| `hasFindingsTable` | no | yes — severity-ranked findings table from the JSON block each review is required to emit |
| `counterLabel` | "lifetime created" | "lifetime hardened" |

Colors: Triple Threat blue (`#2f6fed`), Gauntlet purple (`#8b5cf6`) — matches the locked brand artwork. Color, not a bespoke icon, is how the UI tells workflow types apart at a glance.

## Screens (all one page, no client-side router)

1. **Home** — one logo + live lifetime counter per registered workflow type. TT counts rows where `status = 'synchronized'`; Gauntlet counts rows where `verdict IN ('PASSED', 'PASSED_WITH_CONDITIONS')` — deliberately not the same query, since Gauntlet's counter claims something stronger ("actually hardened") than TT's ("ran to completion"). A `synchronized` TT round can still be an empty shell with every blocker unresolved; the counter only ever claimed "created," never "good."
2. **Pick Source** — a live, clickable Trilium tree starting at `Planner/Projects`, breadcrumb navigation, "Use as source" to select a project note. Fetches fresh on every click, no caching.
3. **Launch / View existing round** — click a workflow-type card. With no source selected, you still get a "view an existing run by workflow ID" field (works standalone, doesn't require picking a source first). With a source selected, you get the actual launch form (TT: round number; Gauntlet: proposal text prefilled from the selected note, editable) that POSTs to the real `/tt-workflows` or `/gauntlet/runs` endpoints — same endpoints Mattermost used.
4. **Status** (same panel, swaps content) — polls every 5s. TT shows all 8 stages with their specialist (wolf=Claude, raven=Codex, dragon=Antigravity), an Approve button when a gate is pending, and the blocker workshop (numerically sorted, each with question/why-it-blocks/recommendation, a "Copy Prompt" button for investigation, and Record Decision → Verify). Gauntlet shows coarse status, verdict, and the findings table once available.

## API surface

All under the existing `X-MCP-Token` gate except where noted.

- `GET /arena` — the page (token-exempt)
- `GET /arena/assets/:file` — brand images, explicit allowlist only, never a raw filename passthrough (token-exempt)
- `GET /arena/api/registry` — the workflow-type list above
- `GET /arena/api/counters` — `{ triple_threat: n, gauntlet: n }`
- `GET /arena/api/trilium/children?noteId=` — source-picker tree data, defaults to `TRILIUM_ARENA_ROOT_NOTE_ID` (Planner/Projects) when `noteId` is omitted

Everything else (launching, polling status, approving gates, recording/verifying blockers, findings) reuses the existing `/tt-workflows/*` and `/gauntlet/runs/*` routes directly from the browser — Arena didn't duplicate that surface, just built a UI on top of it.

## Config

| Env var | Purpose |
|---|---|
| `TRILIUM_PROJECTION_ENABLED` | Must be `"true"` — gates the source picker the same way it gates the rest of Trilium write/read access. Off by default platform-wide. |
| `TRILIUM_PROJECTION_TOKEN` | Same Trilium ETAPI credential as `TRILIUM_ETAPI_TOKEN` — ETAPI tokens aren't scoped per feature, this is just a second config key pointing at the same value. |
| `TRILIUM_ARENA_ROOT_NOTE_ID` | Source-picker's browse root note ID — set this to whatever Trilium note you want as the browse root (e.g. your own "Projects" note). Environment-specific; there's no default that makes sense outside one Trilium instance. |

## Known gaps

- **Findings table has no UI yet** — the Gauntlet findings pipeline (JSON block → `gauntlet_findings` table → `GET /gauntlet/runs/:id/findings`) is built and returns real data; Arena doesn't render it as a table yet, only fetches it.
- **No deny/rework path for TT gates** — this is a Triple Threat architecture gap, not an Arena one. Every gate has only ever supported approve-or-timeout-cancel, inherited unchanged from the Hermes-era design. The one exception is adjudication's own blocker workshop, which is a real resolve/verify loop.
- **Blocker auto-ingestion doesn't exist** — Adjudication produces a real blocker manifest in its Trilium output, but nothing parses it into the tracked `tt_blockers` table automatically. Today that requires a manual backfill (one `POST .../blockers` call per blocker).
- **No Telegram notify channel yet** — planned as Mattermost's eventual replacement for outbound notifications, not built.
- **Mattermost bridge itself hasn't been decommissioned** — Arena covering launch/approve is a prerequisite for that, not the same step.

## A real bug class to watch for when editing `page.ts`

`page.ts`'s entire HTML + client-side JS is one giant TypeScript template literal (backtick string). Any single backslash written as part of the *embedded JS* — a regex like `/\D/g`, an escaped quote like `\"` — gets consumed by the **outer** template literal's own escape processing during compilation, silently corrupting the emitted code (`/\D/g` becomes `/D/g`; `\"` becomes two bare `"` characters). This has caused two real, deployed bugs in this file already. To write a literal backslash that must survive into the served JS, double it in the source (`\\D`, or avoid the situation entirely — e.g. use single quotes instead of an escaped double quote).

**Always verify by rebuilding and extracting the actual compiled output**, not by trusting the TypeScript source or a stale `dist/` build:

```bash
npm run build
node -e "import('./dist/src/dbos/arena/page.js').then(m => { const html = m.renderArenaPage('test'); const js = html.match(/<script>([\s\S]*)<\/script>/)[1]; require('fs').writeFileSync('check.tmp.js', js); });"
node --check check.tmp.js
```

Syntax-checking alone isn't enough for logic bugs like the regex case — run the actual extracted snippet against real data when the change touches anything with a backslash.
