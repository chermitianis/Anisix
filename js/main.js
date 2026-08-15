/* =========================================================
   المنطق الرئيسي للموقع العام (index.html)
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {

  /* ---------- 1) القائمة على الجوال ---------- */
  const navToggle = document.getElementById('navToggle');
  const mainNav = document.getElementById('mainNav');
  if (navToggle && mainNav) {
    navToggle.addEventListener('click', () => {
      const isOpen = mainNav.classList.toggle('is-open');
      navToggle.classList.toggle('is-open', isOpen);
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  /* ---------- 2) تمييز الرابط النشط أثناء التمرير (معطل في وضع التبويب) ---------- */
  const sections = document.querySelectorAll('main section[id], .hero[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  let tabMode = false;         // هل نحن في وضع عرض تبويب واحد
  let currentTabId = null;     // معرف التبويب المعروض حالياً

  const highlightNav = () => {
    if (tabMode) return; // في وضع التبويب، نعتمد على النشاط اليدوي
    let currentId = '';
    const scrollPos = window.scrollY + 140;
    sections.forEach(section => {
      if (scrollPos >= section.offsetTop) currentId = section.id;
    });
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      link.classList.toggle('is-active', href === `#${currentId}`);
    });
  };
  window.addEventListener('scroll', highlightNav, { passive: true });
  highlightNav();

  /* ---------- 3) وظائف التحكم في وضع التبويب ---------- */
  function showTab(sectionId) {
    // إخفاء جميع الأقسام ما عدا المستهدف
    sections.forEach(s => {
      if (s.id === sectionId) {
        s.style.display = 'block';
        s.style.minHeight = 'calc(100vh - 65px)'; // ارتفاع الشاشة ناقص الهيدر (~65px)
        s.style.paddingTop = '20px'; // تعويض الهوامش
        s.style.paddingBottom = '40px';
      } else {
        s.style.display = 'none';
        s.style.minHeight = '';
        s.style.paddingTop = '';
        s.style.paddingBottom = '';
      }
    });
    document.body.classList.add('tab-mode');
    tabMode = true;
    currentTabId = sectionId;
    // تحديث الروابط النشطة يدوياً
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      link.classList.toggle('is-active', href === `#${sectionId}`);
    });
    // التمرير إلى أعلى الصفحة (أسفل الهيدر مباشرة)
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function showAllSections() {
    sections.forEach(s => {
      s.style.display = '';
      s.style.minHeight = '';
      s.style.paddingTop = '';
      s.style.paddingBottom = '';
    });
    document.body.classList.remove('tab-mode');
    tabMode = false;
    currentTabId = null;
    // إعادة تفعيل التظليل التلقائي
    highlightNav();
    // التمرير إلى أعلى الصفحة
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---------- 4) مستمعات النقر على روابط التنقل ---------- */
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const href = link.getAttribute('href');
      const targetId = href.substring(1); // إزالة '#'

      // إغلاق القائمة في الجوال
      if (mainNav.classList.contains('is-open')) {
        mainNav.classList.remove('is-open');
        navToggle.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      }

      if (targetId === 'hero' || targetId === 'top' || targetId === '') {
        // الرئيسية: عرض كل الأقسام
        showAllSections();
      } else {
        // تبويب آخر: عرض القسم المطلوب فقط
        showTab(targetId);
      }
    });
  });

  /* ---------- 5) زر العودة للأعلى ---------- */
  const scrollTopBtn = document.getElementById('scrollTop');
  if (scrollTopBtn) {
    window.addEventListener('scroll', () => {
      scrollTopBtn.classList.toggle('is-visible', window.scrollY > 500);
    }, { passive: true });
    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------- 6) الفوتر: السنة ---------- */
  const footerYear = document.getElementById('footerYear');
  if (footerYear) footerYear.textContent = new Date().getFullYear();
  const footerDate = document.getElementById('footerDate');
  if (footerDate) footerDate.textContent = new Date().toISOString().slice(0, 7);

  /* ---------- 7) نموذج التواصل ---------- */
  initContactForm();

  /* ---------- 8) البرمجيات الديناميكية ---------- */
  SoftwareCatalog.init();

  /* ---------- 9) معرض الأعمال الديناميكي ---------- */
  PortfolioGallery.init();

  /* ---------- 10) استعادة حالة التبويب من URL عند تحميل الصفحة ---------- */
  // نفحص الـ hash في الرابط
  const hash = window.location.hash;
  if (hash) {
    const id = hash.substring(1);
    // إذا كان الـ hash يشير إلى قسم موجود وليس الرئيسية
    const targetSection = document.getElementById(id);
    if (targetSection && id !== 'hero' && id !== 'top') {
      // نؤجل التنفيذ قليلاً لضمان تحميل كل شيء
      setTimeout(() => showTab(id), 100);
    }
  }
});

