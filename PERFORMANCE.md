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

Environment overrides:

```sh
PERF_BASE_URL=https://aceprodutora.com.br PERF_LABEL=production PERF_RUNS=5 npm run perf:audit
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
| `/` | 96 | 0.92 s | 2.74 s | 39 ms | 0.000 | 255 KiB |
| `/copa-ace-10` | 95 | 0.91 s | 2.87 s | 62 ms | 0.000 | 297 KiB |
| `/hall-of-fame` | 98 | 0.92 s | 2.42 s | 29 ms | 0.000 | 285 KiB |

## What the trace showed

- FACEIT avatars were delivered unmodified at 32–56 px. Sixteen production avatar URLs totaled about 1.74 MiB. A real 330 KiB production avatar is 1.6 KiB through the configured 64 px Next image optimizer path.
- Uploaded team logos were also delivered as full originals; two production files exceeded 1.1 MiB each. They now use the same responsive image pipeline.
- The commemorative coin falls from 220 KiB to about 52 KiB at the measured mobile width.
- The global Nippo font is now WOFF2: 29.1 KiB instead of 69.9 KiB.
- Pages were prefetching the large Copa React Server Component payload during unrelated initial loads. That automatic prefetch is disabled only for the heavy route.
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
