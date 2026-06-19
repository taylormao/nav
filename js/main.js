// ============================================================
// Main — initialization, rendering, keyboard shortcuts, sidebar
// ============================================================

const APP_VERSION = '1.8.0';

(function () {
  'use strict';

  // --- Render icon: handles emoji strings and favicon img objects with fallback ---
  function renderIcon(icon) {
    if (!icon) return '🔗';
    if (typeof icon === 'string') return icon;
    if (icon && icon.type === 'img' && icon.src) {
      if (icon.fallback && icon.fallback.length > 0) {
        // Build fallback chain: try each URL in order, separated by spaces
        const fbChain = [icon.src, ...icon.fallback].join('||');
        return `<img src="${icon.src}" alt="" loading="lazy"
          data-fb="${fbChain}"
          onerror="var u=this.dataset.fb.split('||');this.src=u[1];this.dataset.fb=u.slice(1).join('||');if(!u[1])this.parentElement.textContent='🔗'">`;
      }
      return `<img src="${icon.src}" alt="" loading="lazy" onerror="this.parentElement.textContent='🔗'">`;
    }
    return '🔗';
  }

  // --- Render navigation cards from DataStore (supports sub-categories) ---
  function renderNav() {
    const container = document.getElementById('navContent');
    if (!container) return;

    const data = DataStore.load();
    let html = '';

    data.forEach((category, i) => {
      // Parent category cards
      html += `
        <section class="category-section" id="cat-${i}">
          <div class="category-header">
            <span class="category-icon">${category.icon}</span>
            <h2 class="category-name">${category.name}</h2>
          </div>
          <div class="card-grid">
            ${category.sites.length > 0
              ? category.sites.map(site => cardHTML(site)).join('')
              : '<p class="empty-hint">暂无网址</p>'
            }
          </div>`;

      // Sub-category sections
      if (category.sub && category.sub.length > 0) {
        category.sub.forEach((sub, si) => {
          html += `
          <section class="sub-section" id="cat-${i}-sub-${si}">
            <div class="sub-header">
              <span class="sub-icon">${sub.icon}</span>
              <h3 class="sub-name">${sub.name}</h3>
            </div>
            <div class="card-grid">
              ${sub.sites.length > 0
                ? sub.sites.map(site => cardHTML(site)).join('')
                : '<p class="empty-hint">暂无网址</p>'
              }
            </div>
          </section>`;
        });
      }

      html += `</section>`;
    });

    container.innerHTML = html;
    renderSidebar();
    setupScrollSpy();
  }

  function cardHTML(site) {
    return `<a href="${site.url}" target="_blank" rel="noopener noreferrer" class="site-card" title="${site.name}${site.description ? ' - ' + site.description : ''}">
      <span class="site-card-icon">${renderIcon(site.icon)}</span>
      <span class="site-card-info">
        <span class="site-card-name">${site.name}</span>
        ${site.description ? `<span class="site-card-desc">${site.description}</span>` : ''}
      </span>
    </a>`;
  }

  // --- Render sidebar navigation ---
  function renderSidebar() {
    const nav = document.getElementById('sidebarNav');
    if (!nav) return;

    const data = DataStore.load();
    let html = '';

    data.forEach((category, i) => {
      html += `<li class="sidebar-item" data-target="cat-${i}">
        <span class="sidebar-icon">${category.icon}</span>
        <span class="sidebar-label">${escapeHTML(category.name)}</span>
      </li>`;
      if (category.sub && category.sub.length > 0) {
        category.sub.forEach((sub, si) => {
          html += `<li class="sidebar-item sidebar-sub" data-target="cat-${i}-sub-${si}">
            <span class="sidebar-icon">${sub.icon}</span>
            <span class="sidebar-label">${escapeHTML(sub.name)}</span>
          </li>`;
        });
      }
    });

    nav.innerHTML = html;

    // Click handlers
    nav.querySelectorAll('.sidebar-item').forEach(item => {
      item.addEventListener('click', () => {
        const targetId = item.dataset.target;
        const section = document.getElementById(targetId);
        if (section) {
          section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        const sidebar = document.getElementById('sidebar');
        if (sidebar && window.innerWidth <= 900) {
          sidebar.classList.remove('open');
        }
      });
    });
  }

  // --- Scroll spy: highlight active sidebar item ---
  function setupScrollSpy() {
    const items = document.querySelectorAll('.sidebar-item');
    if (items.length === 0) return;

    // Use IntersectionObserver for accuracy
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const item = document.querySelector(`.sidebar-item[data-target="${entry.target.id}"]`);
        if (item) {
          if (entry.isIntersecting) {
            // Remove active from all, set on current
            document.querySelectorAll('.sidebar-item').forEach(el => el.classList.remove('active'));
            item.classList.add('active');
          }
        }
      });
    }, {
      rootMargin: '-20% 0px -70% 0px', // trigger when section is near the top
      threshold: 0,
    });

    // Observe all category sections
    document.querySelectorAll('.category-section[id]').forEach(section => {
      observer.observe(section);
    });
  }

  // --- Clock ---
  function updateClock() {
    const clock = document.getElementById('clock');
    if (!clock) return;
    const now = new Date();
    clock.textContent = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }

  // --- Keyboard shortcuts ---
  function initKeyboard() {
    document.addEventListener('keydown', (e) => {
      const input = document.getElementById('searchInput');
      const overlay = document.getElementById('adminOverlay');
      if (overlay && !overlay.hidden) return;

      if (e.key === '/' && document.activeElement !== input) {
        const tag = document.activeElement ? document.activeElement.tagName : '';
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        e.preventDefault();
        input.focus();
        input.select();
        return;
      }

      if (e.key === 'Escape' && document.activeElement === input) {
        input.blur();
        return;
      }
    });
  }

  // --- Sidebar toggle (mobile) ---
  function initSidebarToggle() {
    const toggle = document.getElementById('sidebarToggle');
    const sidebar = document.getElementById('sidebar');
    if (!toggle || !sidebar) return;

    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
      if (window.innerWidth > 900) return;
      if (sidebar.classList.contains('open') &&
          !sidebar.contains(e.target) &&
          e.target !== toggle &&
          !toggle.contains(e.target)) {
        sidebar.classList.remove('open');
      }
    });
  }

  // --- Background ---
  function setBodyBackground(settings) {
    const body = document.body;
    body.classList.remove('has-bg-image');
    body.style.backgroundImage = '';
    body.style.backgroundColor = '';

    if (settings.image) {
      body.classList.add('has-bg-image');
      body.style.backgroundImage = `url(${settings.image})`;
    }
    if (settings.color) {
      body.style.backgroundColor = settings.color;
    }
  }

  function loadAndApplyBackground() {
    try {
      const raw = localStorage.getItem('nav-bg');
      if (raw) {
        const settings = JSON.parse(raw);
        if (settings.image || settings.color) {
          setBodyBackground(settings);
        }
      }
    } catch (e) { /* ignore */ }
  }

  // --- Escape HTML ---
  function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // --- Initialize ---
  function init() {
    // Expose for admin.js
    window.setBodyBackground = setBodyBackground;

    Theme.init();
    Search.init();
    loadAndApplyBackground();
    renderNav();

    // Auto-pull from R2 on load
    CloudSync.autoPull().then(pulled => {
      if (pulled) {
        loadAndApplyBackground();
        renderNav();
      }
    });
    updateClock();
    initKeyboard();
    initSidebarToggle();

    window.addEventListener('navDataChanged', () => {
      renderNav();
      CloudSync.autoPush(); // silently sync to R2
    });

    const versionEl = document.getElementById('versionDisplay');
    if (versionEl) versionEl.textContent = 'v' + APP_VERSION;

    document.getElementById('themeToggle').addEventListener('click', () => {
      Theme.toggle();
    });

    setInterval(updateClock, 30000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
