# Frontend performance

This project uses a repeatable Lighthouse mobile lab benchmark for `/`, `/copa-ace-10`, and `/hall-of-fame`. It complements field Core Web Vitals; it does not replace them.

## Run the benchmark

Use an optimized production build, never the development server:

```sh
npm run build
npm run start
```

In a second terminal:

```sh
npm run perf:audit
```

For client/server module inspection, run `npm run analyze`. The normal production build remains Turbopack; the analyzer intentionally uses Next 15's default Webpack build because `@next/bundle-analyzer` is a Webpack plugin. Its isolated output is written to `.next-analyze/` so it cannot invalidate the normal build's generated types.

The runner uses Lighthouse 13.4.1, five serial cold-page runs, simulated mobile throttling, and reports the median. JSON reports are written to `.performance-reports/` and ignored by Git.
The default route set stays intentionally small for quick release checks; `PERF_ROUTES` accepts a comma-separated list when auditing the rest of the public surface.

Environment overrides:

```sh
PERF_BASE_URL=https://aceprodutora.com.br PERF_LABEL=production PERF_RUNS=5 npm run perf:audit
PERF_ROUTES=/schedule,/news,/inscreva-se PERF_LABEL=secondary-routes npm run perf:audit
```

Keep Chrome, Lighthouse, route, viewport, throttling, run count, and machine unchanged when comparing commits. Compare production with production and local with the unchanged local base; production and a local empty database are not directly comparable.

## Baseline and improvement results

Production baseline captured on 2026-08-27, using three serial mobile runs:

| Route | Score | LCP | TBT | CLS | Resource weight |
| --- | ---: | ---: | ---: | ---: | ---: |
| `/` | 66 | 5.54 s | 480 ms | 0.000 | 2,098 KiB |
| `/copa-ace-10` | 50 | 10.00 s | 905 ms | 0.000 | 5,646 KiB |
| `/hall-of-fame` | 82 | 4.57 s | 44 ms | 0.000 | 352 KiB |

Local production-build medians after each isolated change, using the same three-run protocol during development:

| Stage | Route | Score | LCP | TBT | Resource weight |
| --- | --- | ---: | ---: | ---: | ---: |
| Unchanged `39b3803` | `/` | 95 | 2.91 s | 68 ms | 294 KiB |
| React Compiler | `/` | 96 | 2.85 s | 72 ms | 295 KiB |
| Responsive images | `/` | 95 | 2.85 s | 70 ms | 269 KiB |
| Final render/assets | `/` | 96 | 2.69 s | 38 ms | 254 KiB |
| Unchanged `39b3803` | `/copa-ace-10` | 80 | 3.70 s | 393 ms | 486 KiB |
| React Compiler | `/copa-ace-10` | 94 | 2.90 s | 97 ms | 487 KiB |
| Responsive images | `/copa-ace-10` | 94 | 2.91 s | 138 ms | 304 KiB |
| Final render/assets | `/copa-ace-10` | 96 | 2.86 s | 40 ms | 297 KiB |
| Unchanged `39b3803` | `/hall-of-fame` | 99 | 2.09 s | 78 ms | 332 KiB |
| React Compiler | `/hall-of-fame` | 96 | 2.80 s | 47 ms | 333 KiB |
| Responsive images | `/hall-of-fame` | 99 | 2.05 s | 44 ms | 313 KiB |
| Final render/assets | `/hall-of-fame` | 99 | 2.00 s | 45 ms | 284 KiB |

Three runs expose normal lab variance, especially in score and TBT. Use the checked-in five-run command for release decisions. React Compiler mainly targets update/render work, so its isolated cold-load result should not be treated as the source of the later network wins.

Final five-run verification on the completed branch:

| Route | Score | FCP | LCP | TBT | CLS | Resource weight |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| `/` | 96 | 0.91 s | 2.71 s | 45 ms | 0.000 | 255 KiB |
| `/copa-ace-10` | 96 | 0.91 s | 2.77 s | 38 ms | 0.000 | 299 KiB |
| `/hall-of-fame` | 99 | 0.92 s | 2.06 s | 56 ms | 0.000 | 285 KiB |

## Expanded public-route audit

A second pass covered every distinct public page shape, including the schedule, news, closed registration page, simple archive pages, and all four archive tournament formats. The table uses three serial simulated-mobile runs before and after this pass; the high TBT variance on these CPU-throttled runs is why the five-run default remains the release protocol.