/* =========================================================
   نموذج التواصل — يُخزَّن في جدول contact_messages
   ========================================================= */
function initContactForm() {
  const form = document.getElementById('contactForm');
  const formNote = document.getElementById('formNote');
  if (!form) return;

  const validators = {
    name: value => value.trim().length >= 2,
    contactInfo: value => {
      const v = value.trim();
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      const isPhone = /^\+?[\d\s-]{7,}$/.test(v) && /\d{6,}/.test(v.replace(/\D/g, ''));
      return isEmail || isPhone;
    },
    serviceType: value => !!value,
    details: value => value.trim().length >= 10
  };

  let attempted = false;
  const showError = (field, ok) => {
    const row = field.closest('.form-row');
    row.classList.toggle('has-error', !ok);
  };

  Object.keys(validators).forEach(name => {
    const field = form.elements[name];
    if (!field) return;
    field.addEventListener('input', () => { if (attempted) showError(field, validators[name](field.value)); });
    field.addEventListener('change', () => { if (attempted) showError(field, validators[name](field.value)); });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    attempted = true;
    let valid = true;
    Object.keys(validators).forEach(name => {
      const field = form.elements[name];
      if (!field) return;
      const ok = validators[name](field.value);
      showError(field, ok);
      if (!ok) valid = false;
    });
    if (!valid) {
      formNote.textContent = 'Veuillez corriger les champs surlignés.';
      formNote.classList.remove('is-success');
      return;
    }

    const payload = {
      name: form.elements['name'].value.trim(),
      contact_info: form.elements['contactInfo'].value.trim(),
      service_type: form.elements['serviceType'].value,
      details: form.elements['details'].value.trim(),
      user_id: window.Auth && window.Auth.session ? window.Auth.session.user.id : null
    };

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    try {
      if (window.isSupabaseConfigured()) {
        const { error } = await window.supabaseClient.from('contact_messages').insert(payload);
        if (error) throw error;
      }
      formNote.textContent = window.i18n.t('form_success');
      formNote.classList.add('is-success');
      form.querySelectorAll('.form-row').forEach(row => row.classList.remove('has-error'));
      form.reset();
      attempted = false;
    } catch (err) {
      formNote.textContent = window.i18n.t('form_error_generic');
      formNote.classList.remove('is-success');
    } finally {
      submitBtn.disabled = false;
    }
  });
}

/* =========================================================
   كتالوج البرمجيات — يُجلب ديناميكيًا من software_items
   ========================================================= */
