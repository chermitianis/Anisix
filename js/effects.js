/* =========================================================
   طبقة المؤثرات البصرية — تُبنى فوق الوظائف الأساسية في main.js
   كل مؤثر معزول ومحمي بفحص prefers-reduced-motion ودعم اللمس
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouchDevice = window.matchMedia('(hover: none)').matches;

  /* ---------- 1) شريط تقدّم التمرير (محسّن بـ requestAnimationFrame) ---------- */
  const progressBar = document.getElementById('scrollProgress');
  if (progressBar) {
    let ticking = false;
    const updateProgress = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollable = document.documentElement.scrollHeight - window.innerHeight;
          const pct = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
          progressBar.style.width = pct + '%';
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
    updateProgress();
  }

  /* ---------- 2) مؤشر التنقل المنزلق تحت الرابط النشط (محسّن) ---------- */
  const mainNav = document.getElementById('mainNav');
  if (mainNav && window.innerWidth > 980) {
    let indicator = mainNav.querySelector('.nav-indicator');
    if (!indicator) {
      indicator = document.createElement('span');
      indicator.className = 'nav-indicator';
      mainNav.appendChild(indicator);
    }

    const moveIndicatorTo = (link) => {
      if (!link || !indicator) {
        indicator.classList.remove('is-active');
        return;
      }
      const rect = link.getBoundingClientRect();
      const navRect = mainNav.getBoundingClientRect();
      // حساب الموضع النسبي داخل الـ nav
      const left = rect.left - navRect.left + mainNav.scrollLeft;
      indicator.style.width = rect.width + 'px';
      indicator.style.transform = `translateX(${left}px)`;
      indicator.classList.add('is-active');
    };

    // تحديث عند تغيير class على الروابط
    const observer = new MutationObserver(() => {
      const active = mainNav.querySelector('.nav-link.is-active');
      moveIndicatorTo(active);
    });
    mainNav.querySelectorAll('.nav-link').forEach(link => {
      observer.observe(link, { attributes: true, attributeFilter: ['class'] });
    });

    // تحديث عند تغيير حجم النافذة أو تغيير اللغة
    const updateOnResize = () => {
      const active = mainNav.querySelector('.nav-link.is-active');
      moveIndicatorTo(active);
    };
    window.addEventListener('resize', updateOnResize);
    document.addEventListener('i18n:changed', () => {
      setTimeout(updateOnResize, 100);
    });

    // تشغيل أولي
    setTimeout(updateOnResize, 50);
  }

  /* ---------- 3) بقعة الإضاءة المتتبعة للمؤشر في Hero (مع دعم اللمس) ---------- */
  const hero = document.getElementById('hero');
  if (hero && !prefersReducedMotion) {
    let spotlight = hero.querySelector('.hero-spotlight');
    if (!spotlight) {
      spotlight = document.createElement('div');
      spotlight.className = 'hero-spotlight';
      hero.prepend(spotlight);
    }

    const updateSpotlight = (clientX, clientY) => {
      const rect = hero.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * 100;
      const y = ((clientY - rect.top) / rect.height) * 100;
      spotlight.style.setProperty('--mx', x + '%');
      spotlight.style.setProperty('--my', y + '%');
      spotlight.style.opacity = '1';
    };

    if (!isTouchDevice) {
      hero.addEventListener('mousemove', (e) => {
        updateSpotlight(e.clientX, e.clientY);
      });
      hero.addEventListener('mouseleave', () => {
        spotlight.style.opacity = '0';
      });
    } else {
      // دعم اللمس
      hero.addEventListener('touchmove', (e) => {
        const touch = e.touches[0];
        if (touch) updateSpotlight(touch.clientX, touch.clientY);
      }, { passive: true });
      hero.addEventListener('touchend', () => {
        spotlight.style.opacity = '0';
      });
      // إظهار البقعة عند اللمس الأولي
      hero.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        if (touch) updateSpotlight(touch.clientX, touch.clientY);
      }, { passive: true });
    }
  }

  /* ---------- 4) أزرار مغناطيسية (تنجذب بلطف نحو المؤشر) مع دعم اللمس ---------- */
  if (!prefersReducedMotion) {
    const magneticBtns = document.querySelectorAll('.btn--primary, .btn--outline');
    magneticBtns.forEach(btn => {
      const strength = isTouchDevice ? 6 : 12; // قوة أقل على اللمس

      const handleMove = (clientX, clientY) => {
        const rect = btn.getBoundingClientRect();
        const relX = (clientX - rect.left - rect.width / 2) / (rect.width / 2);
        const relY = (clientY - rect.top - rect.height / 2) / (rect.height / 2);
        btn.style.transform = `translate(${relX * strength}px, ${relY * strength * 0.6}px)`;
      };

      const reset = () => {
        btn.style.transform = '';
      };

      if (!isTouchDevice) {
        btn.addEventListener('mousemove', (e) => handleMove(e.clientX, e.clientY));
        btn.addEventListener('mouseleave', reset);
      } else {
        btn.addEventListener('touchmove', (e) => {
          const touch = e.touches[0];
          if (touch) handleMove(touch.clientX, touch.clientY);
        }, { passive: true });
        btn.addEventListener('touchend', reset);
      }
    });
  }

  /* ---------- 5) انتقال سلس عند تبديل فلاتر البرمجيات (تعتيم متزامن) ---------- */
  const softwareGrid = document.getElementById('softwareGrid');
  if (softwareGrid) {
    // نعتمد على حدث مخصص يصدر من SoftwareCatalog عند تغيير الفلتر
    document.addEventListener('filter:changed', () => {
      softwareGrid.classList.add('is-filtering');
      setTimeout(() => softwareGrid.classList.remove('is-filtering'), 220);
    });
  }
});