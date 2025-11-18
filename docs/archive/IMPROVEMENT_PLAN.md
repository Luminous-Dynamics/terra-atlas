# Terra Atlas Improvement Plan

Last updated: 2025-11-15

## Guiding Principles
- **Single source of truth** for configuration and data access. No more embedded keys or shadow databases.
- **Observable performance** for the 3D globe and landing experience so regressions are obvious.
- **Developer confidence** via fast lint/type/test loops that match production constraints.

## Current Focus (Q4 sprint)
1. **Unified landing system** – finish modularizing `app/page.tsx`, stream heavy sections, and ensure hero metrics stay in sync with `/api/stats` data.
2. **Performance telemetry** – pipe `performanceMonitor` metrics to `/api/telemetry`, persist snapshots, and project them on an internal dashboard to catch FPS drops early.
3. **Developer guardrails** – keep `npm run check` green by default, migrate off `next lint`, and re-enable ESLint/TS build blocking once outstanding issues are cleared.

## Priority Themes & Next Actions

### 1. Developer Workflow Guardrails _(Highest leverage)_
| Goal | Why it matters | Next actions |
| --- | --- | --- |
| Make “lint → typecheck → test” mandatory before merges | Prevent silent regressions (ESLint/TS currently ignored) | 1) Keep `npm run check` runnable locally. 2) Migrate to `eslint.config.js` + ESLint CLI. 3) Remove `ignoreDuringBuilds` once lint debt is cleared. |
| Centralize env validation | Avoid leaking prod keys to the client | 1) Use `lib/env(.server).ts` everywhere. 2) Update CLI scripts to rely on `.env`. 3) Rotate exposed keys & add `env:verify`. |
| Document runbooks | Reduce spin-up time for contributors | 1) Add quick “Develop / Test / Deploy” section in README. 2) Create `docs/testing.md` once coverage exists. |

### 2. Data & API Integrity
| Goal | Why it matters | Next actions |
| --- | --- | --- |
| Replace local SQLite fallbacks with Supabase-backed caching | `data/terra-atlas-local.db` drifts from live data and fails on serverless targets | 1) Ship shared Drizzle models for stats/projects. 2) Export nightly snapshots into Supabase storage. 3) Gate privileged endpoints behind auth + rate limits. |
| Normalize API schemas | Frontend queries multiple shapes | 1) House shared Zod schema package under `lib/schemas`. 2) Convert API handlers + SWR hooks to use it. 3) Add contract tests so CI blocks breaking changes. |
| Wire stats to the hero UI | Currently hero cards are hard-coded | 1) Fetch `/api/stats` on mount with abort handling. 2) Pipe data into hero cards with loading fallback. 3) Add schema validation client-side to detect drift. |

### 3. Experience & Performance
| Goal | Why it matters | Next actions |
| --- | --- | --- |
| Finish modular landing page | Improves readability, enables streaming/lazy loading | 1) Keep sections under `app/homepage/sections/*`. 2) Lazy-load globe + heavy illustrations via dynamic imports. 3) Add automated Lighthouse run in CI. |
| Globe framerate telemetry | Current `performanceMonitor` only logs to console | 1) Send metrics to `/api/telemetry` (POST body = load timings + FPS). 2) Store in Supabase `telemetry_events`. 3) Visualize in an internal dashboard. |
| Reduce blocking assets | Large textures & fonts delay FCP | 1) Convert textures to AVIF/WebP (progressive). 2) Use `next/font` subsets. 3) Track bundle size with `next-bundle-analyzer`. |
| Scroll reveal reliability | Lazy sections currently miss observer registration | 1) Extract `useScrollReveal` hook that re-attaches observers when nodes stream in. 2) Cover with a unit test. 3) Apply to every `LazySection`. |

## Success Metrics
- ✅ CI blocks merge when lint/type/test fail.
- ✅ No plaintext secrets committed; `.env.example` is the only reference.
- ✅ Time to interactive on landing page < 3s on mid-tier laptop; globe avg FPS ≥ 45.
- ✅ API error rate < 1% and zero unauthenticated access to investor data.

## Immediate Backlog
1. Remove hard-coded Supabase keys from `/scripts/*.ts`, rely on `lib/env.server.ts`, and document the sync process.
2. Gate heavy homepage sections behind viewport-aware lazy loaders (complete CTA/footer streaming) and ensure scroll-reveal works for streamed DOM.
3. Build tooling to analyze telemetry (`scripts/analyze-telemetry.ts`) and surface trends; then pipe data to Supabase/dashboard.
4. Re-enable ESLint/TS build blocking after fixing outstanding issues and baseline lint errors.
5. Replace `/api/stats` + `/api/projects` SQLite calls with Supabase/Drizzle queries and keep hero metrics fully dynamic.

---
_Have a better idea? Drop it in `docs/IMPROVEMENT_PLAN.md` with context so we can swarm it._ 
