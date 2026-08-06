/* =========================================================
   main.js — Logique principale du site (index.html)
   Gestion du catalogue, portfolio, formulaire, et animations
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- 1) Menu mobile ---------- */
  const navToggle = document.getElementById('navToggle');
  const mainNav = document.getElementById('mainNav');
  if (navToggle && mainNav) {
    navToggle.addEventListener('click', () => {
      const isOpen = mainNav.classList.toggle('is-open');
      navToggle.classList.toggle('is-open', isOpen);
      navToggle.setAttribute('aria-expanded', String(isOpen));
    });
    mainNav.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        mainNav.classList.remove('is-open');
        navToggle.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- 2) Navigation active (scroll) ---------- */
  const sections = document.querySelectorAll('main section[id], .hero[id]');
  const navLinks = document.querySelectorAll('.nav-link');
  const highlightNav = () => {
    let currentId = '';
    const scrollPos = window.scrollY + 140;
    sections.forEach(section => {
      if (scrollPos >= section.offsetTop) currentId = section.id;
    });
    navLinks.forEach(link => {
      link.classList.toggle('is-active', link.getAttribute('href') === `#${currentId}`);
    });
  };
  window.addEventListener('scroll', highlightNav, { passive: true });
  highlightNav();

  /* ---------- 3) Bouton retour en haut ---------- */
  const scrollTopBtn = document.getElementById('scrollTop');
  if (scrollTopBtn) {
    window.addEventListener('scroll', () => {
      scrollTopBtn.classList.toggle('is-visible', window.scrollY > 500);
    }, { passive: true });
    scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* ---------- 4) Footer : Année et date ---------- */
  const footerYear = document.getElementById('footerYear');
  if (footerYear) footerYear.textContent = new Date().getFullYear();
  const footerDate = document.getElementById('footerDate');
  if (footerDate) footerDate.textContent = new Date().toISOString().slice(0, 7);

  /* ---------- 5) Formulaire de contact ---------- */
  initContactForm();

  /* ---------- 6) Catalogue des logiciels ---------- */
  SoftwareCatalog.init();

  /* ---------- 7) Galerie du portfolio ---------- */
  PortfolioGallery.init();

  /* ---------- 8) Réécoute des événements de langue et d'auth ---------- */
  document.addEventListener('i18n:changed', () => {
    SoftwareCatalog.render();
    PortfolioGallery.render();
  });
  document.addEventListener('auth:changed', () => {
    SoftwareCatalog.loadFavorites().then(() => SoftwareCatalog.render());
  });
});

/* =========================================================
   FORMULAIRE DE CONTACT
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
    if (row) row.classList.toggle('has-error', !ok);
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
      formNote.textContent = window.t('form_error_generic') || 'Veuillez corriger les champs surlignés.';
      formNote.classList.remove('is-success');
      return;
    }

    const payload = {
      name: form.elements['name'].value.trim(),
      contact_info: form.elements['contactInfo'].value.trim(),
      service_type: form.elements['serviceType'].value,
      details: form.elements['details'].value.trim(),
      user_id: window.Auth && window.Auth.user ? window.Auth.user.id : null
    };

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    try {
      if (window.isSupabaseConfigured && window.isSupabaseConfigured() && window.supabaseClient) {
        const { error } = await window.supabaseClient.from('contact_messages').insert(payload);
        if (error) throw error;
      } else {
        console.log('📝 Mode démo : message sauvegardé localement', payload);
      }
      formNote.textContent = window.t('form_success') || '✅ Message envoyé avec succès !';
      formNote.classList.add('is-success');
      form.reset();
      attempted = false;
    } catch (err) {
      formNote.textContent = window.t('form_error_generic') || '❌ Une erreur est survenue. Réessayez.';
      formNote.classList.remove('is-success');
    } finally {
      submitBtn.disabled = false;
    }
  });
}

/* =========================================================
   CATALOGUE DES LOGICIELS (SoftwareCatalog)
   ========================================================= */
