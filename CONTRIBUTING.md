# Contributing

Start with the README quick start. Node.js 22.12+ is required. Keep changes focused and explain the user behavior being improved.

Before submitting:

```text
npm ci
npm run typecheck
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

For a new preview, preserve semantic controls, keyboard focus, responsive layouts, and reduced-motion behavior. A preview must respond to the same exported tokens; do not add decorative dimensions that cannot be exported.

For preference-model changes, document the formula and update import compatibility and evidence tests. Never silently reinterpret a saved profile version. Do not add telemetry, remote inference, or external font dependencies without a design discussion.

Screenshots in `docs/` are generated from the real app by browser tests. Review changed screenshots before committing them. Include meaningful tests for behavior changes, rather than snapshots that merely mirror implementation.

Good first contributions: additional curated preview content, accessible interaction improvements, translations that preserve meaning, and reproducible bug reports.