| Route | Score | LCP | TBT | Weight | Final score | Final LCP | Final TBT | Final weight |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `/schedule` | 85 | 3.01 s | 365 ms | 254 KiB | 84 | 3.11 s | 386 ms | 256 KiB |
| `/news` | 87 | 2.96 s | 364 ms | 235 KiB | 87 | 2.87 s | 322 ms | 240 KiB |
| `/inscreva-se` | 83 | 3.07 s | 446 ms | 242 KiB | 84 | 3.16 s | 343 ms | 245 KiB |
| `/hall-of-fame/copa-ace-1` | 86 | 2.95 s | 365 ms | 244 KiB | 81 | 3.05 s | 523 ms | 246 KiB |
| `/hall-of-fame/copa-ace-7` | 70 | 2.88 s | 1,360 ms | 316 KiB | 74 | 3.50 s | 657 ms | 295 KiB |
| `/hall-of-fame/copa-ace-8` | 74 | 2.28 s | 842 ms | 326 KiB | 78 | 3.52 s | 500 ms | 297 KiB |
| `/hall-of-fame/ace-clutch` | 60 | 3.67 s | 2,670 ms | 337 KiB | 85 | 3.29 s | 321 ms | 298 KiB |
| `/hall-of-fame/ace-clutch-2` | 68 | 2.62 s | 1,833 ms | 318 KiB | 83 | 3.27 s | 392 ms | 285 KiB |
| `/hall-of-fame/copa-ace-9` | 70 | 3.84 s | 808 ms | 333 KiB | 83 | 3.38 s | 370 ms | 302 KiB |

The lab comparison is deliberately reported even where normal run-to-run variance moved a metric in the wrong direction. The consistent archive gains are lower transfer weight and much less blocking work on the dense tournament formats; the simple pages were already dominated by the shared Next runtime.

Production response inspection found `/`, `/schedule`, and archive detail routes uncached, with observed TTFB between 0.65 s and 1.04 s. The home and schedule now use 60-second ISR with immediate admin-triggered invalidation, while immutable archive slugs are generated statically. A local production server confirms cache hits around 0.01–0.08 s; the real production effect must be measured again after deployment.

The archive's 72 referenced team-logo sources were also normalized to at most 256 px WebP. Their total checked-in size fell from 14.9 MiB to 1.46 MiB, reducing deployment weight and cold image-optimizer work while retaining more than three times the largest rendered dimension. The closed registration route no longer hydrates its dormant multi-step form and now ships no route-specific client JavaScript.

## What the trace showed

- FACEIT avatars were delivered unmodified at 32–56 px. Sixteen production avatar URLs totaled about 1.74 MiB. A real 330 KiB production avatar is 1.6 KiB through the configured 64 px Next image optimizer path.
- Uploaded team logos were also delivered as full originals; two production files exceeded 1.1 MiB each. They now use the same responsive image pipeline.
- The commemorative coin falls from 220 KiB to about 52 KiB at the measured mobile width.
- The global Nippo font is now WOFF2: 29.1 KiB instead of 69.9 KiB.
- Viewport-triggered route prefetch was adding unrelated work to initial loads, including the large Copa React Server Component payload. Primary navigation now prefetches on hover, focus, or touch intent instead, exposes an immediate pending state after activation, and the Copa route has a loading boundary.
- Below-fold tournament sections, archive cards, schedules, and the footer use `content-visibility: auto`. Mobile also avoids the continuously animated large coin and expensive navbar backdrop blur.
- The YouTube API is now requested only when a visible live player approaches the viewport.

## Interpreting the metrics

Target field p75 values are LCP at or below 2.5 s, INP at or below 200 ms, and CLS at or below 0.1. Lighthouse cannot measure INP without a real interaction; TBT is only a lab diagnostic proxy. Validate menu, schedule filtering, scrolling, and navigation with Chrome Performance or React Profiler, then monitor real-user Core Web Vitals after deployment.

Primary references:

- [React Compiler](https://react.dev/learn/react-compiler/introduction)
- [Next.js React Compiler configuration](https://nextjs.org/docs/app/api-reference/config/next-config-js/reactCompiler)
- [Next.js image optimization](https://nextjs.org/docs/pages/api-reference/components/image)
- [Lighthouse variability](https://github.com/GoogleChrome/lighthouse/blob/main/docs/variability.md)
- [Core Web Vitals thresholds](https://web.dev/articles/vitals)
- [Chrome Performance interactions](https://developer.chrome.com/docs/devtools/performance/reference/)
