// ============================================================
// Auth — simple password authentication for admin panel
// ============================================================

const Auth = {
  SALT: 'nav-site-kx9m',
  PW_KEY: 'nav-admin-pw',
  SESSION_KEY: 'nav-admin-session',

  _hash(pw) {
    let hash = 5381;
    const str = pw + this.SALT;
    for (let i = 0; i < str.length; i++) { hash = ((hash << 5) + hash) + str.charCodeAt(i); hash = hash & hash; }
    return Math.abs(hash).toString(36);
  },

  _storageAvailable() {
    try { const t = '__t__'; localStorage.setItem(t, t); localStorage.removeItem(t); return true; } catch (e) { return false; }
  },

  isPasswordSet() {
    if (!this._storageAvailable()) return false;
    return !!localStorage.getItem(this.PW_KEY);
  },

  setup(password) {
    if (!password || password.trim().length === 0) return { ok: false, error: '密码不能为空' };
    if (password.length < 4) return { ok: false, error: '密码至少 4 位' };
    if (!this._storageAvailable()) { this._setSession(); return { ok: true }; }
    localStorage.setItem(this.PW_KEY, this._hash(password.trim()));
    this._setSession();
    return { ok: true };
  },

  login(password) {
    if (!password || password.trim().length === 0) return { ok: false, error: '请输入密码' };
    if (!this._storageAvailable()) { this._setSession(); return { ok: true }; }
    const stored = localStorage.getItem(this.PW_KEY);
    if (!stored) return { ok: false, error: '尚未设置密码' };
    if (this._hash(password.trim()) === stored) { this._setSession(); return { ok: true }; }
    return { ok: false, error: '密码错误' };
  },

  logout() { sessionStorage.removeItem(this.SESSION_KEY); },

  isLoggedIn() {
    if (!this._storageAvailable() && !sessionStorage.getItem(this.SESSION_KEY)) { this._setSession(); return true; }
    return sessionStorage.getItem(this.SESSION_KEY) === '1';
  },

  _setSession() { sessionStorage.setItem(this.SESSION_KEY, '1'); },
};
