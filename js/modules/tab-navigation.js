/* =========================================================
   tab-navigation.js — إدارة وضع التبويب معتمد على CSS فقط
   ========================================================= */

export function initTabNavigation() {
  const sections = document.querySelectorAll('main section[id], .hero[id]');
  const navLinks = document.querySelectorAll('.nav-link');
  const mainNav = document.getElementById('mainNav');
  const navToggle = document.getElementById('navToggle');
  const header = document.querySelector('.site-header');

  let tabMode = false;
  let currentTabId = null;
  let isTransitioning = false;

  // استعادة التبويب من localStorage
  const savedTab = localStorage.getItem('activeTab');
  if (savedTab && document.getElementById(savedTab)) {
    setTimeout(() => showTab(savedTab, false), 200);
  }

  function getHeaderHeight() {
    return header ? header.getBoundingClientRect().height : 65;
  }

  function highlightNav() {
    if (tabMode || isTransitioning) return;
    let currentId = '';
    const scrollPos = window.scrollY + getHeaderHeight() + 20;
    sections.forEach(section => {
      if (scrollPos >= section.offsetTop) currentId = section.id;
    });
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      link.classList.toggle('is-active', href === `#${currentId}`);
    });
  }

  function showTab(sectionId, animate = true) {
    if (isTransitioning) return;
    isTransitioning = true;

    // إخفاء جميع الأقسام
    sections.forEach(s => {
      s.style.display = 'none';
    });

    // إظهار القسم المستهدف
    const target = document.getElementById(sectionId);
    if (target) {
      target.style.display = 'block';
    }

    // تفعيل وضع التبويب
    document.body.classList.add('tab-mode');
    tabMode = true;
    currentTabId = sectionId;
    localStorage.setItem('activeTab', sectionId);

    // تحديث الروابط النشطة
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      link.classList.toggle('is-active', href === `#${sectionId}`);
    });

    // التمرير إلى أعلى القسم
    const headerHeight = getHeaderHeight();
    window.scrollTo({
      top: headerHeight,
      behavior: animate ? 'smooth' : 'instant'
    });

    setTimeout(() => {
      isTransitioning = false;
    }, 300);
  }

  function showAllSections() {
    if (isTransitioning) return;
    isTransitioning = true;

    sections.forEach(s => {
      s.style.display = '';
    });

    document.body.classList.remove('tab-mode');
    tabMode = false;
    currentTabId = null;
    localStorage.removeItem('activeTab');

    highlightNav();
    window.scrollTo({ top: 0, behavior: 'smooth' });

    setTimeout(() => {
      isTransitioning = false;
    }, 300);
  }

  // ربط الأحداث
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const href = link.getAttribute('href');
      const targetId = href.substring(1);

      if (mainNav && mainNav.classList.contains('is-open')) {
        mainNav.classList.remove('is-open');
        if (navToggle) {
          navToggle.classList.remove('is-open');
          navToggle.setAttribute('aria-expanded', 'false');
        }
      }

      if (targetId === 'hero' || targetId === 'top' || targetId === '') {
        showAllSections();
      } else {
        showTab(targetId);
      }
    });
  });

  window.addEventListener('scroll', highlightNav, { passive: true });
  window.addEventListener('resize', () => {
    if (tabMode && currentTabId) {
      // إعادة ضبط التمرير إذا تغير ارتفاع الهيدر
      const headerHeight = getHeaderHeight();
      if (window.scrollY < headerHeight) {
        window.scrollTo({ top: headerHeight, behavior: 'instant' });
      }
    }
  });

  highlightNav();

  // استعادة من URL
  const hash = window.location.hash;
  if (hash) {
    const id = hash.substring(1);
    if (document.getElementById(id) && id !== 'hero' && id !== 'top') {
      setTimeout(() => showTab(id, false), 300);
    }
  }

  return { showTab, showAllSections, tabMode, currentTabId };
}