const SoftwareCatalog = {
  items: [],
  favoriteIds: new Set(),
  activeFilter: 'all',

  async init() {
    this.grid = document.getElementById('softwareGrid');
    this.emptyState = document.getElementById('emptyState');
    this.filterTabs = document.querySelectorAll('.filter-tab');

    // قراءة الفلتر من URL
    const params = new URLSearchParams(window.location.search);
    const filterParam = params.get('filter');
    if (filterParam && ['all','android','desktop','industrial','saas','game'].includes(filterParam)) {
      this.activeFilter = filterParam;
    }

    this.filterTabs.forEach(tab => {
      const isActive = tab.dataset.filter === this.activeFilter;
      tab.classList.toggle('is-active', isActive);
      tab.setAttribute('aria-selected', String(isActive));
    });

    this.filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.filterTabs.forEach(t => { t.classList.remove('is-active'); t.setAttribute('aria-selected', 'false'); });
        tab.classList.add('is-active');
        tab.setAttribute('aria-selected', 'true');
        this.activeFilter = tab.dataset.filter;
        const url = new URL(window.location);
        url.searchParams.set('filter', this.activeFilter);
        window.history.pushState({ filter: this.activeFilter }, '', url);
        document.dispatchEvent(new CustomEvent('filter:changed'));
        this.render();
      });
    });

    window.addEventListener('popstate', (e) => {
      if (e.state && e.state.filter) {
        this.activeFilter = e.state.filter;
        this.filterTabs.forEach(tab => {
          const isActive = tab.dataset.filter === this.activeFilter;
          tab.classList.toggle('is-active', isActive);
          tab.setAttribute('aria-selected', String(isActive));
        });
        this.render();
        document.dispatchEvent(new CustomEvent('filter:changed'));
      }
    });

    document.addEventListener('i18n:changed', () => this.render());
    document.addEventListener('auth:changed', () => this.loadFavorites().then(() => this.render()));

    await this.loadFavorites();
    await this.fetchItems();
  },

  async loadFavorites() {
    this.favoriteIds = new Set();
    if (!window.isSupabaseConfigured() || !window.Auth || !window.Auth.isLoggedIn()) return;
    const { data } = await window.supabaseClient
      .from('favorites').select('item_id').eq('user_id', window.Auth.session.user.id);
    if (data) data.forEach(row => this.favoriteIds.add(row.item_id));
  },

  skeletonHTML(count = 6) {
    return Array.from({ length: count }).map(() => `
      <div class="skeleton-card">
        <div class="skeleton-line skeleton-line--icon"></div>
        <div class="skeleton-line skeleton-line--title"></div>
        <div class="skeleton-line skeleton-line--text"></div>
        <div class="skeleton-line skeleton-line--text"></div>
        <div class="skeleton-line skeleton-line--btn"></div>
      </div>`).join('');
  },

  async fetchItems() {
    if (this.grid) this.grid.innerHTML = this.skeletonHTML(6);

    if (!window.isSupabaseConfigured()) {
      this.items = [];
      this.render();
      return;
    }

    const { data, error } = await window.supabaseClient
      .from('software_items').select('*').eq('is_published', true).order('created_at', { ascending: false });

    this.items = error ? [] : (data || []);
    this.render();
  },

  localized(item, field) {
    const lang = window.i18n.current;
    return item[`${field}_${lang}`] || item[`${field}_ar`] || item[`${field}_fr`] || '';
  },

  render() {
    if (!this.grid) return;
    const filtered = this.activeFilter === 'all' ? this.items : this.items.filter(i => i.category === this.activeFilter);

    if (filtered.length === 0) {
      this.grid.innerHTML = '';
      if (this.emptyState) this.emptyState.hidden = false;
      return;
    }
    if (this.emptyState) this.emptyState.hidden = true;

    this.grid.innerHTML = filtered.map((item, index) => this.cardHTML(item, index)).join('');

    this.grid.querySelectorAll('.fav-btn').forEach(btn => {
      btn.addEventListener('click', () => this.toggleFavorite(btn.dataset.id, btn));
    });

    this.grid.querySelectorAll('.reveal').forEach(el => observeReveal(el));
  },

  cardHTML(item, index = 0) {
    const name = this.localized(item, 'name');
    const desc = this.localized(item, 'description');
    const isFav = this.favoriteIds.has(item.id);
    const catIcon = { 
      android: ICONS.android, 
      desktop: ICONS.desktop, 
      industrial: ICONS.industrial,
      saas: ICONS.saas, 
      game: ICONS.game 
    }[item.category] || ICONS.desktop;

    const actions = [];
    if (item.file_url) {
      actions.push(`<a href="${item.file_url}" class="btn btn--sm btn--primary" download target="_blank" rel="noopener">${window.i18n.t('btn_download')}</a>`);
    }
    if (item.external_url) {
      actions.push(`<a href="${item.external_url}" class="btn btn--sm ${item.file_url ? 'btn--ghost' : 'btn--primary'}" target="_blank" rel="noopener">${window.i18n.t('btn_use_online')}</a>`);
    }
    if (item.secondary_url) {
      actions.push(`<a href="${item.secondary_url}" class="btn btn--sm btn--ghost" target="_blank" rel="noopener">${window.i18n.t('btn_details')}</a>`);
    }

    return `
      <article class="soft-card trace-border reveal" style="--i:${index % 8}">
        <div class="soft-card-top">
          <span class="soft-icon" aria-hidden="true">${catIcon}</span>
          <div class="soft-card-top-right">
            ${item.badge_label ? `<span class="soft-badge">${escapeHTML(item.badge_label)}</span>` : ''}
            <button class="fav-btn ${isFav ? 'is-active' : ''}" data-id="${item.id}"
              aria-label="${window.i18n.t(isFav ? 'favorite_remove' : 'favorite_add')}" title="${window.i18n.t(isFav ? 'favorite_remove' : 'favorite_add')}">
              ${ICONS.star}
            </button>
          </div>
        </div>
        <h3>${escapeHTML(name)}</h3>
        <p class="soft-desc">${escapeHTML(desc)}</p>
        <div class="soft-meta">
          ${item.version ? `<span class="mono">v${escapeHTML(item.version)}</span><span class="dot">·</span>` : ''}
          <span>${escapeHTML(item.meta_text || '')}</span>
        </div>
        <div class="soft-actions">${actions.join('') || '<span class="soft-meta">—</span>'}</div>
      </article>`;
  },

  async toggleFavorite(itemId, btn) {
    if (!window.isSupabaseConfigured()) return;
    if (!window.Auth.isLoggedIn()) {
      document.getElementById('authModal') && document.querySelector('[data-open-auth]').click();
      return;
    }
    const userId = window.Auth.session.user.id;
    const isFav = this.favoriteIds.has(itemId);

    try {
      if (isFav) {
        await window.supabaseClient.from('favorites').delete().eq('user_id', userId).eq('item_id', itemId);
        this.favoriteIds.delete(itemId);
      } else {
        await window.supabaseClient.from('favorites').insert({ user_id: userId, item_id: itemId });
        this.favoriteIds.add(itemId);
      }
      btn.classList.toggle('is-active', !isFav);
      btn.setAttribute('aria-label', window.i18n.t(!isFav ? 'favorite_remove' : 'favorite_add'));
    } catch (err) {
      console.warn('Favorite toggle error:', err);
    }
  }
};

