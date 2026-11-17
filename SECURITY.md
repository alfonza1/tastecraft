# Security

The studio is a static application with no accounts, API keys, backend, or remote inference. Profiles stay in localStorage and exported files. Your static hosting provider receives ordinary asset requests. Do not put secrets in project names or imported profiles.

Imports are versioned JSON, capped at 100 KB per individual profile and 1 MB per library, checked for valid known axes, bounded numeric values, unique identifiers and valid active-profile references. A library holds up to 20 profiles. Imported data is never evaluated as code. Exported React is generated only from validated tokens.

Library writes use the same-origin Web Locks API and compare the saved snapshot before writing. Unexpected changes pause saving; recovery actions require explicit confirmation. This protects against cooperating Tastecraft tabs, not malicious same-origin scripts or browser extensions. Backups remain the durable recovery mechanism. The old version 1 storage entry is retained during migration.

Use GitHub's private vulnerability reporting on this repository when available. Do not post exploit details or private data in a public issue. Supported security fixes target the latest 0.3.x release.

Taste cards escape project names as XML text and omit library/history data. The optional name is included in both visible and accessible SVG text; turn it off before sharing if private. Cards contain only local drawing primitives and system-font references. PNG is rasterized locally using Canvas. No export action uploads or publishes files.

The development server binds to 127.0.0.1. Do not expose it to an untrusted network. Build and serve `dist/` for deployment.
