# Security

The studio is a static application with no accounts, API keys, backend, or remote inference. Profiles stay in localStorage and exported files. Your static hosting provider receives ordinary asset requests. Do not put secrets in project names or imported profiles.

Imports are versioned JSON, capped at 100 KB, checked for valid known axes and bounded numeric values. Imported data is never evaluated as code. Exported React is generated only from validated tokens.

Use GitHub's private vulnerability reporting on this repository when available. Do not post exploit details or private data in a public issue. Supported security fixes target the latest 0.1.x release.

The development server binds to 127.0.0.1. Do not expose it to an untrusted network. Build and serve `dist/` for deployment.
