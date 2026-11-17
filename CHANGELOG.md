# Changelog

## 0.3.0 — 2026-11-17

- Added designed, shareable taste cards derived from real profile tokens and all five style values.
- Added self-contained SVG and locally rendered 1200 × 780 PNG downloads, with optional project-name inclusion.
- Added accessible card descriptions, XML escaping, Unicode-safe title wrapping, and a clear SVG fallback when PNG rendering fails.
- Removed the redundant live-preview badge and export instruction box to keep the working interface focused.
- Added image/export regression tests, real exported examples, and desktop/mobile export screenshots.

## 0.2.1 — 2026-11-17

- Restricted Pages pushes to branches and isolated deployment concurrency by ref. Creating a release tag can no longer cancel a pending studio deployment.

## 0.2.0 — 2026-11-17

- Added a library of up to 20 named directions with independent settings/evidence, switching, duplication, and confirmed deletion.
- Added version 2 library backups and additive imports; version 1 individual exports remain compatible.
- Migrated existing profiles without altering the original storage entry. Corrupt saved data remains untouched until an explicit replacement.
- Serialized saves with Web Locks, paused saving on cross-tab conflicts, and added backup-first recovery with confirmed load/overwrite actions.
- Added a functional notification-settings preview, skip-to-studio navigation, and robust long-name mobile layout.
- Increased muted text contrast throughout navigation, profile details, slider values, status text, and the footer; enlarged clickable task rows after an independent accessibility audit.
- Added migration, library validation, conflict, recovery, capacity, keyboard, and mobile regression coverage.

## 0.1.0 — 2026-11-17

- Introduced five controlled visual comparisons with functioning task-card previews.
- Added explicit preference aggregation, editable values and project naming.
- Added local persistence, validated JSON import, confirmed reset, and in-session undo.
- Added CSS tokens, agent skill, JSON profile, and standalone React exports.
- Added responsive studio, bundled fonts, reduced-motion support, and keyboard controls.
- Added model/export tests, browser workflow tests, and static deployment workflows.

This release uses curated preview components. It does not train a model or import arbitrary apps.
