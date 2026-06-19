// ============================================================
// Admin Panel — category, sub-category & site management
// ============================================================

(function () {
  'use strict';

  const overlay = document.getElementById('adminOverlay');
  const adminToggle = document.getElementById('adminToggle');
  const adminClose = document.getElementById('adminClose');
  const tabBtns = document.querySelectorAll('.admin-tab');
  const tabContents = document.querySelectorAll('.admin-tab-content');
  const catName = document.getElementById('catName');
  const catIcon = document.getElementById('catIcon');
  const catAddBtn = document.getElementById('catAddBtn');
  const catList = document.getElementById('catList');
  // Sub-category
  const subParentCat = document.getElementById('subParentCat');
  const subCatName = document.getElementById('subCatName');
  const subCatIcon = document.getElementById('subCatIcon');
  const subCatAddBtn = document.getElementById('subCatAddBtn');
  // Site
  const siteCategory = document.getElementById('siteCategory');
  const siteSubCategory = document.getElementById('siteSubCategory');
  const siteUrl = document.getElementById('siteUrl');
  const siteName = document.getElementById('siteName');
  const siteDesc = document.getElementById('siteDesc');
  const siteIcon = document.getElementById('siteIcon');
  const siteAddBtn = document.getElementById('siteAddBtn');
  const siteList = document.getElementById('siteList');
  const faviconPreview = document.getElementById('faviconPreview');
  const faviconImg = document.getElementById('faviconImg');
  // Auth
  const authOverlay = document.getElementById('authOverlay');
  const authSetup = document.getElementById('authSetup');
  const authLogin = document.getElementById('authLogin');
  const authError = document.getElementById('authError');
  const authCancel = document.getElementById('authCancel');

  let editingCatIndex = null;
  let editingSubIndex = null;
  let editingSiteIndex = null;

  function getFaviconUrl(url) {
    try { return `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=32`; } catch (e) { return null; }
  }
  function getFaviconUrls(url) {
    try {
      const hostname = new URL(url).hostname;
      return [
        `https://api.xinac.net/icon?url=${hostname}`,
        `https://0x3.com/icon?host=${hostname}`,
        `https://${hostname}/favicon.ico`,
      ];
    } catch (e) { return []; }
  }
  function extractDomain(url) {
    try { return new URL(url).hostname.replace(/^www\./, ''); } catch (e) { return ''; }
  }
  function isImageURL(str) {
    return /^https?:\/\/.+\.(png|jpg|jpeg|gif|svg|ico|webp)(\?.*)?$/i.test(str) || /^https?:\/\/.*\/favicon\.\w+/i.test(str);
  }
  function buildIcon(customVal, url) {
    const val = (customVal || '').trim();
    if (val) {
      if (isImageURL(val)) return { type: 'img', src: val };
      return val;
    }
    const urls = getFaviconUrls(url);
    if (urls.length === 0) return '🔗';
    return { type: 'img', src: urls[0], fallback: urls.slice(1) };
  }

  // ---- Auth modal ----
  function showAuthModal() {
    authError.hidden = true;
    if (Auth.isPasswordSet()) {
      authSetup.style.display = 'none'; authLogin.style.display = '';
      document.getElementById('authPw').value = '';
    } else {
      authSetup.style.display = ''; authLogin.style.display = 'none';
      document.getElementById('authNewPw').value = ''; document.getElementById('authConfirmPw').value = '';
    }
    authOverlay.hidden = false;
    const vi = authOverlay.querySelector('.auth-state:not([style*="display: none"]) .auth-input');
    if (vi) setTimeout(() => vi.focus(), 100);
  }
  function hideAuthModal() { authOverlay.hidden = true; }
  function showAuthError(msg) {
    authError.textContent = msg; authError.hidden = false;
    authError.style.animation = 'none'; authError.offsetHeight; authError.style.animation = 'authShake 0.4s ease';
  }

  // ---- Overlay ----
  function openAdmin() { Auth.isLoggedIn() ? openAdminDirect() : showAuthModal(); }
  function openAdminDirect() { overlay.hidden = false; refreshAll(); switchTab('categories'); }
  function closeAdmin() { overlay.hidden = true; resetForms(); }
  function lockAdmin() { Auth.logout(); closeAdmin(); }
  function switchTab(tabName) {
    tabBtns.forEach(b => b.classList.toggle('active', b.dataset.tab === tabName));
    tabContents.forEach(c => c.classList.toggle('active', c.id === 'tab' + (tabName.charAt(0).toUpperCase() + tabName.slice(1))));
  }
  function refreshAll() { renderCategoryList(); renderCategorySelects(); renderSiteList(); }
  function resetForms() {
    catName.value = ''; catIcon.value = ''; subCatName.value = ''; subCatIcon.value = '';
    siteUrl.value = ''; siteName.value = ''; siteDesc.value = ''; siteIcon.value = '';
    faviconPreview.hidden = true; faviconImg.src = '';
    editingCatIndex = null; editingSubIndex = null; editingSiteIndex = null;
    catAddBtn.textContent = '添加分类'; siteAddBtn.textContent = '添加网址';
  }

  // ---- Category Selects ----
  function renderCategorySelects() {
    const data = DataStore.load();
    // Parent selector (for sub-category form)
    subParentCat.innerHTML = data.map((c, i) => `<option value="${i}">${c.icon} ${c.name}</option>`).join('');
    // Site category selector (parent only, with "直下" suffix for clarity)
    siteCategory.innerHTML = data.map((c, i) => `<option value="${i}">${c.icon} ${c.name}</option>`).join('');
    renderSubCategorySelect();
  }

  function renderSubCategorySelect() {
    const ci = parseInt(siteCategory.value, 10);
    const data = DataStore.load();
    const subs = (ci >= 0 && ci < data.length) ? (data[ci].sub || []) : [];
    siteSubCategory.innerHTML = '<option value="">(直接属于此分类)</option>' +
      subs.map((sc, si) => `<option value="${si}">└ ${sc.icon} ${sc.name}</option>`).join('');
  }

  // ---- Categories ----
  function renderCategoryList() {
    const data = DataStore.load();
    if (data.length === 0) { catList.innerHTML = '<li class="admin-list-item admin-empty">暂无分类</li>'; return; }
    let html = '';
    data.forEach((cat, i) => {
      html += `<li class="admin-list-item">
        <span class="admin-item-icon">${cat.icon}</span>
        <span class="admin-item-name">${escapeHTML(cat.name)}</span>
        <span class="admin-item-count">${cat.sites.length + (cat.sub||[]).reduce((s,sc)=>s+sc.sites.length,0)} 个网址</span>
        <div class="admin-item-actions">
          <button class="admin-action-btn" data-action="editCat" data-index="${i}" title="编辑">✏️</button>
          <button class="admin-action-btn" data-action="moveUp" data-index="${i}" title="上移" ${i===0?'disabled':''}>⬆️</button>
          <button class="admin-action-btn" data-action="moveDown" data-index="${i}" title="下移" ${i===data.length-1?'disabled':''}>⬇️</button>
          <button class="admin-action-btn admin-action-danger" data-action="deleteCat" data-index="${i}" title="删除">🗑️</button>
        </div>
      </li>`;
      // Sub-categories
      if (cat.sub && cat.sub.length > 0) {
        cat.sub.forEach((sc, si) => {
          html += `<li class="admin-list-item admin-sub-item">
            <span class="admin-item-icon">${sc.icon}</span>
            <span class="admin-item-name">└ ${escapeHTML(sc.name)}</span>
            <span class="admin-item-count">${sc.sites.length} 个网址</span>
            <div class="admin-item-actions">
              <button class="admin-action-btn" data-action="editSub" data-parent="${i}" data-sub="${si}" title="编辑">✏️</button>
              <button class="admin-action-btn admin-action-danger" data-action="deleteSub" data-parent="${i}" data-sub="${si}" title="删除">🗑️</button>
            </div>
          </li>`;
        });
      }
    });
    catList.innerHTML = html;
  }

  function handleCategoryAction(e) {
    const btn = e.target.closest('.admin-action-btn'); if (!btn) return;
    const i = parseInt(btn.dataset.index, 10);
    const pi = parseInt(btn.dataset.parent, 10);
    const si = parseInt(btn.dataset.sub, 10);
    switch (btn.dataset.action) {
      case 'editCat': editCategory(i); break;
      case 'deleteCat': deleteCategory(i); break;
      case 'moveUp': DataStore.moveCategory(i, i-1); refreshAll(); break;
      case 'moveDown': DataStore.moveCategory(i, i+1); refreshAll(); break;
      case 'deleteSub': deleteSubCategory(pi, si); break;
      case 'editSub': editSubCategory(pi, si); break;
    }
  }

  function addCategory() {
    const n = catName.value.trim(); if (!n) { catName.focus(); catName.style.borderColor='#ea4335'; return; }
    const ic = catIcon.value.trim() || '📁';
    editingCatIndex !== null ? DataStore.updateCategory(editingCatIndex, n, ic) : DataStore.addCategory(n, ic);
    resetForms(); refreshAll();
  }
  function editCategory(i) {
    const c = DataStore.load()[i]; catName.value = c.name; catIcon.value = c.icon;
    editingCatIndex = i; catAddBtn.textContent = '更新分类'; catName.style.borderColor = ''; catName.focus();
    catName.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  function deleteCategory(i) {
    const c = DataStore.load()[i];
    if (!confirm(`确定要删除分类「${c.name}」及其所有子分类和 ${c.sites.length + (c.sub||[]).reduce((s,sc)=>s+sc.sites.length,0)} 个网址吗？`)) return;
    DataStore.deleteCategory(i); resetForms(); refreshAll();
  }

  // ---- Sub-Categories ----
  function addSubCategory() {
    const pi = parseInt(subParentCat.value, 10);
    const n = subCatName.value.trim();
    if (isNaN(pi) || pi < 0) return;
    if (!n) { subCatName.focus(); subCatName.style.borderColor='#ea4335'; return; }
    const ic = subCatIcon.value.trim() || '📁';
    if (editingCatIndex !== null && editingSubIndex !== null) {
      DataStore.updateSubCategory(editingCatIndex, editingSubIndex, n, ic);
    } else {
      DataStore.addSubCategory(pi, n, ic);
    }
    subCatName.value = ''; subCatIcon.value = ''; subCatName.style.borderColor = '';
    editingCatIndex = null; editingSubIndex = null;
    refreshAll();
  }
  function editSubCategory(pi, si) {
    const data = DataStore.load();
    const sc = data[pi].sub[si];
    subParentCat.value = pi;
    subCatName.value = sc.name;
    subCatIcon.value = sc.icon;
    editingCatIndex = pi; editingSubIndex = si;
    subCatName.focus();
    subCatName.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  function deleteSubCategory(pi, si) {
    const data = DataStore.load();
    const sc = data[pi].sub[si];
    if (!confirm(`确定要删除子分类「${sc.name}」及其 ${sc.sites.length} 个网址吗？`)) return;
    DataStore.deleteSubCategory(pi, si);
    resetForms(); refreshAll();
  }

  // ---- Sites ----
  function renderSiteList() {
    const ci = parseInt(siteCategory.value, 10);
    const siVal = siteSubCategory.value;
    const si = siVal !== '' ? parseInt(siVal, 10) : null;
    const data = DataStore.load();
    if (isNaN(ci) || ci < 0 || ci >= data.length) { siteList.innerHTML = '<li class="admin-list-item admin-empty">请选择一个分类</li>'; return; }
    const sites = si != null && data[ci].sub[si] ? data[ci].sub[si].sites : data[ci].sites;
    const label = si != null ? data[ci].sub[si].name : data[ci].name;
    if (sites.length === 0) { siteList.innerHTML = `<li class="admin-list-item admin-empty">「${label}」暂无网址</li>`; return; }
    siteList.innerHTML = sites.map((s, i) => `
      <li class="admin-list-item">
        <span class="admin-item-icon site-icon-small">${renderIconHTML(s.icon)}</span>
        <span class="admin-item-name">${escapeHTML(s.name)}</span>
        <span class="admin-item-url">${escapeHTML(truncateUrl(s.url))}</span>
        <div class="admin-item-actions">
          <button class="admin-action-btn" data-action="editSite" data-index="${i}" title="编辑">✏️</button>
          <button class="admin-action-btn admin-action-danger" data-action="deleteSite" data-index="${i}" title="删除">🗑️</button>
        </div>
      </li>`).join('');
  }
  function renderIconHTML(icon) {
    if (!icon) return '🔗'; if (typeof icon === 'string') return icon;
    if (icon && icon.type === 'img' && icon.src) {
      if (icon.fallback && icon.fallback.length > 0) {
        const fb = [icon.src, ...icon.fallback].join('||');
        return `<img src="${icon.src}" alt="" width="16" height="16" style="object-fit:contain;" data-fb="${fb}" onerror="var u=this.dataset.fb.split('||');this.src=u[1];this.dataset.fb=u.slice(1).join('||');if(!u[1])this.parentElement.textContent='🔗'">`;
      }
      return `<img src="${icon.src}" alt="" width="16" height="16" style="object-fit:contain;" onerror="this.parentElement.textContent='🔗'">`;
    }
    return '🔗';
  }
  function handleSiteAction(e) {
    const btn = e.target.closest('.admin-action-btn'); if (!btn) return;
    const i = parseInt(btn.dataset.index, 10);
    if (btn.dataset.action === 'editSite') editSite(i);
    else if (btn.dataset.action === 'deleteSite') deleteSite(i);
  }
  function getSelectedSubIndex() {
    const v = siteSubCategory.value;
    return v !== '' ? parseInt(v, 10) : null;
  }
  function addSite() {
    const ci = parseInt(siteCategory.value, 10);
    const si = getSelectedSubIndex();
    const url = siteUrl.value.trim(); const n = siteName.value.trim(); const d = siteDesc.value.trim(); const ic = siteIcon.value;
    if (isNaN(ci) || ci < 0) return;
    if (!url) { siteUrl.focus(); siteUrl.style.borderColor='#ea4335'; return; }
    if (!n) { siteName.focus(); siteName.style.borderColor='#ea4335'; return; }
    const icon = buildIcon(ic, url);
    const siteData = { name: n, url, icon, description: d };
    if (editingCatIndex !== null && editingSiteIndex !== null) {
      DataStore.updateSite(editingCatIndex, editingSubIndex, editingSiteIndex, siteData);
    } else {
      DataStore.addSite(ci, si, siteData);
    }
    resetForms(); refreshAll();
  }
  function editSite(i) {
    const ci = parseInt(siteCategory.value, 10);
    const si = getSelectedSubIndex();
    const data = DataStore.load();
    const sites = si != null && data[ci].sub[si] ? data[ci].sub[si].sites : data[ci].sites;
    const s = sites[i];
    siteUrl.value = s.url; siteName.value = s.name; siteDesc.value = s.description || '';
    if (s.icon && s.icon.type === 'img') siteIcon.value = s.icon.src;
    else if (typeof s.icon === 'string') siteIcon.value = s.icon;
    else siteIcon.value = '';
    const urls = getFaviconUrls(s.url); if (urls.length > 0) { faviconImg.src = urls[0]; faviconPreview.hidden = false; }
    editingCatIndex = ci; editingSubIndex = si; editingSiteIndex = i; siteAddBtn.textContent = '更新网址';
    siteUrl.style.borderColor = ''; siteName.style.borderColor = ''; siteUrl.focus();
    siteUrl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  function deleteSite(i) {
    const ci = parseInt(siteCategory.value, 10);
    const si = getSelectedSubIndex();
    const data = DataStore.load();
    const sites = si != null && data[ci].sub[si] ? data[ci].sub[si].sites : data[ci].sites;
    const s = sites[i];
    if (!confirm(`确定要删除网址「${s.name}」吗？`)) return;
    DataStore.deleteSite(ci, si, i);
    resetForms(); refreshAll();
  }
  function onSiteUrlBlur() {
    const url = siteUrl.value.trim(); siteUrl.style.borderColor = ''; if (!url) return;
    try { new URL(url); } catch (e) { siteUrl.style.borderColor = '#ea4335'; return; }
    const urls = getFaviconUrls(url); if (urls.length > 0) { faviconImg.src = urls[0]; faviconPreview.hidden = false; }
    if (!siteName.value.trim()) { const d = extractDomain(url); if (d) siteName.value = d; }
  }
  function clearErrorStyle(e) { e.target.style.borderColor = ''; }
  function escapeHTML(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
  function truncateUrl(url) {
    try { const u = new URL(url); return u.hostname.replace(/^www\./, '') + (u.pathname.length > 1 ? u.pathname.substring(0, 15) + (u.pathname.length > 15 ? '…' : '') : ''); }
    catch (e) { return url.length > 30 ? url.substring(0, 30) + '…' : url; }
  }

  // ---- Background ----
  function applyBackground() {
    const imageUrl = document.getElementById('bgImageUrl').value.trim();
    const color = document.getElementById('bgColor').value.trim();
    const settings = { image: imageUrl || '', color: color || '#f0f2f5' };
    localStorage.setItem('nav-bg', JSON.stringify(settings));
    setBodyBackground(settings);
    CloudSync.autoPush();
  }
  function resetBackground() {
    document.getElementById('bgImageUrl').value = ''; document.getElementById('bgColor').value = '#f0f2f5';
    document.getElementById('bgColorHex').value = '#f0f2f5'; document.getElementById('bgPreview').hidden = true;
    localStorage.removeItem('nav-bg'); setBodyBackground({ image: '', color: '' });
    CloudSync.autoPush();
  }
  function loadBackgroundSettings() {
    try { const r = localStorage.getItem('nav-bg'); return r ? JSON.parse(r) : { image: '', color: '' }; } catch (e) { return { image: '', color: '' }; }
  }
  function bgImagePreview() {
    const url = document.getElementById('bgImageUrl').value.trim();
    const p = document.getElementById('bgPreview'); const img = document.getElementById('bgPreviewImg');
    if (url) { img.src = url; p.hidden = false; } else { p.hidden = true; }
  }

  // ---- Backup ----
  function gatherAllData() { return { version: '1.7.0', exportedAt: new Date().toISOString(), navData: DataStore.load(), searchEngine: localStorage.getItem('nav-search-engine') || 'google', theme: localStorage.getItem('nav-theme') || null, background: loadBackgroundSettings() }; }
  function updateBackupInfo() {
    const el = document.getElementById('backupInfo'); if (!el) return;
    const data = DataStore.load();
    el.innerHTML = `当前数据：<span>${data.length}</span> 个主分类 · <span>${DataStore.totalSites(data)}</span> 个网址`;
  }
  function exportData() {
    const all = gatherAllData();
    const blob = new Blob([JSON.stringify(all, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = `nav-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
    showImportMsg('备份已下载', 'success');
  }
  function importData(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const all = JSON.parse(e.target.result);
        if (!all.navData || !Array.isArray(all.navData)) throw new Error('无效');
        DataStore.save(all.navData);
        if (all.searchEngine) localStorage.setItem('nav-search-engine', all.searchEngine);
        if (all.theme) Theme.set(all.theme); else localStorage.removeItem('nav-theme');
        if (all.background) { localStorage.setItem('nav-bg', JSON.stringify(all.background)); if (window.setBodyBackground) window.setBodyBackground(all.background); }
        else { localStorage.removeItem('nav-bg'); }
        refreshAll(); updateBackupInfo(); showImportMsg('导入成功', 'success');
        window.dispatchEvent(new CustomEvent('navDataChanged'));
      } catch (err) { showImportMsg('文件格式无效', 'error'); }
    };
    reader.readAsText(file);
  }
  function resetAllData() {
    if (!confirm('确定恢复默认数据？所有自定义数据将被清除。')) return;
    localStorage.removeItem('nav-data'); localStorage.removeItem('nav-bg');
    localStorage.removeItem('nav-theme'); localStorage.removeItem('nav-search-engine');
    DataStore.load(); window.dispatchEvent(new CustomEvent('navDataChanged'));
    Theme.apply(Theme.get()); if (window.setBodyBackground) window.setBodyBackground({ image: '', color: '' });
    refreshAll(); updateBackupInfo(); showImportMsg('已恢复默认', 'success');
    ['bgImageUrl','bgColor','bgColorHex','bgPreview'].forEach(id => { const e = document.getElementById(id); if (e) { if (id==='bgPreview') e.hidden=true; else if (id==='bgColor') e.value='#f0f2f5'; else e.value=''; } });
    const cur = localStorage.getItem('nav-search-engine') || 'google';
    document.querySelectorAll('.engine-btn').forEach(b => b.classList.toggle('active', b.dataset.engine === cur));
  }
  function showImportMsg(msg, type) {
    const el = document.getElementById('importMsg'); if (!el) return;
    el.textContent = msg; el.className = 'backup-hint ' + type; el.hidden = false;
    setTimeout(() => { el.hidden = true; }, 4000);
  }

  // ---- Init ----
  function init() {
    adminToggle.addEventListener('click', openAdmin);
    adminClose.addEventListener('click', closeAdmin);
    overlay.addEventListener('click', e => { if (e.target === overlay) closeAdmin(); });

    // Auth
    document.getElementById('authSetupBtn').addEventListener('click', () => {
      const pw = document.getElementById('authNewPw').value; const cf = document.getElementById('authConfirmPw').value;
      if (pw !== cf) { showAuthError('两次输入的密码不一致'); return; }
      const r = Auth.setup(pw); if (!r.ok) { showAuthError(r.error); return; }
      hideAuthModal(); openAdminDirect();
    });
    document.getElementById('authLoginBtn').addEventListener('click', () => {
      const r = Auth.login(document.getElementById('authPw').value);
      if (!r.ok) { showAuthError(r.error); return; }
      hideAuthModal(); openAdminDirect();
    });
    authOverlay.addEventListener('keydown', e => {
      if (e.key === 'Enter') { (authSetup.style.display === 'none' ? document.getElementById('authLoginBtn') : document.getElementById('authSetupBtn')).click(); }
      if (e.key === 'Escape') hideAuthModal();
    });
    authCancel.addEventListener('click', hideAuthModal);
    authOverlay.addEventListener('click', e => { if (e.target === authOverlay) hideAuthModal(); });
    document.getElementById('adminLockBtn').addEventListener('click', lockAdmin);

    // Tabs
    tabBtns.forEach(b => b.addEventListener('click', () => switchTab(b.dataset.tab)));

    // Categories
    catAddBtn.addEventListener('click', addCategory);
    catList.addEventListener('click', handleCategoryAction);
    catName.addEventListener('input', clearErrorStyle);

    // Sub-categories
    subCatAddBtn.addEventListener('click', addSubCategory);
    subCatName.addEventListener('input', clearErrorStyle);

    // Sites
    siteAddBtn.addEventListener('click', addSite);
    siteList.addEventListener('click', handleSiteAction);
    siteCategory.addEventListener('change', () => { renderSubCategorySelect(); renderSiteList(); });
    siteSubCategory.addEventListener('change', () => { resetForms(); renderSiteList(); });
    siteUrl.addEventListener('blur', onSiteUrlBlur);
    siteUrl.addEventListener('input', clearErrorStyle);
    siteName.addEventListener('input', clearErrorStyle);

    // Background
    document.getElementById('bgApplyBtn').addEventListener('click', applyBackground);
    document.getElementById('bgResetBtn').addEventListener('click', resetBackground);
    document.getElementById('bgImageUrl').addEventListener('blur', bgImagePreview);
    document.getElementById('bgImageUrl').addEventListener('input', () => { if (!document.getElementById('bgImageUrl').value.trim()) document.getElementById('bgPreview').hidden = true; });
    const bgColorEl = document.getElementById('bgColor'); const bgColorHexEl = document.getElementById('bgColorHex');
    bgColorEl.addEventListener('input', () => { bgColorHexEl.value = bgColorEl.value; });
    bgColorHexEl.addEventListener('input', () => { const v = bgColorHexEl.value.trim(); if (/^#[0-9a-fA-F]{6}$/.test(v)) bgColorEl.value = v; });
    const savedBg = loadBackgroundSettings();
    if (savedBg.image) { document.getElementById('bgImageUrl').value = savedBg.image; bgImagePreview(); }
    if (savedBg.color) { document.getElementById('bgColor').value = savedBg.color; bgColorHexEl.value = savedBg.color; }

    // Backup
    updateBackupInfo();
    document.getElementById('exportBtn').addEventListener('click', exportData);
    document.getElementById('importFile').addEventListener('change', function() { if (this.files && this.files[0]) { importData(this.files[0]); this.value = ''; } });
    document.getElementById('resetDataBtn').addEventListener('click', resetAllData);

    // R2 sync
    const r2Status = document.getElementById('r2Status'); const r2Msg = document.getElementById('r2Msg');
    const r2cfg = CloudSync.getConfig();
    if (r2cfg.workerUrl) document.getElementById('r2WorkerUrl').value = r2cfg.workerUrl;
    if (r2cfg.authToken) document.getElementById('r2AuthToken').value = r2cfg.authToken;
    document.getElementById('r2SaveBtn').addEventListener('click', () => {
      const url = document.getElementById('r2WorkerUrl').value.trim(); const token = document.getElementById('r2AuthToken').value.trim();
      if (!url || !token) { r2Status.hidden = false; r2Status.className = 'r2-status error'; r2Status.textContent = 'URL 和 Token 不能为空'; return; }
      CloudSync.setConfig(url, token); r2Status.hidden = false; r2Status.className = 'r2-status success'; r2Status.textContent = '配置已保存';
    });
    document.getElementById('r2TestBtn').addEventListener('click', async () => {
      r2Status.hidden = false; r2Status.className = 'r2-status'; r2Status.textContent = '测试中...';
      const r = await CloudSync.test(); r2Status.className = 'r2-status ' + (r.ok ? 'success' : 'error'); r2Status.textContent = r.ok ? '连接成功' : r.error;
    });
    document.getElementById('r2PushBtn').addEventListener('click', async () => {
      const r = await CloudSync.push(); r2Msg.hidden = false; r2Msg.className = 'backup-hint ' + (r.ok ? 'success' : 'error');
      r2Msg.textContent = r.ok ? '已推送' : r.error; setTimeout(() => { r2Msg.hidden = true; }, 4000);
    });
    document.getElementById('r2PullBtn').addEventListener('click', async () => {
      r2Msg.hidden = false; r2Msg.className = 'backup-hint'; r2Msg.textContent = '拉取中...';
      const r = await CloudSync.pull(); r2Msg.className = 'backup-hint ' + (r.ok ? 'success' : 'error');
      r2Msg.textContent = r.ok ? '已同步' : r.error;
      if (r.ok) { refreshAll(); updateBackupInfo(); window.dispatchEvent(new CustomEvent('navDataChanged')); }
      setTimeout(() => { r2Msg.hidden = true; }, 4000);
    });

    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !overlay.hidden) closeAdmin(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