const SoftwareCatalog = {
  items: [],
  favoriteIds: new Set(),
  activeFilter: 'all',

  async init() {
    this.grid = document.getElementById('softwareGrid');
    this.emptyState = document.getElementById('emptyState');
    this.filterTabs = document.querySelectorAll('.filter-tab');

    this.filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.filterTabs.forEach(t => { t.classList.remove('is-active'); t.setAttribute('aria-selected', 'false'); });
        tab.classList.add('is-active');
        tab.setAttribute('aria-selected', 'true');
        this.activeFilter = tab.dataset.filter;
        this.render();
      });
    });

    await this.loadFavorites();
    await this.fetchItems();

    // Recharger les favoris quand l'utilisateur se connecte/déconnecte
    document.addEventListener('auth:changed', () => {
      this.loadFavorites().then(() => this.render());
    });
  },

  async loadFavorites() {
    this.favoriteIds = new Set();
    if (!window.isSupabaseConfigured || !window.isSupabaseConfigured() || !window.Auth || !window.Auth.isLoggedIn()) return;
    if (!window.supabaseClient) return;
    
    try {
      const { data } = await window.supabaseClient
        .from('favorites')
        .select('item_id')
        .eq('user_id', window.Auth.user.id);
      if (data) data.forEach(row => this.favoriteIds.add(row.item_id));
    } catch (e) {
      console.warn('Impossible de charger les favoris :', e);
    }
  },

  async fetchItems() {
    if (!this.grid) return;
    this.grid.innerHTML = `<p class="loading-state" data-i18n="loading_items">${window.t('loading_items')}</p>`;

    if (!window.isSupabaseConfigured || !window.isSupabaseConfigured() || !window.supabaseClient) {
      this.items = [];
      this.render();
      return;
    }

    try {
      const { data, error } = await window.supabaseClient
        .from('software_items')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });
      this.items = error ? [] : (data || []);
    } catch (e) {
      console.warn('Erreur chargement logiciels :', e);
      this.items = [];
    }
    this.render();
  },

  localized(item, field) {
    const lang = window.currentLang || 'fr';
    return item[`${field}_${lang}`] || item[`${field}_fr`] || '';
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

    this.grid.innerHTML = filtered.map(item => this.cardHTML(item)).join('');

    this.grid.querySelectorAll('.fav-btn').forEach(btn => {
      btn.addEventListener('click', () => this.toggleFavorite(btn.dataset.id, btn));
    });

    this.grid.querySelectorAll('.reveal').forEach(el => observeReveal(el));
  },

  cardHTML(item) {
    const name = this.localized(item, 'name');
    const desc = this.localized(item, 'description');
    const isFav = this.favoriteIds.has(item.id);
    const catIcon = {
      android: '📱',
      desktop: '💻',
      saas: '☁️',
      game: '🎮',
      industrial: '🏭'
    }[item.category] || '📦';

    const actions = [];
    if (item.file_url) {
      actions.push(`<a href="${item.file_url}" class="btn btn--sm btn--primary" download target="_blank" rel="noopener">${window.t('btn_download') || 'Télécharger'}</a>`);
    }
    if (item.external_url) {
      actions.push(`<a href="${item.external_url}" class="btn btn--sm ${item.file_url ? 'btn--ghost' : 'btn--primary'}" target="_blank" rel="noopener">${window.t('btn_use_online') || 'Utiliser en ligne'}</a>`);
    }

    return `
      <article class="soft-card reveal">
        <div class="soft-card-top">
          <span class="soft-icon" aria-hidden="true">${catIcon}</span>
          <div class="soft-card-top-right">
            ${item.badge_label ? `<span class="soft-badge">${escapeHTML(item.badge_label)}</span>` : ''}
            <button class="fav-btn ${isFav ? 'is-active' : ''}" data-id="${item.id}" aria-label="${window.t(isFav ? 'favorite_remove' : 'favorite_add')}">
              ⭐
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
    if (!window.isSupabaseConfigured || !window.isSupabaseConfigured() || !window.supabaseClient) return;
    if (!window.Auth.isLoggedIn()) {
      if (window.Auth && window.Auth.openModal) {
        window.Auth.openModal();
      } else {
        document.querySelector('[data-open-auth]')?.click();
      }
      return;
    }
    const userId = window.Auth.user.id;
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
    } catch (e) {
      console.error('Erreur favori :', e);
    }
  }
};

/* =========================================================
   GALERIE PORTFOLIO (PortfolioGallery)
   ========================================================= */
const PortfolioGallery = {
  items: [],

  async init() {
    this.grid = document.getElementById('portfolioGrid');
    this.emptyState = document.getElementById('portfolioEmptyState');
    if (!this.grid) return;
    await this.fetchItems();
  },

  async fetchItems() {
    if (!window.isSupabaseConfigured || !window.isSupabaseConfigured() || !window.supabaseClient) {
      this.items = [];
      this.render();
      return;
    }
    try {
      const { data, error } = await window.supabaseClient
        .from('portfolio_items')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });
      this.items = error ? [] : (data || []);
    } catch (e) {
      console.warn('Erreur chargement portfolio :', e);
      this.items = [];
    }
    this.render();
  },

  localizedTitle(item) {
    const lang = window.currentLang || 'fr';
    return item[`title_${lang}`] || item.title_fr || '';
  },

  render() {
    if (!this.grid) return;
    if (this.items.length === 0) {
      this.grid.innerHTML = '';
      if (this.emptyState) this.emptyState.hidden = false;
      return;
    }
    if (this.emptyState) this.emptyState.hidden = true;

    this.grid.innerHTML = this.items.map(item => `
      <figure class="portfolio-item reveal">
        <div class="portfolio-thumb">
          ${item.media_type === 'video'
            ? `<video src="${item.media_url}" muted loop playsinline onmouseover="this.play()" onmouseout="this.pause()"></video>`
            : `<img src="${item.media_url}" alt="${escapeHTML(this.localizedTitle(item))}" loading="lazy">`}
        </div>
        <figcaption>${escapeHTML(this.localizedTitle(item))}</figcaption>
      </figure>
    `).join('');

    this.grid.querySelectorAll('.reveal').forEach(el => observeReveal(el));
  }
};

/* =========================================================
   FONCTIONS UTILITAIRES
   ========================================================= */
function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

let sharedObserver = null;
function observeReveal(el) {
  if (!('IntersectionObserver' in window)) { el.classList.add('is-visible'); return; }
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          sharedObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
  }
  sharedObserver.observe(el);
}

// Appliquer l'effet reveal aux éléments existants
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.service-card, .portfolio-item, .contact-form, .contact-side, .soft-card').forEach(el => {
    el.classList.add('reveal');
    observeReveal(el);
  });
});

// Réappliquer lors des changements de langue (pour les nouveaux éléments)
document.addEventListener('i18n:changed', () => {
  document.querySelectorAll('.reveal:not(.is-visible)').forEach(el => observeReveal(el));
});