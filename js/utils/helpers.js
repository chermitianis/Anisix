/* =========================================================
   helpers.js — دوال مساعدة مشتركة
   ========================================================= */

/**
 * تحويل النص إلى HTML آمن (منع حقن XSS)
 */
export function escapeHTML(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * تحويل نص إلى صيغة آمنة للاستخدام داخل خاصية HTML (attribute)
 * يمنع كسر الخاصية عبر علامات الاقتباس (" ') وهجمات XSS المرتبطة بالروابط
 */
export function escapeAttr(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * التحقق من أن الرابط يستخدم بروتوكول آمن (http/https/mailto/tel فقط)
 * يمنع حقن روابط javascript: أو data: الخبيثة القادمة من قاعدة البيانات
 */
export function isSafeUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    const trimmed = url.trim();
    if (/^(javascript|data|vbscript):/i.test(trimmed)) return false;
    // روابط نسبية أو تبدأ ببروتوكول آمن معروف
    return /^(https?:|mailto:|tel:|\/|#)/i.test(trimmed) || !/^[a-z]+:/i.test(trimmed);
  } catch (e) {
    return false;
  }
}

/**
 * أيقونات SVG مصغّرة لكل تصنيف برمجي
 */
export const ICONS = {
  android: `<svg viewBox="0 0 24 24" width="26" height="26"><path fill="currentColor" d="M17.6 9.48l1.84-3.18c.16-.31.03-.68-.26-.85-.29-.15-.65-.03-.83.24l-1.87 3.24a11.43 11.43 0 0 0-8.96 0L5.65 5.69c-.18-.27-.54-.39-.83-.24-.29.17-.42.54-.26.85L6.4 9.48C3.3 11.25 1.28 14.44 1 18h22c-.28-3.56-2.3-6.75-5.4-8.52M7 15.25a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5m10 0a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5"/></svg>`,
  desktop: `<svg viewBox="0 0 24 24" width="26" height="26"><path fill="currentColor" d="M4 4h16v11H4zm-2 13h20v2H2zm7-2h6v2H9z"/></svg>`,
  industrial: `<svg viewBox="0 0 24 24" width="26" height="26"><path fill="currentColor" d="M12 2 2 7v10l10 5 10-5V7L12 2zm0 2.2 6.8 3.4L12 11l-6.8-3.4L12 4.2zM4 9.3l7 3.5v7.9l-7-3.5V9.3zm9 11.4v-7.9l7-3.5v7.9l-7 3.5z"/></svg>`,
  saas: `<svg viewBox="0 0 24 24" width="26" height="26"><path fill="currentColor" d="M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`,
  game: `<svg viewBox="0 0 24 24" width="26" height="26"><path fill="currentColor" d="M17.5 8h-11A3.5 3.5 0 0 0 3 11.5v1A3.5 3.5 0 0 0 6.5 16c.9 0 1.7-.35 2.3-.93L10 14h4l1.2 1.07c.6.58 1.4.93 2.3.93a3.5 3.5 0 0 0 3.5-3.5v-1A3.5 3.5 0 0 0 17.5 8z"/></svg>`,
  star: `<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="m12 17.27 6.18 3.73-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>`
};

/**
 * مراقب الكشف عند التمرير (IntersectionObserver مشترك)
 */
let sharedObserver = null;

export function observeReveal(el) {
  if (!('IntersectionObserver' in window)) {
    el.classList.add('is-visible');
    return;
  }
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

/**
 * عرض إشعار منبثق (Toast)
 */
export function showToast(message, type = 'info', duration = 3500) {
  const existing = document.querySelector('.toast-notification');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast-notification toast-${type}`;
  toast.textContent = message;
  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '30px',
    left: '50%',
    transform: 'translateX(-50%)',
    background: type === 'success' ? '#1F6B4D' : type === 'error' ? '#B23A2E' : '#10263B',
    color: '#fff',
    padding: '14px 28px',
    borderRadius: '8px',
    fontSize: '0.9rem',
    zIndex: '9999',
    boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
    maxWidth: '90%',
    transition: 'opacity 0.3s ease, transform 0.3s ease',
    opacity: '1',
    transform: 'translateX(-50%) translateY(0)',
    fontWeight: '500',
    fontFamily: 'IBM Plex Sans, sans-serif'
  });

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(12px)';
    setTimeout(() => toast.remove(), 400);
  }, duration);
}