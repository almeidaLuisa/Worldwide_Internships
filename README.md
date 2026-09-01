# Internship Search Tracker

A small static site for tracking Summer 2027 computer engineering internships outside the US. Companies are grouped into 12 categories — Big Tech / Multinationals; Enterprise Software & Hardware (Europe); Consumer Tech & Fintech (Europe); Canada; Trading Firms — FPGA / Low-Latency Hardware; FPGA, EDA & Reconfigurable Computing; Semiconductor & Hardware Manufacturers; Germany; Estonia; Latin America; Singapore; Startups & Scale-ups — each row is editable in the browser, and your edits persist locally via `localStorage`.

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

## Using the page

Each category header has a minimize button (or click the title row) to collapse that section; **Collapse all** in the toolbar folds every section down to its heading so you can see the whole shape of the list at once. Hovering a section header also reveals up/down arrows to reorder it — handy for pushing the country sections to the top. Collapsed state and section order are each remembered per browser in their own storage keys, separate from the company data; once you set an order it takes precedence over the seed, and categories added later appear at the bottom. Jumping to a category from the top nav opens it automatically.

## Notes on the data

`companies.json` holds the seed data. Once you start editing in the browser, your changes live in that browser's `localStorage`, not in the JSON file — so they won't show up for someone else visiting the deployed URL, and clearing site data will wipe them. To make an edit "official" for everyone (including future-you on a different device), edit `companies.json` directly and push.

On every load the page also merges `companies.json` into your saved copy: **new** categories and companies are appended, while rows you already have are left exactly as you edited them. So adding companies to the JSON and pushing makes them appear for you without a reset and without losing any statuses or notes. The save indicator reads `+N new from the list` when this happens. Rows you delete are recorded in a `deleted` list so a later merge doesn't bring them back; "Reset to defaults" clears that list along with everything else.

To retire a category into another one, add a top-level `categoryMerges` map to `companies.json` (e.g. `{"Old Name": "New Name"}`). On the next load each browser moves its saved rows — edits and all — into the target category and drops the old one, so nobody ends up with both. Category order also follows the seed.

To withdraw a company, remove it from its category **and** add its `"Category::Company"` key to a top-level `retiredCompanies` array — deleting it from the seed alone leaves it sitting in every browser that already saved it.

The merge matches on category name plus company name. If you rename a company cell that came from the seed, the merge treats the original as missing and re-adds it — rename in `companies.json` instead, or delete the row rather than blanking it.

Every EU-citizenship note, visa policy, and deadline in the seed data is a placeholder — verify all of it directly on each company's careers page.

## Privacy, fonts, and licensing

- **Nothing is collected by default.** No accounts, no backend, no cookies. Your edits live in your own browser's `localStorage` and never leave your device.
- **Optional visitor counts.** `index.html` ends with a GoatCounter snippet that is inert until you replace `YOURCODE` with your site code from [goatcounter.com](https://www.goatcounter.com/signup). Until then no third-party request is made and the footer states there is no tracking; filling it in both enables counting and rewrites that footer line to say what is collected. GoatCounter sets no cookies and stores no personal data, so no consent banner is needed — but keep the footer honest if you ever swap it for something that does.
- **Fonts are self-hosted.** Fraunces, Inter, and JetBrains Mono are served from `fonts/` rather than loaded from `fonts.gstatic.com`, so no visitor IP address is handed to Google — the practice a German court found to be a GDPR violation in 2022. To refresh them, re-download the WOFF2 files and regenerate `fonts/fonts.css`.
- **Font licenses.** All three typefaces are SIL Open Font License 1.1; see `fonts/OFL.txt` and `fonts/ATTRIBUTION.txt`.
- **Site license.** MIT (see `LICENSE`). Swap it if you'd rather not let others reuse the code.
- **Company names** appear only to identify the employer. The site is not affiliated with or endorsed by any company listed, and the footer says so.
