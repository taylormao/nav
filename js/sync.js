// ============================================================
// Sync — Cloudflare R2 sync via Worker proxy
// ============================================================

const CloudSync = {
  CONFIG_KEY: 'nav-r2-config',

  /** Get saved R2 config */
  getConfig() {
    try {
      const raw = localStorage.getItem(this.CONFIG_KEY);
      return raw ? JSON.parse(raw) : { workerUrl: '', authToken: '' };
    } catch (e) { return { workerUrl: '', authToken: '' }; }
  },

  /** Save R2 config (auto-add https:// if missing) */
  setConfig(workerUrl, authToken) {
    let url = workerUrl.trim();
    if (url && !/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }
    localStorage.setItem(this.CONFIG_KEY, JSON.stringify({
      workerUrl: url,
      authToken: authToken.trim(),
    }));
  },

  /** Check if R2 is configured */
  isConfigured() {
    const cfg = this.getConfig();
    return !!(cfg.workerUrl && cfg.authToken);
  },

  /** Test connection to Worker */
  async test() {
    const cfg = this.getConfig();
    if (!cfg.workerUrl || !cfg.authToken) {
      return { ok: false, error: '请先填写 Worker URL 和 Auth Token' };
    }
    try {
      const res = await fetch(cfg.workerUrl, {
        method: 'HEAD',
        headers: { 'X-Auth-Token': cfg.authToken },
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok || res.status === 405) return { ok: true }; // 405 = method not allowed but auth passed
      if (res.status === 401) return { ok: false, error: 'Auth Token 验证失败 (401)' };
      return { ok: false, error: `服务返回状态 ${res.status}` };
    } catch (e) {
      return { ok: false, error: `连接失败: ${e.message}` };
    }
  },

  /** Push data to R2 */
  async push() {
    const cfg = this.getConfig();
    if (!cfg.workerUrl || !cfg.authToken) {
      return { ok: false, error: '请先配置 R2 连接' };
    }
    try {
      const payload = {
        navData: DataStore.load(),
        searchEngine: localStorage.getItem('nav-search-engine') || 'google',
        theme: localStorage.getItem('nav-theme') || null,
        background: localStorage.getItem('nav-bg') || null,
        updatedAt: new Date().toISOString(),
      };
      const res = await fetch(cfg.workerUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': cfg.authToken,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) return { ok: true };
      const body = await res.text();
      return { ok: false, error: `上传失败 ${res.status}: ${body}` };
    } catch (e) {
      return { ok: false, error: `请求失败: ${e.message}` };
    }
  },

  /** Pull data from R2 and merge into localStorage */
  async pull() {
    const cfg = this.getConfig();
    if (!cfg.workerUrl || !cfg.authToken) {
      return { ok: false, error: '请先配置 R2 连接' };
    }
    try {
      const res = await fetch(cfg.workerUrl, {
        method: 'GET',
        headers: { 'X-Auth-Token': cfg.authToken },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) return { ok: false, error: `拉取失败 (${res.status})` };
      const payload = await res.json();
      if (!payload.navData || !Array.isArray(payload.navData)) {
        return { ok: false, error: 'R2 中数据格式无效' };
      }
      // Merge into localStorage
      DataStore.save(payload.navData);
      if (payload.searchEngine) localStorage.setItem('nav-search-engine', payload.searchEngine);
      if (payload.theme) localStorage.setItem('nav-theme', payload.theme); else localStorage.removeItem('nav-theme');
      if (payload.background) localStorage.setItem('nav-bg', payload.background); else localStorage.removeItem('nav-bg');
      return { ok: true, data: payload };
    } catch (e) {
      return { ok: false, error: `请求失败: ${e.message}` };
    }
  },

  /** Auto-sync: push after local change (fires silently, no UI feedback needed) */
  async autoPush() {
    if (!this.isConfigured()) return;
    try {
      await this.push();
    } catch (e) { /* silent failure */ }
  },

  /** Auto-pull on page load if configured */
  async autoPull() {
    if (!this.isConfigured()) return;
    try {
      const result = await this.pull();
      if (result.ok && result.data) {
        // Apply theme & background immediately
        if (result.data.theme) {
          Theme.apply(result.data.theme);
        }
        if (result.data.background) {
          try {
            const bg = JSON.parse(result.data.background);
            if (window.setBodyBackground && (bg.image || bg.color)) {
              window.setBodyBackground(bg);
            }
          } catch (e) { /* skip */ }
        }
        // Update search engine UI
        const engine = result.data.searchEngine || 'google';
        document.querySelectorAll('.engine-btn').forEach(b => {
          b.classList.toggle('active', b.dataset.engine === engine);
        });
        return true;
      }
    } catch (e) { /* silent failure — use local data */ }
    return false;
  },
};
