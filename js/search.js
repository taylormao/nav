// ============================================================
// Search Manager — engine switching & query routing
// ============================================================

const Search = {
  STORAGE_KEY: 'nav-search-engine',

  engines: {
    google: {
      name: 'Google',
      url: 'https://www.google.com/search?q=',
    },
    bing: {
      name: 'Bing',
      url: 'https://www.bing.com/search?q=',
    },
    baidu: {
      name: '百度',
      url: 'https://www.baidu.com/s?wd=',
    },
    duckduckgo: {
      name: 'DuckDuckGo',
      url: 'https://duckduckgo.com/?q=',
    },
  },

  /** Get the currently selected engine id */
  getEngine() {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored && this.engines[stored]) return stored;
    return 'google'; // default
  },

  /** Set and persist the selected engine */
  setEngine(engineId) {
    if (!this.engines[engineId]) return;
    localStorage.setItem(this.STORAGE_KEY, engineId);
    this._updateUI(engineId);
  },

  /** Highlight the active engine button */
  _updateUI(engineId) {
    document.querySelectorAll('.engine-btn').forEach(btn => {
      const isActive = btn.dataset.engine === engineId;
      btn.classList.toggle('active', isActive);
    });
  },

  /** Execute search: redirect to the search engine with query */
  search(query) {
    const trimmed = query.trim();
    if (!trimmed) return;

    const engine = this.getEngine();
    const baseUrl = this.engines[engine].url;
    const finalUrl = baseUrl + encodeURIComponent(trimmed);
    window.open(finalUrl, '_blank');
  },

  /** Initialize: bind events, set initial engine state */
  init() {
    const currentEngine = this.getEngine();
    this._updateUI(currentEngine);

    // Engine button clicks
    document.getElementById('engineSelector').addEventListener('click', (e) => {
      const btn = e.target.closest('.engine-btn');
      if (!btn) return;
      this.setEngine(btn.dataset.engine);
    });

    // Search input
    const input = document.getElementById('searchInput');
    const clearBtn = document.getElementById('searchClear');

    // Submit on Enter
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.search(input.value);
      }
    });

    // Clear button
    clearBtn.addEventListener('click', () => {
      input.value = '';
      input.focus();
      clearBtn.classList.remove('visible');
    });

    // Show/hide clear button
    input.addEventListener('input', () => {
      clearBtn.classList.toggle('visible', input.value.length > 0);
    });
  },
};
