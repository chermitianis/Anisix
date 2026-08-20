/* =========================================================
   main.js — النقطة الرئيسية للموقع
   ملاحظة أمنية: auth.js / i18n.js / supabase-client.js يتم تحميلها
   كسكربتات كلاسيكية (بدون export) لأنها مُستخدمة أيضًا في admin.html
   بدون type="module". لذلك لا نستوردها هنا بـ import، بل نستعمل
   window.Auth / window.i18n بعد التأكد من جاهزيتها.
   ========================================================= */
import { initTabNavigation } from './modules/tab-navigation.js';
import { initContactForm } from './modules/contact-form.js';
import { PortfolioGallery } from './modules/portfolio-gallery.js';
import { SoftwareCatalog } from './modules/software-catalog.js';
import { observeReveal } from './utils/helpers.js';

// ننتظر جاهزية window.Auth (يُعرَّف داخل auth.js عند DOMContentLoaded)
function waitForGlobal(name, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    (function check() {
      if (window[name]) return resolve(window[name]);
      if (Date.now() - start > timeout) return reject(new Error(`${name} introuvable après ${timeout}ms`));
      requestAnimationFrame(check);
    })();
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Démarrage de la plateforme...');

  try {
    // 1. تهيئة المصادقة (auth.js يُهيّئ نفسه تلقائيًا، هنا فقط ننتظره)
    await waitForGlobal('Auth');
    if (!window.Auth.isLoggedIn()) {
      // auth.js يستدعي checkUserState() ذاتيًا؛ لا حاجة لاستدعاء إضافي
    }
    console.log('✅ Auth prêt');

    // 2. تهيئة الترجمة
    await waitForGlobal('i18n');
    window.i18n.apply();
    console.log('✅ i18n appliqué');

    // 3. التنقل بين الأقسام
    initTabNavigation();
    console.log('✅ Tab Navigation initialisé');

    // 4. نموذج التواصل
    initContactForm();
    console.log('✅ Contact Form initialisé');

    // 5. كتالوج البرمجيات
    await SoftwareCatalog.init();
    console.log('✅ Software Catalog initialisé');

    // 6. معرض الأعمال
    await PortfolioGallery.init();
    console.log('✅ Portfolio Gallery initialisé');

    // 7. تأثير الكشف
    document.querySelectorAll('.service-card, .portfolio-item, .contact-form, .contact-side, .soft-card').forEach(el => {
      el.classList.add('reveal');
      observeReveal(el);
    });
    console.log('✅ Reveal effect appliqué');

    // 8. استئناف التحميل المعلق بعد تسجيل الدخول (عبر رابط موقّع آمن)
    await SoftwareCatalog.resumePendingDownload();

    console.log('🚀 Plateforme prête pour la production!');
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error);
    const toast = document.createElement('div');
    toast.className = 'toast-notification toast-error';
    toast.textContent = '⚠️ Erreur de chargement de la plateforme. Veuillez rafraîchir la page.';
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 400);
    }, 5000);
  }
});
