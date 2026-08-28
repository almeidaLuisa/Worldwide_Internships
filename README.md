# Internship Search Tracker

A small static site for tracking Summer 2027 computer engineering internships outside the US. Companies are grouped into categories (Big Tech / Multinationals, Enterprise Software & Hardware (Europe), Consumer Tech & Fintech (Europe), Canada, Trading Firms — FPGA / Low-Latency Hardware, FPGA, EDA & Reconfigurable Computing, Semiconductor & Hardware Manufacturers, Latin America, Startups & Scale-ups), each row is editable in the browser, and your edits persist locally via `localStorage`.

No build step, no backend — just `index.html`, `style.css`, `script.js`, `companies.json`, and a `fonts/` folder of self-hosted webfonts.

Built by Luisa with the help of [Claude Code](https://claude.com/claude-code), deployed on [Render](https://render.com).

## Run it locally

Any static server works, for example:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Push to GitHub

```bash
cd intern-tracker
git init
git add .
git commit -m "Initial internship tracker"
gh repo create intern-tracker --public --source=. --remote=origin --push
```

(No `gh` CLI? Create a repo on github.com, then `git remote add origin <your-repo-url>` and `git push -u origin main`.)

## Deploy on Render

1. Push the repo to GitHub (above).
2. On [render.com](https://render.com), click **New > Static Site** and connect the repo.
3. Render should auto-detect the included `render.yaml` (Build Command: none, Publish Directory: `.`). If it doesn't pick it up automatically, set those two fields manually.
4. Deploy — you'll get a URL like `https://internship-tracker.onrender.com`.

Every push to `main` auto-redeploys.

## Editing in VS Code

Open the folder in VS Code (`code .`), edit `companies.json` to add/update companies, or edit `script.js`/`style.css` for behavior/design changes. Commit and push — Render picks up the change automatically.

## Notes on the data

`companies.json` holds the seed data. Once you start editing in the browser, your changes live in that browser's `localStorage`, not in the JSON file — so they won't show up for someone else visiting the deployed URL, and clearing site data will wipe them. To make an edit "official" for everyone (including future-you on a different device), edit `companies.json` directly and push.

Every EU-citizenship note, visa policy, and deadline in the seed data is a placeholder — verify all of it directly on each company's careers page.

## Privacy, fonts, and licensing

- **Nothing is collected.** No accounts, no backend, no analytics, no cookies, no third-party scripts. Your edits live in your own browser's `localStorage` and never leave your device.
- **Fonts are self-hosted.** Fraunces, Inter, and JetBrains Mono are served from `fonts/` rather than loaded from `fonts.gstatic.com`, so no visitor IP address is handed to Google — the practice a German court found to be a GDPR violation in 2022. To refresh them, re-download the WOFF2 files and regenerate `fonts/fonts.css`.
- **Font licenses.** All three typefaces are SIL Open Font License 1.1; see `fonts/OFL.txt` and `fonts/ATTRIBUTION.txt`.
- **Site license.** MIT (see `LICENSE`). Swap it if you'd rather not let others reuse the code.
- **Company names** appear only to identify the employer. The site is not affiliated with or endorsed by any company listed, and the footer says so.
