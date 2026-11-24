/**
 * Professional Internationalized Search Engine
 * Features:
 * - Instant live filtering & responsive feedback
 * - Diacritic & accent insensitivity (Unicode NFD normalization)
 * - Punctuation & hyphen insensitivity (e.g. car-x -> carx, tik-tok -> tiktok)
 * - Single-letter & prefix prioritization (e.g. 'p' -> Pokemon, 'g' -> GBox)
 * - Multi-word queries in any order (e.g. 'spoofer pokemon' -> Pokemon GO Spoofer)
 * - Compact queries without spaces (e.g. 'subwaysurfers', 'pokemongo', '8ball')
 * - Typo tolerance & misspelling detection (Damerau-Levenshtein distance)
 * - Phonetic similarity handling (e.g. 'toka' -> Toca, 'karx' -> CarX)
 * - Relevance scoring with intelligent sorting
 * - URL query parameter support (?q= or ?search=)
 */
(function () {
  "use strict";

  const STOP_WORDS = new Set([
    "for", "ios", "android", "no", "and", "the", "with", "all", "app", "easy", "free", "installer"
  ]);

  function normalizeText(text) {
    if (!text) return "";
    try {
      // Decompose Unicode accents/diacritics
      const nfkd = text.normalize("NFD");
      const stripped = nfkd.replace(/[\u0300-\u036f]/g, "");
      const lowered = stripped.toLowerCase();
      const cleaned = lowered.replace(/[^a-z0-9]+/g, " ");
      return cleaned.trim().replace(/\s+/g, " ");
    } catch (e) {
      return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, " ");
    }
  }

  function editDistance(s1, s2) {
    const m = s1.length;
    const n = s2.length;
    if (Math.abs(m - n) > 2) return Math.abs(m - n);

    const d = [];
    for (let i = 0; i <= m; i++) {
      d[i] = [i];
    }
    for (let j = 0; j <= n; j++) {
      d[0][j] = j;
    }

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        d[i][j] = Math.min(
          d[i - 1][j] + 1,       // deletion
          d[i][j - 1] + 1,       // insertion
          d[i - 1][j - 1] + cost // substitution
        );
        // Damerau adjacent transposition
        if (i > 1 && j > 1 && s1[i - 1] === s2[j - 2] && s1[i - 2] === s2[j - 1]) {
          d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
        }
      }
    }
    return d[m][n];
  }

  function phoneticSimplify(s) {
    let simplified = s
      .replace(/ck/g, "k")
      .replace(/c/g, "k")
      .replace(/ph/g, "f")
      .replace(/z/g, "s");
    const res = [];
    for (let i = 0; i < simplified.length; i++) {
      if (i === 0 || simplified[i] !== simplified[i - 1]) {
        res.push(simplified[i]);
      }
    }
    return res.join("");
  }

  function matchToken(token, word, isTitle) {
    const tLen = token.length;
    const wLen = word.length;
    if (!word || !token) return 0;

    // Skip generic stop words for non-exact matches
    if (STOP_WORDS.has(word) && token !== word) {
      return 0;
    }

    // 1. Exact match
    if (token === word) {
      return 1000;
    }

    // 2. Word starts with token (prefix)
    if (word.startsWith(token)) {
      return 800 + Math.min(150, Math.floor(150 * (tLen / wLen)));
    }

    // 3. Word contains token
    if (word.indexOf(token) !== -1) {
      return 600;
    }

    // 4. Token starts with word
    if (token.startsWith(word) && wLen >= 3) {
      return 500;
    }

    // 5. Typo tolerance (only on title or distinct keywords, token length >= 3)
    if (tLen >= 3 && (isTitle || !STOP_WORDS.has(word))) {
      const maxDist = tLen <= 5 ? 1 : 2;

      // Full word edit distance
      const dist = editDistance(token, word);
      if (dist <= maxDist) {
        return 500 - dist * 120;
      }

      // Prefix edit distance (e.g. 'subway' in 'subwaysurfers')
      if (wLen > tLen) {
        for (let l of [tLen, tLen + 1]) {
          if (l <= wLen) {
            const prefDist = editDistance(token, word.slice(0, l));
            if (prefDist <= maxDist) {
              return 450 - prefDist * 120;
            }
          }
        }
      }

      // Phonetic equivalence
      const pToken = phoneticSimplify(token);
      const pWord = phoneticSimplify(word);
      if (pToken === pWord || pWord.startsWith(pToken)) {
        return 400;
      }
      if (pToken.length >= 3 && editDistance(pToken, pWord) <= 1) {
        return 350;
      }
    }

    return 0;
  }

  function scoreProduct(query, itemData) {
    const normQ = normalizeText(query);
    if (!normQ) return 100; // Empty query shows all

    const qTokens = normQ.split(" ");
    const compactQ = normQ.replace(/\s+/g, "");

    const compactTitle = itemData.compactTitle;
    const compactSlug = itemData.compactSlug;
    const titleWords = itemData.titleWords;
    const descWords = itemData.descWords;
    const slugWords = itemData.slugWords;

    let totalScore = 0;

    // Single letter search: give top priority to items whose title starts with the letter
    if (qTokens.length === 1 && qTokens[0].length === 1) {
      const singleChar = qTokens[0];
      if (titleWords.length > 0 && titleWords[0].startsWith(singleChar)) {
        totalScore += 10000;
      } else if (titleWords.some((w) => w.startsWith(singleChar))) {
        totalScore += 5000;
      } else if (compactTitle.startsWith(singleChar)) {
        totalScore += 7000;
      } else if (compactTitle.indexOf(singleChar) !== -1) {
        totalScore += 1000;
      } else if (itemData.descNorm.indexOf(singleChar) !== -1) {
        totalScore += 100;
      }
      return totalScore;
    }

    // Exact compact match (e.g. 'pokemongo' matches 'Pokemon GO Spoofer')
    if (compactQ === compactTitle) {
      totalScore += 20000;
    } else if (compactTitle.startsWith(compactQ)) {
      totalScore += 12000;
    } else if (compactTitle.indexOf(compactQ) !== -1) {
      totalScore += 8000;
    } else if (compactSlug.indexOf(compactQ) !== -1) {
      totalScore += 6000;
    } else if (compactQ.length >= 4 && editDistance(compactQ, compactTitle.slice(0, compactQ.length)) <= 1) {
      totalScore += 7000;
    }

    // Full phrase in title
    if (itemData.titleNorm.indexOf(normQ) !== -1) {
      totalScore += 9000;
    }

    // Token-by-token evaluation
    let tokensMatched = 0;
    for (let i = 0; i < qTokens.length; i++) {
      const token = qTokens[i];
      let bestTokenScore = 0;

      // Check title words (weighted x5)
      for (let j = 0; j < titleWords.length; j++) {
        const sc = matchToken(token, titleWords[j], true);
        if (sc * 5 > bestTokenScore) {
          bestTokenScore = sc * 5;
        }
      }

      // Check slug words (weighted x3)
      for (let j = 0; j < slugWords.length; j++) {
        const sc = matchToken(token, slugWords[j], true);
        if (sc * 3 > bestTokenScore) {
          bestTokenScore = sc * 3;
        }
      }

      // Check description words
      for (let j = 0; j < descWords.length; j++) {
        const sc = matchToken(token, descWords[j], false);
        if (sc > bestTokenScore) {
          bestTokenScore = sc;
        }
      }

      if (bestTokenScore > 0) {
        tokensMatched++;
        totalScore += bestTokenScore;
      }
    }

    if (tokensMatched === qTokens.length) {
      return totalScore;
    }

    return 0;
  }

  function initSearchEngine() {
    const filterInput = document.getElementById("filter");
    const appList = document.getElementById("app-list");
    const searchForm = document.getElementById("app-search-id");
    const emptyState = document.getElementById("empty-search-state");

    if (!filterInput || !appList) return;

    // Prevent form submission on Enter
    if (searchForm) {
      searchForm.addEventListener("submit", function (e) {
        e.preventDefault();
      });
      searchForm.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
        }
      });
    }

    // Index all items in memory once for instant execution
    const domItems = Array.from(appList.querySelectorAll("li.app-search-item"));
    const itemsData = domItems.map(function (elem, index) {
      const title = elem.querySelector(".app-title")?.textContent.trim() || elem.getAttribute("data-app-title") || "";
      const desc = elem.querySelector(".app-description")?.textContent.trim() || "";
      const slug = elem.getAttribute("data-app-slug") || "";
      const tag = elem.querySelector(".app-author")?.textContent.trim() || "";

      const titleNorm = normalizeText(title);
      const descNorm = normalizeText(desc);
      const slugNorm = normalizeText(slug);
      const tagNorm = normalizeText(tag);

      return {
        elem: elem,
        initialIndex: index,
        title: title,
        titleNorm: titleNorm,
        descNorm: descNorm,
        slugNorm: slugNorm,
        compactTitle: titleNorm.replace(/\s+/g, ""),
        compactSlug: slugNorm.replace(/[^a-z0-9]+/g, ""),
        titleWords: titleNorm.split(" "),
        descWords: descNorm.split(" "),
        slugWords: slugNorm.replace(/[^a-z0-9]+/g, " ").split(" ")
      };
    });

    function applyFilter() {
      const query = (filterInput.value || "").trim();

      if (!query) {
        // Reset: show all in original order
        itemsData.forEach(function (it) {
          it.elem.style.display = "flex";
          it.elem.classList.remove("is-hidden");
        });
        // Sort back to initial DOM order
        itemsData
          .slice()
          .sort((a, b) => a.initialIndex - b.initialIndex)
          .forEach((it) => appList.appendChild(it.elem));

        if (emptyState) {
          emptyState.style.display = "none";
          emptyState.classList.remove("is-visible");
        }
        return;
      }

      const scored = [];
      let visibleCount = 0;

      for (let i = 0; i < itemsData.length; i++) {
        const item = itemsData[i];
        const score = scoreProduct(query, item);
        if (score > 0) {
          scored.push({ item: item, score: score });
          item.elem.style.display = "flex";
          item.elem.classList.remove("is-hidden");
          visibleCount++;
        } else {
          item.elem.style.display = "none";
          item.elem.classList.add("is-hidden");
        }
      }

      // Sort matching items by relevance descending
      scored.sort(function (a, b) {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return a.item.initialIndex - b.item.initialIndex;
      });

      // Reorder in DOM
      for (let i = 0; i < scored.length; i++) {
        appList.appendChild(scored[i].item.elem);
      }

      if (emptyState) {
        if (visibleCount === 0) {
          emptyState.innerHTML = `No matching plugin apps found for "<b>${escapeHtml(query)}</b>". <button type="button" id="search-reset-btn" style="background:#00ff88;color:#0b1928;border:none;padding:5px 12px;border-radius:4px;font-weight:700;margin-left:8px;cursor:pointer;">Clear Search</button>`;
          emptyState.style.display = "block";
          emptyState.classList.add("is-visible");

          const resetBtn = document.getElementById("search-reset-btn");
          if (resetBtn) {
            resetBtn.addEventListener("click", function () {
              filterInput.value = "";
              applyFilter();
              filterInput.focus();
            });
          }
        } else {
          emptyState.style.display = "none";
          emptyState.classList.remove("is-visible");
        }
      }
    }

    function escapeHtml(str) {
      return str.replace(/[&<>"']/g, function (m) {
        switch (m) {
          case "&": return "&amp;";
          case "<": return "&lt;";
          case ">": return "&gt;";
          case '"': return "&quot;";
          case "'": return "&#039;";
          default: return m;
        }
      });
    }

    // Attach listeners for immediate, punctual response
    filterInput.addEventListener("input", applyFilter);
    filterInput.addEventListener("keyup", applyFilter);
    filterInput.addEventListener("paste", function () {
      setTimeout(applyFilter, 10);
    });
    filterInput.addEventListener("search", applyFilter);

    // Escape key to reset search
    filterInput.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        filterInput.value = "";
        applyFilter();
      }
    });

    // Check for query parameters (?q= or ?search= or ?filter=)
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const initialQuery = urlParams.get("search") || urlParams.get("q") || urlParams.get("filter");
      if (initialQuery) {
        filterInput.value = initialQuery;
        applyFilter();
      }
    } catch (e) {}

    // Expose search function globally if needed
    window.siteSearchEngine = applyFilter;
  }

  // Initialize once DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSearchEngine);
  } else {
    initSearchEngine();
  }
})();
