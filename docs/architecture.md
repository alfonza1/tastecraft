# Architecture

Tastecraft is a static, local-first React application. Nothing requires a server besides serving the files.

```text
Choices / manual controls / JSON import
                  ↓
       Library (version 2, up to 20 profiles)
         Active profile (version 1)
             ↙            ↘
      localStorage      token compiler
                          ↙        ↘
                   live previews   four exporters
```

## Modules

- `src/model.ts`: five axes, choice aggregation, token generation, strict import parser, storage loading.
- `src/library.ts`: bounded library schema, additive imports, v1 migration, identity-safe duplication, snapshot-checked persistence.
- `src/useLibrary.ts`: Web Locks serialization, storage-event conflict detection, persistent error state, explicit recovery.
- `src/Preview.tsx`: curated interactive example. Internal checkbox/note state is independent of design evidence.
- `src/SettingsPreview.tsx`: notification-settings form with independent in-memory controls and save feedback.
- `src/exports.ts`: deterministic CSS, skill, JSON, and standalone React output; browser file downloads.
- `src/App.tsx`: studio navigation, profile editing, evidence capture, in-session undo, import/export feedback.
- `src/style.css`: studio styling and token-driven preview styling. Bundled fontsource packages avoid runtime font requests.

## Decisions

**No model dependency.** Five controlled comparisons are understandable and free. Exported guidance may be consumed by any agent; the studio never sends a profile to a model provider.

**One dimension per pair.** All other values stay fixed to the current profile. This reduces confounding, but does not claim scientific measurement of taste.

**Explicit evidence.** A choice appends `{axis, value}`. Value 0 means the first endpoint; 100 means the second; null means skip. A selected axis is updated to the mean of retained non-null observations. Manual overrides remain separate from evidence in the sense that history is unchanged; exports disclose that values may have been manually refined.

**Bounded state.** Comparison history is capped at 100 entries; undo holds 30 profile snapshots in memory. Three example notes are retained per preview. Inputs have length/size limits.

**No arbitrary code ingestion.** Imports accept only validated versioned profile data. React renders text normally. Executable previews are shipped with the application, not downloaded from untrusted profile files.

**Relative build paths.** Vite `base: './'` supports repository Pages URLs and nested static deployments without a router rewrite.

**Non-destructive migration.** A valid v2 library takes precedence. With no v2 entry, the v1 profile seeds a library; the original entry is never modified. Parse failures open a temporary working library and pause writes. JSON exports retain the v1 profile schema. Whole-library exports use v2, and imports always append fresh identities after validating the entire file and capacity.

**Cooperating-tab concurrency.** Each write acquires the origin's `tastecraft.library.v2` Web Lock, compares the current serialized storage snapshot to the last observed snapshot, then writes. An intervening write or storage event pauses persistence. Old scheduled writes are cancelled when React state changes. Recovery never silently merges: users back up their local work, then explicitly load the latest or replace stored data. Web Locks and HTTPS/localhost are required for persistence; editing/export remains usable without them. Arbitrary noncooperating scripts remain outside this concurrency guarantee.

## Validation boundaries

Browser end-to-end coverage is Chromium on desktop and mobile viewport sizes. Firefox/WebKit and physical devices have not been verified in this release. The project is designed around standard browser APIs, not a browser extension.

The contrast axis changes between two curated colors; it is not a general contrast auditor. Typography and accent currently switch at the midpoint. Every profile exports a reduced-motion override.

## Next steps

1. Additional curated preview components (forms, editorial layouts, navigation) sharing the same tokens.
2. Per-profile comparison history inspection and optional explicit merging between library backups.
3. More palettes with automated contrast checks and transparent provenance.
4. Adapter guidance for popular agent skill discovery conventions.
5. Optional custom-component integration with a clearly isolated execution boundary.
