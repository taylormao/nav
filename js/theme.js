// ============================================================
// Theme Manager — dark/light mode toggle
// ============================================================

const Theme = {
  STORAGE_KEY: 'nav-theme',

  /** Get current theme: 'light' | 'dark' */
  get() {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;

    // First visit: check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  },

  /** Apply theme to DOM */
  apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  },

  /** Toggle between light and dark */
  toggle() {
    const current = this.get();
    const next = current === 'dark' ? 'light' : 'dark';
    this.set(next);
  },

  /** Set and persist a theme */
  set(theme) {
    localStorage.setItem(this.STORAGE_KEY, theme);
    this.apply(theme);
  },

  /** Initialize theme on page load */
  init() {
    const theme = this.get();
    this.apply(theme);

    // Listen for system preference changes (only if user hasn't set a preference)
    if (window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        // Only auto-switch if user hasn't manually set a preference
        if (!localStorage.getItem(this.STORAGE_KEY)) {
          this.apply(e.matches ? 'dark' : 'light');
        }
      });
    }
  },
};
