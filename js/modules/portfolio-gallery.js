/* =========================================================
   portfolio-gallery.js — عرض معرض الأعمال
   ========================================================= */

import { escapeHTML, escapeAttr, isSafeUrl, observeReveal } from '../utils/helpers.js';

export const PortfolioGallery = {
  items: [],
  grid: null,
  emptyState: null,

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
        `<div class="skeleton-card" style="aspect-ratio:4/3"></div>`
      ).join('');
    }

    if (!window.isSupabaseConfigured()) {
      this.items = [];
      this.render();
      return;
    }

    const { data, error } = await window.supabaseClient
      .from('portfolio_items')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

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

    this.grid.innerHTML = this.items.filter(item => isSafeUrl(item.media_url)).map((item, index) => {
      const isVideo = item.media_type === 'video';
      return `
        <figure class="portfolio-item reveal" style="--i:${index % 8}">
          <div class="portfolio-thumb trace-border">
            ${isVideo
              ? `<video src="${escapeAttr(item.media_url)}" muted loop playsinline data-autoplay></video>`
              : `<img src="${escapeAttr(item.media_url)}" alt="${escapeAttr(this.localizedTitle(item))}" loading="lazy">`}
          </div>
          <figcaption>${escapeHTML(this.localizedTitle(item))}</figcaption>
        </figure>
      `;
    }).join('');

    // تشغيل الفيديوهات عند الظهور
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

    // تفعيل تأثير الكشف
    this.grid.querySelectorAll('.reveal').forEach(el => observeReveal(el));
  }
};