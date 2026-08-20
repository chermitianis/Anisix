/* =========================================================
   software-catalog.js — عرض البرمجيات، التصفية، المفضلة، التحميل
   ========================================================= */

import { escapeHTML, escapeAttr, isSafeUrl, ICONS, showToast, observeReveal } from '../utils/helpers.js';

export const SoftwareCatalog = {
  items: [],
  favoriteIds: new Set(),
  activeFilter: 'all',
  grid: null,
  emptyState: null,
  loadMoreBtn: null,
  loadMoreContainer: null,
  page: 0,
  limit: 12,
  totalCount: 0,
  isLoading: false,
  pendingDownload: null,

  async init() {
    this.grid = document.getElementById('softwareGrid');
    this.emptyState = document.getElementById('emptyState');
    this.loadMoreBtn = document.getElementById('loadMoreBtn');
    this.loadMoreContainer = document.getElementById('loadMoreContainer');

    // قراءة الفلتر من URL
    const params = new URLSearchParams(window.location.search);
    const filterParam = params.get('filter');
    if (filterParam && ['all','android','desktop','industrial','saas','game'].includes(filterParam)) {
      this.activeFilter = filterParam;
    }

    this.setupFilters();
    this.setupLoadMore();

    document.addEventListener('i18n:changed', () => this.render());
    document.addEventListener('auth:changed', () => {
      this.loadFavorites().then(() => this.render());
    });

    // استئناف التحميل المعلق فور تسجيل الدخول (رابط موقّع آمن، وليس رابطًا مباشرًا)
    document.addEventListener('auth:changed', () => {
      if (window.Auth && window.Auth.isLoggedIn()) {
        this.resumePendingDownload();
      }
    });

    await this.loadFavorites();
    await this.fetchItems(true);
  },

  setupFilters() {
    const tabs = document.querySelectorAll('.filter-tab');
    tabs.forEach(tab => {
      const isActive = tab.dataset.filter === this.activeFilter;
      tab.classList.toggle('is-active', isActive);
      tab.setAttribute('aria-selected', String(isActive));

      tab.addEventListener('click', () => {
        tabs.forEach(t => {
          t.classList.remove('is-active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('is-active');
        tab.setAttribute('aria-selected', 'true');
        this.activeFilter = tab.dataset.filter;
        this.page = 0; // إعادة تعيين الصفحة
        const url = new URL(window.location);
        url.searchParams.set('filter', this.activeFilter);
        window.history.pushState({ filter: this.activeFilter }, '', url);
        document.dispatchEvent(new CustomEvent('filter:changed'));
        this.fetchItems(true);
      });
    });

    window.addEventListener('popstate', (e) => {
      if (e.state && e.state.filter) {
        this.activeFilter = e.state.filter;
        this.page = 0;
        tabs.forEach(tab => {
          const isActive = tab.dataset.filter === this.activeFilter;
          tab.classList.toggle('is-active', isActive);
          tab.setAttribute('aria-selected', String(isActive));
        });
        this.fetchItems(true);
        document.dispatchEvent(new CustomEvent('filter:changed'));
      }
    });
  },

  setupLoadMore() {
    if (this.loadMoreBtn) {
      this.loadMoreBtn.addEventListener('click', () => {
        this.page++;
        this.fetchItems(false);
      });
    }
  },

  async loadFavorites() {
    this.favoriteIds = new Set();
    if (!window.isSupabaseConfigured() || !window.Auth || !window.Auth.isLoggedIn()) return;

    try {
      const { data } = await window.supabaseClient
        .from('favorites')
        .select('item_id')
        .eq('user_id', window.Auth.session.user.id);
      if (data) data.forEach(row => this.favoriteIds.add(row.item_id));
    } catch (e) {
      console.warn('Erreur chargement favoris:', e);
    }
  },

  skeletonHTML(count = this.limit) {
    return Array.from({ length: Math.min(count, this.limit) }).map(() => `
      <div class="skeleton-card">
        <div class="skeleton-line skeleton-line--icon"></div>
        <div class="skeleton-line skeleton-line--title"></div>
        <div class="skeleton-line skeleton-line--text"></div>
        <div class="skeleton-line skeleton-line--text"></div>
        <div class="skeleton-line skeleton-line--btn"></div>
      </div>
    `).join('');
  },

  async fetchItems(reset = true) {
    if (this.isLoading) return;
    this.isLoading = true;

    if (reset) {
      this.items = [];
      this.page = 0;
      if (this.grid) this.grid.innerHTML = this.skeletonHTML(this.limit);
      if (this.loadMoreContainer) this.loadMoreContainer.style.display = 'none';
    }

    if (!window.isSupabaseConfigured()) {
      this.items = [];
      this.render();
      this.isLoading = false;
      return;
    }

    const start = this.page * this.limit;
    const end = start + this.limit - 1;

    try {
      let query = window.supabaseClient
        .from('software_items')
        .select('id,category,badge_label,name_fr,name_ar,name_en,description_fr,description_ar,description_en,version,meta_text,file_url,external_url,secondary_url,created_at', { count: 'exact' })
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (this.activeFilter !== 'all') {
        query = query.eq('category', this.activeFilter);
      }

      const { data, count, error } = await query.range(start, end);

      if (error) throw error;

      this.totalCount = count || 0;

      if (reset) {
        this.items = data || [];
      } else {
        this.items = [...this.items, ...(data || [])];
      }

      // إظهار/إخفاء زر "تحميل المزيد"
      if (this.loadMoreContainer) {
        const hasMore = this.items.length < this.totalCount;
        this.loadMoreContainer.style.display = hasMore ? 'block' : 'none';
      }

      this.render();
    } catch (err) {
      console.error('Erreur chargement logiciels:', err);
      if (this.grid) {
        this.grid.innerHTML = `<p class="empty-state">❌ Erreur de chargement: ${err.message}</p>`;
      }
    } finally {
      this.isLoading = false;
    }
  },

  localized(item, field) {
    const lang = window.i18n.current;
    return item[`${field}_${lang}`] || item[`${field}_ar`] || item[`${field}_fr`] || '';
  },

  render() {
    if (!this.grid) return;

    if (this.items.length === 0 && !this.isLoading) {
      this.grid.innerHTML = '';
      if (this.emptyState) this.emptyState.hidden = false;
      return;
    }
    if (this.emptyState) this.emptyState.hidden = true;

    const filtered = this.items;

    this.grid.innerHTML = filtered.map((item, index) => this.cardHTML(item, index)).join('');

    // مستمعات الأزرار
    this.grid.querySelectorAll('.fav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleFavorite(btn.dataset.id, btn);
      });
    });

    // مستمعات التحميل
    this.grid.querySelectorAll('.download-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleDownload(btn.dataset.id, btn);
      });
    });

    // تفعيل تأثير الكشف
    this.grid.querySelectorAll('.reveal').forEach(el => observeReveal(el));
  },

  cardHTML(item, index = 0) {
    const name = this.localized(item, 'name');
    const desc = this.localized(item, 'description');
    const isFav = this.favoriteIds.has(item.id);
    const catIcon = ICONS[item.category] || ICONS.desktop;

    let actions = [];
    if (item.file_url) {
      // 🔒 لا نضع أي رابط مباشر في الصفحة. الرابط الحقيقي مؤقّت (60 ثانية)
      // ويُولَّد فقط عند الضغط، عبر Edge Function آمنة بعد التحقق من الهوية والخطة.
      const planBadge = item.required_plan && item.required_plan !== 'free'
        ? `<span class="soft-plan-lock" title="${escapeAttr(item.required_plan)}">🔒 ${escapeHTML(item.required_plan.toUpperCase())}</span>` : '';
      actions.push(`<button class="btn btn--sm btn--primary download-btn" data-id="${escapeAttr(item.id)}">${window.i18n.t('btn_download')}</button>${planBadge}`);
    }
    if (item.external_url && isSafeUrl(item.external_url)) {
      actions.push(`<a href="${escapeAttr(item.external_url)}" class="btn btn--sm ${item.file_url ? 'btn--ghost' : 'btn--primary'}" target="_blank" rel="noopener noreferrer">${window.i18n.t('btn_use_online')}</a>`);
    }
    if (item.secondary_url && isSafeUrl(item.secondary_url)) {
      actions.push(`<a href="${escapeAttr(item.secondary_url)}" class="btn btn--sm btn--ghost" target="_blank" rel="noopener noreferrer">${window.i18n.t('btn_details')}</a>`);
    }

    return `
      <article class="soft-card trace-border reveal" style="--i:${index % 8}">
        <div class="soft-card-top">
          <span class="soft-icon" aria-hidden="true">${catIcon}</span>
          <div class="soft-card-top-right">
            ${item.badge_label ? `<span class="soft-badge">${escapeHTML(item.badge_label)}</span>` : ''}
            <button class="fav-btn ${isFav ? 'is-active' : ''}" data-id="${escapeAttr(item.id)}"
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

  async handleDownload(itemId, btn) {
    if (!window.Auth || !window.Auth.isLoggedIn()) {
      // حفظ الطلب المعلق لاستئنافه تلقائيًا بعد تسجيل الدخول
      localStorage.setItem('pending_download', JSON.stringify({ itemId }));
      const authBtn = document.querySelector('[data-open-auth]');
      if (authBtn) authBtn.click();
      showToast('Veuillez vous connecter pour télécharger.', 'info');
      return;
    }

    if (btn) { btn.disabled = true; btn.dataset.originalText = btn.textContent; btn.textContent = '...'; }

    try {
      const client = window.supabaseClient;
      if (!client) throw new Error('no-client');

      const { data, error } = await client.functions.invoke('get-download-url', {
        body: { itemId },
      });

      if (error || !data?.url) {
        const msg = data?.error === 'upgrade_required'
          ? (data.message || 'هذا الملف يتطلب اشتراك أعلى.')
          : '⚠️ تعذّر توليد رابط التحميل. حاول مجددًا.';
        showToast(msg, 'error');
        return;
      }

      // فتح الرابط الموقّع المؤقت (صالح لمدة 60 ثانية فقط)
      window.open(data.url, '_blank', 'noopener,noreferrer');
      showToast('✅ التحميل بدأ...', 'success');
    } catch (e) {
      console.error(e);
      showToast('⚠️ خطأ في الاتصال بالخادم. تحقق من اتصالك.', 'error');
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = btn.dataset.originalText || window.i18n.t('btn_download'); }
    }
  },

  async resumePendingDownload() {
    const pending = localStorage.getItem('pending_download');
    if (!pending || !window.Auth?.isLoggedIn()) return;
    localStorage.removeItem('pending_download');
    try {
      const { itemId } = JSON.parse(pending);
      if (itemId) await this.handleDownload(itemId, null);
    } catch (e) { /* ignore */ }
  },

  async toggleFavorite(itemId, btn) {
    if (!window.isSupabaseConfigured()) {
      showToast('Connexion à la base de données requise.', 'error');
      return;
    }

    if (!window.Auth || !window.Auth.isLoggedIn()) {
      const authBtn = document.querySelector('[data-open-auth]');
      if (authBtn) authBtn.click();
      showToast('Veuillez vous connecter pour ajouter aux favoris.', 'info');
      return;
    }

    const userId = window.Auth.session.user.id;
    const isFav = this.favoriteIds.has(itemId);

    try {
      if (isFav) {
        await window.supabaseClient
          .from('favorites')
          .delete()
          .eq('user_id', userId)
          .eq('item_id', itemId);
        this.favoriteIds.delete(itemId);
        showToast('Retiré des favoris.', 'info');
      } else {
        await window.supabaseClient
          .from('favorites')
          .insert({ user_id: userId, item_id: itemId });
        this.favoriteIds.add(itemId);
        showToast('Ajouté aux favoris !', 'success');
      }
      btn.classList.toggle('is-active', !isFav);
      btn.setAttribute('aria-label', window.i18n.t(!isFav ? 'favorite_remove' : 'favorite_add'));
    } catch (err) {
      console.warn('Erreur favori:', err);
      showToast('Erreur lors de la mise à jour des favoris.', 'error');
    }
  }
};