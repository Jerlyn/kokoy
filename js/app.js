/* Kokoy Dictionary — core app logic
   No frameworks, no build step: plain JS so it stays easy to maintain
   and works identically in the PWA and (later) the Chrome extension. */

(function () {
  "use strict";

  let dictionary = [];
  let activeCategory = ""; // "" = All

  // Fixed display order for the taxonomy — keeps chips and grouped sections
  // in a stable, sensible order instead of whatever order Set() happens to
  // produce.
  const CATEGORY_ORDER = [
    "Family & People",
    "Body & Health",
    "Food & Drink",
    "Animals",
    "Time & Days",
    "Character & Emotion",
    "Actions",
    "Everyday Objects & Places",
    "Descriptive Words",
    "Common Expressions",
  ];

  const els = {
    searchInput: document.getElementById("search-input"),
    categoryChips: document.getElementById("category-chips"),
    resultCount: document.getElementById("result-count"),
    wordList: document.getElementById("word-list"),
    wotdWord: document.getElementById("wotd-word"),
    wotdEnglish: document.getElementById("wotd-english"),
    wotdPron: document.getElementById("wotd-pron"),
    suggestForm: document.getElementById("suggest-form"),
    suggestStatus: document.getElementById("suggest-status"),
    suggestAccessKey: document.getElementById("s-access-key"),
    suggestGithubBtn: document.getElementById("suggest-github-btn"),
    kofiLink: document.getElementById("kofi-link"),
    footerEmail: document.getElementById("footer-email"),
    installBanner: document.getElementById("install-banner"),
    installBtn: document.getElementById("install-btn"),
  };

  // ---- Data loading -------------------------------------------------

  async function loadData() {
    const dictRes = await fetch("data/dictionary.json");
    dictionary = await dictRes.json();
  }

  // ---- Word of the day ------------------------------------------------
  // Deterministic by calendar date, so everyone sees the same word,
  // and it's stable if the app is reopened later the same day.

  function dayOfYear(date) {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date - start;
    return Math.floor(diff / 86400000);
  }

  function renderWordOfTheDay() {
    if (!dictionary.length) return;
    const idx = dayOfYear(new Date()) % dictionary.length;
    const word = dictionary[idx];
    els.wotdWord.textContent = word.kokoy;
    els.wotdEnglish.textContent = word.english;
    els.wotdPron.textContent = word.pronunciation ? `/${word.pronunciation}/` : "";
  }

  // ---- Category chips ---------------------------------------------------

  function populateCategoryChips() {
    const present = new Set(dictionary.map((w) => w.category).filter(Boolean));
    const orderedCats = CATEGORY_ORDER.filter((c) => present.has(c));

    els.categoryChips.innerHTML = "";
    els.categoryChips.appendChild(makeChip("All", ""));
    for (const cat of orderedCats) {
      const count = dictionary.filter((w) => w.category === cat).length;
      els.categoryChips.appendChild(makeChip(`${cat} (${count})`, cat));
    }
    updateChipState();
  }

  function makeChip(label, value) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip";
    btn.textContent = label;
    btn.dataset.category = value;
    btn.setAttribute("aria-pressed", "false");
    btn.addEventListener("click", () => {
      activeCategory = value;
      updateChipState();
      renderResults();
    });
    return btn;
  }

  function updateChipState() {
    els.categoryChips.querySelectorAll(".chip").forEach((chip) => {
      chip.setAttribute("aria-pressed", String(chip.dataset.category === activeCategory));
    });
  }

  // ---- Search & render --------------------------------------------------

  function matches(word, query, category) {
    const q = query.trim().toLowerCase();
    const inCategory = !category || word.category === category;
    if (!inCategory) return false;
    if (!q) return true;
    return (
      word.kokoy.toLowerCase().includes(q) ||
      word.english.toLowerCase().includes(q)
    );
  }

  function renderWordCard(word) {
    const li = document.createElement("li");
    li.className = "word-card";

    const details = document.createElement("details");
    const summary = document.createElement("summary");

    const left = document.createElement("span");
    left.innerHTML = `<span class="word-kokoy">${escapeHtml(word.kokoy)}</span> <span class="word-english">— ${escapeHtml(word.english)}</span>`;
    if (word.category) {
      const tag = document.createElement("span");
      tag.className = "word-tag";
      tag.textContent = word.category;
      left.appendChild(tag);
    }
    summary.appendChild(left);
    details.appendChild(summary);

    const dl = document.createElement("dl");
    dl.className = "word-detail";
    let hasDetail = false;

    if (word.pronunciation) {
      hasDetail = true;
      dl.innerHTML += `<dt>Pronunciation</dt><dd>/${escapeHtml(word.pronunciation)}/</dd>`;
    }
    if (word.partOfSpeech) {
      hasDetail = true;
      dl.innerHTML += `<dt>Part of speech</dt><dd>${escapeHtml(word.partOfSpeech)}</dd>`;
    }
    if (word.example && (word.example.kokoy || word.example.english)) {
      hasDetail = true;
      dl.innerHTML += `<dt>Example</dt><dd>${escapeHtml(word.example.kokoy || "")}${word.example.kokoy && word.example.english ? " — " : ""}${escapeHtml(word.example.english || "")}</dd>`;
    }
    if (word.notes) {
      hasDetail = true;
      dl.innerHTML += `<dt>Notes</dt><dd>${escapeHtml(word.notes)}</dd>`;
    }
    if (hasDetail) {
      details.appendChild(dl);
    }

    li.appendChild(details);
    return li;
  }

  // Grouped (browse) view only when there's no active search or category
  // filter — that's the "just looking around" state, where chunking by
  // category into collapsed sections beats one 217-row scroll. The moment
  // someone searches or picks a category, they want a flat answer, not a
  // folder to open first.
  function isGroupedView(query) {
    return !query.trim() && !activeCategory;
  }

  function renderResults() {
    const query = els.searchInput.value;

    if (isGroupedView(query)) {
      renderGroupedView();
      els.resultCount.textContent = `${dictionary.length} words across ${CATEGORY_ORDER.filter((c) => dictionary.some((w) => w.category === c)).length} categories`;
      return;
    }

    const filtered = dictionary.filter((w) => matches(w, query, activeCategory));

    els.wordList.innerHTML = "";
    if (!filtered.length) {
      const empty = document.createElement("li");
      empty.className = "empty-state";
      empty.textContent = "No words found. Try a different search, or suggest it below.";
      els.wordList.appendChild(empty);
    } else {
      const frag = document.createDocumentFragment();
      for (const word of filtered) {
        frag.appendChild(renderWordCard(word));
      }
      els.wordList.appendChild(frag);
    }

    els.resultCount.textContent = `${filtered.length} of ${dictionary.length} words`;
  }

  function renderGroupedView() {
    els.wordList.innerHTML = "";
    const frag = document.createDocumentFragment();

    for (const cat of CATEGORY_ORDER) {
      const words = dictionary.filter((w) => w.category === cat);
      if (!words.length) continue;

      const li = document.createElement("li");
      li.className = "category-group-wrap";

      const details = document.createElement("details");
      details.className = "category-group";

      const summary = document.createElement("summary");
      summary.innerHTML = `${escapeHtml(cat)} <span class="category-count">${words.length}</span>`;
      details.appendChild(summary);

      const nestedList = document.createElement("ul");
      nestedList.className = "word-list";
      for (const word of words) {
        nestedList.appendChild(renderWordCard(word));
      }
      details.appendChild(nestedList);

      li.appendChild(details);
      frag.appendChild(li);
    }

    els.wordList.appendChild(frag);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // ---- Suggest-a-word -----------------------------------------------------
  // Primary path: Web3Forms — no GitHub account needed, submits straight to
  // your inbox. Secondary path: pre-filled GitHub Issue, for contributors
  // who'd rather go that route. See js/config.js for the access key.

  function buildGithubIssueUrl() {
    const data = new FormData(els.suggestForm);
    const kokoy = (data.get("kokoy") || "").toString().trim();
    const english = (data.get("english") || "").toString().trim();
    const pron = (data.get("pronunciation") || "").toString().trim();
    const example = (data.get("example") || "").toString().trim();
    const contributor = (data.get("contributor") || "").toString().trim();

    const title = `Word suggestion: ${kokoy || "(untitled)"}`;
    const body = [
      `**Kokoy word/phrase:** ${kokoy}`,
      `**English meaning:** ${english}`,
      pron ? `**Pronunciation:** ${pron}` : "",
      example ? `**Example sentence:** ${example}` : "",
      contributor ? `**Suggested by:** ${contributor}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const repo = KOKOY_CONFIG.githubRepo;
    return (
      `https://github.com/${repo}/issues/new?` +
      `title=${encodeURIComponent(title)}&` +
      `body=${encodeURIComponent(body)}&` +
      `labels=${encodeURIComponent("word-suggestion")}`
    );
  }

  function setupSuggestForm() {
    if (els.suggestAccessKey) {
      els.suggestAccessKey.value = KOKOY_CONFIG.web3formsAccessKey || "";
    }

    els.suggestForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const key = KOKOY_CONFIG.web3formsAccessKey;
      if (!key || key.startsWith("YOUR-")) {
        els.suggestStatus.textContent =
          "Submissions aren't configured yet (missing Web3Forms access key in js/config.js). Use the GitHub option below instead.";
        return;
      }

      const formData = new FormData(els.suggestForm);
      const payload = Object.fromEntries(formData);
      els.suggestStatus.textContent = "Sending…";

      try {
        const response = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload),
        });
        const result = await response.json();
        if (response.ok && result.success) {
          els.suggestStatus.textContent = "Thanks! Your suggestion was sent.";
          els.suggestForm.reset();
          if (els.suggestAccessKey) els.suggestAccessKey.value = key;
        } else {
          els.suggestStatus.textContent =
            result.message || "Something went wrong sending that — try the GitHub option below instead.";
        }
      } catch (err) {
        els.suggestStatus.textContent =
          "Couldn't reach the submission service — try the GitHub option below instead.";
      }
    });

    if (els.suggestGithubBtn) {
      els.suggestGithubBtn.addEventListener("click", () => {
        const repo = KOKOY_CONFIG.githubRepo;
        if (!repo || repo.startsWith("YOUR-")) {
          els.suggestStatus.textContent = "GitHub repo isn't configured yet in js/config.js.";
          return;
        }
        window.open(buildGithubIssueUrl(), "_blank", "noopener");
      });
    }
  }

  // ---- Ko-fi / footer links ---------------------------------------------

  function setupLinks() {
    const kofi = KOKOY_CONFIG.kofiUsername;
    if (kofi && !kofi.startsWith("YOUR-")) {
      els.kofiLink.href = `https://ko-fi.com/${kofi}`;
    } else {
      els.kofiLink.href = "#donate";
      els.kofiLink.title = "Ko-fi username not yet configured in js/config.js";
    }
    if (KOKOY_CONFIG.contactEmail) {
      els.footerEmail.href = `mailto:${KOKOY_CONFIG.contactEmail}`;
    }
  }

  // ---- Install banner (PWA) ---------------------------------------------

  let deferredPrompt = null;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    els.installBanner.classList.add("visible");
  });

  els.installBtn.addEventListener("click", async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    els.installBanner.classList.remove("visible");
  });

  window.addEventListener("appinstalled", () => {
    els.installBanner.classList.remove("visible");
  });

  // ---- Accordion anchor support -----------------------------------------
  // About and Suggest are collapsed <details> so Word of the Day and the
  // Dictionary stay the visual focus. Nav links still point at #about and
  // #suggest (the <details> elements themselves), so this just makes sure
  // browsers that don't yet auto-expand <details> on anchor jump do so,
  // and keeps it working the same way on click, hash-on-load, and back/forward.

  function openAccordionFromHash() {
    const id = window.location.hash.slice(1);
    if (!id) return;
    const el = document.getElementById(id);
    if (el && el.tagName === "DETAILS" && !el.open) {
      el.open = true;
    }
  }

  function setupAccordionAnchors() {
    document.querySelectorAll('nav.site-nav a[href^="#"]').forEach((link) => {
      link.addEventListener("click", () => {
        const id = link.getAttribute("href").slice(1);
        const el = document.getElementById(id);
        if (el && el.tagName === "DETAILS") {
          el.open = true;
        }
      });
    });
    window.addEventListener("hashchange", openAccordionFromHash);
    openAccordionFromHash(); // handle direct load with a #about / #suggest URL
  }

  // ---- Service worker -----------------------------------------------

  function registerServiceWorker() {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("sw.js").catch((err) => {
        console.warn("Service worker registration failed:", err);
      });
    }
  }

  // ---- Init ------------------------------------------------------------

  async function init() {
    setupLinks();
    setupSuggestForm();
    await loadData();
    populateCategoryChips();
    renderWordOfTheDay();
    renderResults();
    els.searchInput.addEventListener("input", renderResults);
    setupAccordionAnchors();
    registerServiceWorker();
  }

  init();
})();