/* =========================================================
   معرض الأعمال — يُجلب ديناميكيًا من portfolio_items
   ========================================================= */
const PortfolioGallery = {
  items: [],

  async init() {
    this.grid = document.getElementById('portfolioGrid');
    this.emptyState = document.getElementById('portfolioEmptyState');
    if (!this.grid) return;
    document.addEventListener('i18n:changed', () => this.render());
    await this.fetchItems();
  },

  async fetchItems() {
    if (this.grid) {
      this.grid.innerHTML = Array.from({ length: 4 }).map(() =>
        `<div class="skeleton-card" style="aspect-ratio:4/3"></div>`).join('');
    }
    if (!window.isSupabaseConfigured()) { this.items = []; this.render(); return; }
    const { data, error } = await window.supabaseClient
      .from('portfolio_items').select('*').eq('is_published', true).order('created_at', { ascending: false });
    this.items = error ? [] : (data || []);
    this.render();
  },

  localizedTitle(item) {
    const lang = window.i18n.current;
    return item[`title_${lang}`] || item.title_fr || item.title_ar || '';
  },

  render() {
    if (!this.grid) return;
    if (this.items.length === 0) {
      this.grid.innerHTML = '';
      if (this.emptyState) this.emptyState.hidden = false;
      return;
    }
    if (this.emptyState) this.emptyState.hidden = true;

    this.grid.innerHTML = this.items.map((item, index) => {
      const isVideo = item.media_type === 'video';
      return `
        <figure class="portfolio-item reveal" style="--i:${index % 8}">
          <div class="portfolio-thumb trace-border">
            ${isVideo
              ? `<video src="${item.media_url}" muted loop playsinline data-autoplay></video>`
              : `<img src="${item.media_url}" alt="${escapeHTML(this.localizedTitle(item))}" loading="lazy">`}
          </div>
          <figcaption>${escapeHTML(this.localizedTitle(item))}</figcaption>
        </figure>
      `;
    }).join('');

    this.grid.querySelectorAll('video[data-autoplay]').forEach(video => {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      }, { threshold: 0.5 });
      observer.observe(video);
    });

    this.grid.querySelectorAll('.reveal').forEach(el => observeReveal(el));
  }
};

