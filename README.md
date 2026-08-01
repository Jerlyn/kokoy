# Kokoy Dictionary

A searchable, installable dictionary preserving **Kokoy**, the English-based creole spoken in the northeast villages of Dominica: Marigot, Wesley, Woodford Hill, and Clifton.

Built as a Progressive Web App (PWA) — no build tools, no framework, no backend. It runs entirely as static files, works offline once installed, and is free to host on GitHub Pages.

## Features

- Full-text search across all dictionary entries (Kokoy → English and English → Kokoy)
- Category filtering
- Word of the Day (deterministic by calendar date — same word for everyone, every day)
- Offline support via service worker (installable on phone or desktop)
- "Suggest a word" form that opens a pre-filled GitHub Issue — no login-gated backend to maintain
- Ko-fi donate button
- WCAG AA color contrast throughout (verified programmatically, see `docs/accessibility-check.md` if present)

## Project structure

```
kokoy-pwa/
├── index.html              Main page — dictionary, about, suggest, donate
├── manifest.json           PWA manifest (install metadata)
├── sw.js                   Service worker (offline caching)
├── css/styles.css          All styling, brand palette, WCAG AA contrast
├── js/
│   ├── config.js           EDIT THIS — your GitHub repo + Ko-fi username
│   └── app.js               Search, word of the day, forms, install prompt
├── data/
│   ├── dictionary.json     217 words, seeded from your spreadsheet
│   └── phrases.json        Common expressions schema, prepared but not
│                            currently wired into the UI (removed 2026-08-01,
│                            data kept for when it's ready to bring back)
└── icons/                  App icons (192/512, standard + maskable)
```

## 1. Before you deploy: edit `js/config.js`

Three values need to be set:

Already set:

```js
githubRepo: "Jerlyn/kokoy",
kofiUsername: "designlady",
contactEmail: "jerlyn@designlady.com",
```

Until `githubRepo` is set, the "Suggest a word" button will show an alert instead of opening GitHub. Until `kofiUsername` is set, the Donate button links to the Donate section instead of Ko-fi.

## 2. Push to GitHub

The `kokoy` repo already exists at `github.com/Jerlyn/kokoy`. Connect this local folder to it.

**Terminal:**

```bash
cd "/Users/jerlynodonnell/Documents/Language/Kokoy/kokoy-pwa"
git init
git add .
git commit -m "Initial Kokoy Dictionary PWA"
git branch -M main
git remote add origin https://github.com/Jerlyn/kokoy.git
git push -u origin main
```

If the repo already has a commit (e.g. GitHub auto-created a README when you made it), that last push will be rejected as a non-fast-forward. Fix with:

```bash
git pull origin main --allow-unrelated-histories
# resolve any conflicting files (likely just README.md), then:
git add .
git commit -m "Merge existing repo history"
git push -u origin main
```

**GitHub Desktop:**

1. File → Add Local Repository → select the `kokoy-pwa` folder.
2. If it says the folder isn't a Git repository, click "create a repository" in that dialog, keep the path, then Create.
3. Write a summary ("Initial Kokoy Dictionary PWA") and click Commit to main.
4. Repository menu (top menu bar) → Repository Settings → Remote tab → set Primary remote repository to `https://github.com/Jerlyn/kokoy.git` → Save.
5. Click **Push origin** (top toolbar). If Desktop says the remote has work you don't have, use **Repository → Pull** first (it'll offer to merge unrelated histories), resolve any conflicts it flags, commit the merge, then Push origin again.

## 3. Turn on GitHub Pages

1. On GitHub: **Settings → Pages**
2. Source: **Deploy from a branch**
3. Branch: **main**, folder: **/ (root)**
4. Save. Your site will be live at `https://Jerlyn.github.io/kokoy/` within a minute or two.

## 4. Create the "word-suggestion" label

The suggestion form pre-fills a GitHub Issue with the label `word-suggestion`. GitHub silently ignores labels that don't exist yet, so create it once:

**Issues → Labels → New label** → name it `word-suggestion`.

## 5. Set up Ko-fi

Create a free account at [ko-fi.com](https://ko-fi.com), note your username from your page URL (`ko-fi.com/<username>`), and drop it into `js/config.js`.

## Data & content licensing (default — change if you'd rather use something else)

This scaffold assumes:

- **Code** (HTML/CSS/JS): MIT License — permissive, standard for open source tooling.
- **Dictionary content** (words, phrases, translations): Creative Commons Attribution 4.0 (CC BY 4.0) — anyone can reuse or build on the dictionary as long as they credit the project, which fits a language-preservation goal better than an all-rights-reserved default.

See `LICENSE` (code) and `LICENSE-CONTENT.md` (dictionary data). Change either if you want different terms.

## Testing locally before you deploy

Service workers require a server (not `file://`). From this folder:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000` in a browser.

## What's next (not built yet)

- **Chrome extension**: a thin wrapper reusing `data/dictionary.json` and the same search logic, planned as the next phase.
- **Pronunciation audio**: `dictionary.json` has an `audio` field per entry (currently empty) for when you're ready to record and link audio clips.
- **GitHub Actions auto-deploy**: optional — GitHub Pages "deploy from branch" (above) needs no Action, but one can be added later if the project grows a build step.
