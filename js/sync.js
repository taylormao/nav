// ============================================================
// Sync — Cloudflare R2 sync via Worker proxy
// Auto-sync on load (pull) and on every data change (push)
// ============================================================

// ⚠️ 默认 R2 配置 — 硬编码在页面中，所有访客可见
// 安全性：仅用于个人/小团队导航页，Token 可读写你的 R2 数据
const DEFAULT_R2_CONFIG = {
  workerUrl: 'https://nav-r2-sync.mds37215735.workers.dev',
  authToken: 'nav-r2-mysecret2026',
};

const CloudSync = {
  CONFIG_KEY: 'nav-r2-config',
  LAST_PUSH_KEY: 'nav-r2-lastpush',
  _pushTimer: null,

  /** Get R2 config: admin panel override first, then defaults */
  getConfig() {
    try {
      const raw = localStorage.getItem(this.CONFIG_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved.workerUrl && saved.authToken) return saved;
      }
    } catch (e) { /* use defaults */ }
    return { ...DEFAULT_R2_CONFIG };
  },

  /** Check if R2 is configured (always true with defaults) */
  isConfigured() {
    const cfg = this.getConfig();
    return !!(cfg.workerUrl && cfg.authToken);
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
      if (res.ok) return { ok: true };
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
      const now = new Date().toISOString();
      const payload = {
        navData: DataStore.load(),
        searchEngine: localStorage.getItem('nav-search-engine') || 'google',
        theme: localStorage.getItem('nav-theme') || null,
        background: localStorage.getItem('nav-bg') || null,
        updatedAt: now,
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
      if (res.ok) {
        localStorage.setItem(this.LAST_PUSH_KEY, now);
        return { ok: true };
      }
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
      // Check if remote is actually newer than our last push
      if (payload.updatedAt) {
        const lastPush = localStorage.getItem(this.LAST_PUSH_KEY);
        if (lastPush && payload.updatedAt <= lastPush) {
          return { ok: true, data: payload, skipped: true };
        }
      }
      // Merge into localStorage
      DataStore.save(payload.navData);
      if (payload.searchEngine) localStorage.setItem('nav-search-engine', payload.searchEngine);
      if (payload.theme) localStorage.setItem('nav-theme', payload.theme); else localStorage.removeItem('nav-theme');
      if (payload.background) localStorage.setItem('nav-bg', payload.background); else localStorage.removeItem('nav-bg');
      if (payload.updatedAt) localStorage.setItem(this.LAST_PUSH_KEY, payload.updatedAt);
      return { ok: true, data: payload };
    } catch (e) {
      return { ok: false, error: `请求失败: ${e.message}` };
    }
  },

  /** Auto-push on data change (debounced, logged) */
  autoPush() {
    if (!this.isConfigured()) { console.log('[Sync] 未配置，跳过推送'); return; }
    console.log('[Sync] 数据变更，500ms 后自动推送...');
    clearTimeout(this._pushTimer);
    this._pushTimer = setTimeout(async () => {
      const r = await this.push();
      console.log('[Sync] 推送结果:', r.ok ? '✅ 成功' : '❌ ' + r.error);
    }, 500);
  },

  /** Auto-pull on page load — always pulls, merges if remote is newer */
  async autoPull() {
    if (!this.isConfigured()) { console.log('[Sync] 未配置，跳过拉取'); return false; }
    console.log('[Sync] 页面加载，从 R2 拉取...');
    try {
      const result = await this.pull();
      if (result.skipped) { console.log('[Sync] 远程数据未变化，跳过'); return false; }
      if (result.ok && result.data) {
        console.log('[Sync] 拉取成功，合并数据');
        if (result.data.theme) Theme.apply(result.data.theme);
        if (result.data.background) {
          try {
            const bg = JSON.parse(result.data.background);
            if (window.setBodyBackground && (bg.image || bg.color)) {
              window.setBodyBackground(bg);
            }
          } catch (e) { /* skip */ }
        }
        const engine = result.data.searchEngine || 'google';
        document.querySelectorAll('.engine-btn').forEach(b => {
          b.classList.toggle('active', b.dataset.engine === engine);
        });
        return true;
      }
      console.log('[Sync] 拉取失败:', result.error);
    } catch (e) { console.log('[Sync] 拉取异常:', e.message); }
    return false;
  },
};
