# Auto Takeoff

Browser-based HVAC PDF takeoff scanner + duct ordering / CAM export. Single-page app (PWA).
AI review calls the shared Brookstone Cloudflare worker — no backend lives in this repo.

## Files (push all of these to the repo root)

| File | Purpose |
|------|---------|
| `index.html` | The entire app (scanner + ordering + CAM import) |
| `manifest.webmanifest` | PWA metadata (name, icons, colors) |
| `sw.js` | Service worker — network-first app shell, offline fallback |
| `icon-192.png` | App icon (192×192) |
| `icon-512.png` | App icon (512×512) |
| `apple-touch-icon.png` | iOS home-screen icon (180×180) |

## Hosting on GitHub Pages

1. Push all files to the repo root.
2. Repo **Settings → Pages → Build and deployment → Source: Deploy from a branch**, branch `main`, folder `/ (root)`.
3. Open the published URL (e.g. `https://bmartin-art.github.io/Autotakeoff/`).

Served over HTTPS, so the AI review's worker call works (it was sandbox-blocked only inside the Claude preview).

## Notes

- **Needs internet:** pulls pdf.js + jsPDF from a CDN and calls the shared AI worker.
- **First run on a new domain starts with empty AI learning.** Use **Import learning** in the scanner and load your saved `brookstone-learning-*.json` so the AI keeps your taught examples.
- **Updating:** push a new `index.html`, then bump `CACHE` in `sw.js` (e.g. `autotakeoff-v2`) so installed copies refresh.
