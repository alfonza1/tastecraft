# Changelog

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