/* ---------- أيقونات SVG مصغّرة لكل تصنيف ---------- */
const ICONS = {
  android: `<svg viewBox="0 0 24 24" width="26" height="26"><path fill="currentColor" d="M17.6 9.48l1.84-3.18c.16-.31.03-.68-.26-.85-.29-.15-.65-.03-.83.24l-1.87 3.24a11.43 11.43 0 0 0-8.96 0L5.65 5.69c-.18-.27-.54-.39-.83-.24-.29.17-.42.54-.26.85L6.4 9.48C3.3 11.25 1.28 14.44 1 18h22c-.28-3.56-2.3-6.75-5.4-8.52M7 15.25a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5m10 0a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5"/></svg>`,
  desktop: `<svg viewBox="0 0 24 24" width="26" height="26"><path fill="currentColor" d="M4 4h16v11H4zm-2 13h20v2H2zm7-2h6v2H9z"/></svg>`,
  industrial: `<svg viewBox="0 0 24 24" width="26" height="26"><path fill="currentColor" d="M12 2 2 7v10l10 5 10-5V7L12 2zm0 2.2 6.8 3.4L12 11l-6.8-3.4L12 4.2zM4 9.3l7 3.5v7.9l-7-3.5V9.3zm9 11.4v-7.9l7-3.5v7.9l-7 3.5z"/></svg>`,
  saas: `<svg viewBox="0 0 24 24" width="26" height="26"><path fill="currentColor" d="M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`,
  game: `<svg viewBox="0 0 24 24" width="26" height="26"><path fill="currentColor" d="M17.5 8h-11A3.5 3.5 0 0 0 3 11.5v1A3.5 3.5 0 0 0 6.5 16c.9 0 1.7-.35 2.3-.93L10 14h4l1.2 1.07c.6.58 1.4.93 2.3.93a3.5 3.5 0 0 0 3.5-3.5v-1A3.5 3.5 0 0 0 17.5 8z"/></svg>`,
  star: `<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="m12 17.27 6.18 3.73-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`
};

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

/* ---------- كشف عند التمرير (IntersectionObserver مشترك) ---------- */
let sharedObserver = null;
function observeReveal(el) {
  if (!('IntersectionObserver' in window)) { el.classList.add('is-visible'); return; }
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); sharedObserver.unobserve(entry.target); }
      });
    }, { threshold: 0.12 });
  }
  sharedObserver.observe(el);
}
document.querySelectorAll('.service-card, .portfolio-item, .contact-form, .contact-side').forEach(el => {
  el.classList.add('reveal');
  document.addEventListener('DOMContentLoaded', () => observeReveal(el));
});