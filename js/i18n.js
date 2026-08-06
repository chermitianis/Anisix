/* =========================================================
   SYSTÈME DE TRADUCTION — avec fallback de sécurité
   ========================================================= */

const translations = {
  fr: {
    nav_home: "Accueil",
    nav_divisions: "Divisions",
    nav_software: "Logiciels",
    nav_pricing: "Tarifs",
    nav_services: "Services",
    nav_portfolio: "Portfolio",
    nav_contact: "Contact",
    hero_eyebrow: "Disponible pour projets & intégrations SaaS",
    hero_title_1: "Du Schéma Électrique",
    hero_title_2: "au Code Source Industriel.",
    hero_lead: "Une plateforme technologique complète combinant génie électrique, informatique industrielle, intégration Odoo et logiciels SaaS.",
    hero_cta_1: "Explorer le Hub Logiciels",
    hero_cta_2: "Voir les Plans d'Abonnement",
    hero_stat1_label: "Domaines d'Expertise",
    hero_stat1_value: "Électricité · Odoo · PLC · HMI · Smart Home",
    hero_stat2_label: "Modèle de Distribution",
    hero_stat2_value: "Freemium + Licences Pro & Intégration B2B",
    divisions_title: "Divisions & Pôles d'Expertise",
    divisions_lead: "Solutions technologiques et logicielles organisées par secteur d'activité.",
    software_title: "Hub de Distribution des Logiciels",
    software_lead: "Applications Android, logiciels PC, modules Odoo, plateformes Web et simulateurs.",
    filter_all: "Tous",
    filter_android: "Apps Android",
    filter_desktop: "Logiciels PC",
    filter_saas: "Plateformes SaaS",
    filter_game: "Jeux & Simulation",
    loading_items: "Chargement en cours...",
    empty_state: "Aucun logiciel disponible pour le moment.",
    pricing_title: "Plans d'Abonnement & Licences",
    pricing_lead: "Choisissez le plan adapté pour télécharger des applications, obtenir des clés de licence.",
    services_title: "Services d'Ingénierie & Conseils",
    services_lead: "Solutions techniques de terrain et développements personnalisés.",
    portfolio_title: "Portfolio & Réalisations",
    portfolio_lead: "Aperçu de nos projets en automatisation, intégration Odoo et électricité.",
    contact_title: "Contactez-moi",
    contact_lead: "Décrivez brièvement votre projet ou votre besoin en abonnement.",
    form_name: "Nom complet",
    form_contact: "E-mail ou Téléphone",
    form_service: "Type de Service / Abonnement",
    form_details: "Détails de la demande",
    form_submit: "Envoyer la demande",
    contact_whatsapp: "Contacter via WhatsApp",
    contact_response_time: "Temps de réponse habituel",
    contact_response_value: "Sous quelques heures",
    contact_scope: "Périmètre de service",
    contact_scope_value: "À distance + Sur site",
    footer_project: "Projet",
    footer_project_value: "Plateforme d'Ingénierie Tech — Anis CH",
    footer_version: "Version",
    footer_date: "Date",
    footer_status: "Statut",
    footer_status_value: "En Production Live",
    footer_rights: "Tous droits réservés",
    footer_top: "Haut de page ↑",
    auth_login: "Connexion",
    auth_logout: "Déconnexion",
    auth_admin_panel: "Panneau d'administration",
    auth_login_title: "Connexion à la Plateforme",
    auth_email: "Adresse E-mail",
    auth_password: "Mot de passe",
    auth_confirm: "Confirmer le mot de passe",
    auth_login_btn: "Se connecter",
    auth_signup_btn: "S'inscrire",
    auth_switch_signup: "Pas encore de compte ? S'inscrire",
    auth_switch_login: "Déjà un compte ? Se connecter",
    auth_or_browse: "ou",
    auth_continue_guest: "Continuer en tant que visiteur",
    plan_free_btn: "Commencer Gratuitement",
    plan_pro_btn: "S'abonner à Pro Suite",
    plan_ent_btn: "Demander un Devis",
    div1_title: "⚡ Électricité Industrielle & Bâtiment",
    div1_desc: "Schémas électriques CAD, calculs de bilan de puissance, réseaux triphasés et protection industrielle.",
    div2_title: "🏭 Informatique Industrielle & Automatisme",
    div2_desc: "Programmation PLC, interfaces HMI, supervision SCADA et suivi d'atelier de production (MES).",
    div3_title: "🔄 Intégration Odoo & Connecteurs APPs",
    div3_desc: "Connecteurs et modules Odoo personnalisés synchronisés avec les équipements de production et machines CNC.",
    div4_title: "🏠 Bâtiment Intelligent & Domotique",
    div4_desc: "Protocoles KNX, configuration de caméras Yoosee, gestion d'énergie et automatisation des accès.",
    div5_title: "💻 Applications Bureau & Mobile",
    div5_desc: "Logiciels Windows/Linux et applications Android prêts au téléchargement avec licences d'activation automatisées.",
    div6_title: "🕹️ Simulation Interactive & Gaming",
    div6_desc: "Simulateurs 3D interactifs de lignes de production et environnements virtuels d'apprentissage technique.",
    service1_title: "Électricité & Domotique",
    service1_desc: "Conception et réalisation de réseaux électriques bâtiment et industriels.",
    service2_title: "Automatisme & Schématique CAD",
    service2_desc: "Conception de plans électriques aux normes CAD et programmation d'automates PLC.",
    service3_title: "Sécurité & Vidéosurveillance",
    service3_desc: "Installation de systèmes de surveillance Yoosee, alarmes et régulateurs de puissance.",
    service4_title: "Développement sur Mesure & Odoo",
    service4_desc: "Création de plateformes et intégration de logiciels personnalisés pour ateliers et usines."
  },
  ar: {
    nav_home: "الرئيسية",
    nav_divisions: "الأقسام",
    nav_software: "البرمجيات",
    nav_pricing: "الأسعار",
    nav_services: "الخدمات",
    nav_portfolio: "المعرض",
    nav_contact: "اتصل",
    hero_eyebrow: "متاح للمشاريع الجديدة",
    hero_title_1: "من المخطط الكهربائي",
    hero_title_2: "إلى الكود المصدري الصناعي",
    hero_lead: "منصة تقنية متكاملة تجمع بين الهندسة الكهربائية والمعلوماتية الصناعية وتكامل Odoo والبرمجيات الجاهزة للتحميل.",
    hero_cta_1: "استكشف البرمجيات",
    hero_cta_2: "اطلع على خطط الاشتراك",
    hero_stat1_label: "مجالات الخبرة",
    hero_stat1_value: "كهرباء · Odoo · PLC · HMI · منزل ذكي",
    hero_stat2_label: "نموذج التوزيع",
    hero_stat2_value: "Freemium + تراخيص Pro وتكامل B2B",
    divisions_title: "الأقسام ومجالات الخبرة",
    divisions_lead: "حلول تقنية وبرمجية منظمة حسب قطاع النشاط.",
    software_title: "مركز توزيع البرمجيات",
    software_lead: "تطبيقات أندرويد، برامج حاسوب، منصات ويب ومحاكيات.",
    filter_all: "الكل",
    filter_android: "تطبيقات أندرويد",
    filter_desktop: "برامج حاسوب",
    filter_saas: "منصات سحابية",
    filter_game: "ألعاب ومحاكاة",
    loading_items: "جاري التحميل...",
    empty_state: "لا توجد برمجيات متاحة حالياً.",
    pricing_title: "خطط الاشتراك والتراخيص",
    pricing_lead: "اختر الخطة المناسبة لتحميل التطبيقات والحصول على مفاتيح الترخيص.",
    services_title: "خدمات الهندسة والاستشارات",
    services_lead: "حلول تقنية ميدانية وتطويرات مخصصة.",
    portfolio_title: "المعرض والإنجازات",
    portfolio_lead: "نظرة عامة على مشاريعنا في الأتمتة وتكامل Odoo والكهرباء.",
    contact_title: "تواصل معي",
    contact_lead: "صف مشروعك أو حاجتك للاشتراك بإيجاز.",
    form_name: "الاسم الكامل",
    form_contact: "البريد الإلكتروني أو الهاتف",
    form_service: "نوع الخدمة / الاشتراك",
    form_details: "تفاصيل الطلب",
    form_submit: "إرسال الطلب",
    contact_whatsapp: "تواصل عبر واتساب",
    contact_response_time: "وقت الرد المعتاد",
    contact_response_value: "خلال ساعات قليلة",
    contact_scope: "نطاق الخدمة",
    contact_scope_value: "عن بعد + ميداني",
    footer_project: "المشروع",
    footer_project_value: "منصة الهندسة التقنية — أنيس CH",
    footer_version: "الإصدار",
    footer_date: "التاريخ",
    footer_status: "الحالة",
    footer_status_value: "قيد التشغيل",
    footer_rights: "جميع الحقوق محفوظة",
    footer_top: "أعلى الصفحة ↑",
    auth_login: "تسجيل الدخول",
    auth_logout: "تسجيل الخروج",
    auth_admin_panel: "لوحة التحكم",
    auth_login_title: "تسجيل الدخول إلى المنصة",
    auth_email: "البريد الإلكتروني",
    auth_password: "كلمة المرور",
    auth_confirm: "تأكيد كلمة المرور",
    auth_login_btn: "دخول",
    auth_signup_btn: "إنشاء حساب",
    auth_switch_signup: "ليس لديك حساب؟ سجل الآن",
    auth_switch_login: "لديك حساب؟ سجل دخولك",
    auth_or_browse: "أو",
    auth_continue_guest: "متابعة كزائر",
    plan_free_btn: "ابدأ مجاناً",
    plan_pro_btn: "اشترك في Pro Suite",
    plan_ent_btn: "اطلب عرض سعر",
    div1_title: "⚡ كهرباء صناعية والمباني",
    div1_desc: "مخططات كهربائية CAD، حسابات توازن القدرة، شبكات ثلاثية الطور وحماية صناعية.",
    div2_title: "🏭 معلوماتية صناعية وأتمتة",
    div2_desc: "برمجة PLC، واجهات HMI، أنظمة SCADA ومتابعة الإنتاج MES.",
    div3_title: "🔄 تكامل Odoo وموصلات التطبيقات",
    div3_desc: "موصلات ووحدات Odoo مخصصة متزامنة مع معدات الإنتاج وآلات CNC.",
    div4_title: "🏠 المباني الذكية والدوموتيك",
    div4_desc: "بروتوكولات KNX، تهيئة كاميرات Yoosee، إدارة الطاقة وأتمتة الدخول.",
    div5_title: "💻 تطبيقات المكتب والهواتف",
    div5_desc: "برامج ويندوز/لينكس وتطبيقات أندرويد جاهزة للتحميل مع تراخيص تفعيل آلية.",
    div6_title: "🕹️ محاكاة تفاعلية وألعاب",
    div6_desc: "محاكيات ثلاثية الأبعاد تفاعلية لخطوط الإنتاج وبيئات تعلم تقنية افتراضية.",
    service1_title: "كهرباء ودوموتيك",
    service1_desc: "تصميم وتنفيذ شبكات كهربائية للمباني والصناعة.",
    service2_title: "أتمتة ومخططات CAD",
    service2_desc: "تصميم مخططات كهربائية وفق معايير CAD وبرمجة PLC.",
    service3_title: "أنظمة أمن ومراقبة",
    service3_desc: "تركيب أنظمة مراقبة Yoosee، إنذار ومنظمات طاقة.",
    service4_title: "تطوير مخصص وOdoo",
    service4_desc: "إنشاء منصات وتكامل برمجيات مخصصة للمصانع والورش."
  },
  en: {
    nav_home: "Home",
    nav_divisions: "Divisions",
    nav_software: "Software",
    nav_pricing: "Pricing",
    nav_services: "Services",
    nav_portfolio: "Portfolio",
    nav_contact: "Contact",
    hero_eyebrow: "Available for new projects & SaaS integrations",
    hero_title_1: "From Electrical Blueprint",
    hero_title_2: "to Industrial Source Code.",
    hero_lead: "A complete technology platform combining electrical engineering, industrial computing, Odoo integration and ready-to-download SaaS software.",
    hero_cta_1: "Explore Software Hub",
    hero_cta_2: "View Subscription Plans",
    hero_stat1_label: "Areas of Expertise",
    hero_stat1_value: "Electrical · Odoo · PLC · HMI · Smart Home",
    hero_stat2_label: "Distribution Model",
    hero_stat2_value: "Freemium + Pro Licenses & B2B Integration",
    divisions_title: "Divisions & Areas of Expertise",
    divisions_lead: "Technological and software solutions organized by sector.",
    software_title: "Software Distribution Hub",
    software_lead: "Android apps, PC software, web platforms and simulators.",
    filter_all: "All",
    filter_android: "Android Apps",
    filter_desktop: "PC Software",
    filter_saas: "SaaS Platforms",
    filter_game: "Games & Simulation",
    loading_items: "Loading...",
    empty_state: "No software available at the moment.",
    pricing_title: "Subscription Plans & Licenses",
    pricing_lead: "Choose the right plan to download apps, get license keys and benefit from integration services.",
    services_title: "Engineering & Consulting Services",
    services_lead: "Field technical solutions and custom developments.",
    portfolio_title: "Portfolio & Achievements",
    portfolio_lead: "Overview of our projects in automation, Odoo integration and electrical engineering.",
    contact_title: "Get in Touch",
    contact_lead: "Briefly describe your project or subscription need.",
    form_name: "Full Name",
    form_contact: "Email or Phone",
    form_service: "Service Type / Subscription",
    form_details: "Request Details",
    form_submit: "Submit Request",
    contact_whatsapp: "Contact via WhatsApp",
    contact_response_time: "Typical response time",
    contact_response_value: "Within a few hours",
    contact_scope: "Service scope",
    contact_scope_value: "Remote + On-site",
    footer_project: "Project",
    footer_project_value: "Tech Engineering Platform — Anis CH",
    footer_version: "Version",
    footer_date: "Date",
    footer_status: "Status",
    footer_status_value: "Live",
    footer_rights: "All rights reserved",
    footer_top: "Back to top ↑",
    auth_login: "Login",
    auth_logout: "Logout",
    auth_admin_panel: "Admin Panel",
    auth_login_title: "Login to Platform",
    auth_email: "Email Address",
    auth_password: "Password",
    auth_confirm: "Confirm Password",
    auth_login_btn: "Login",
    auth_signup_btn: "Sign Up",
    auth_switch_signup: "Don't have an account? Sign up",
    auth_switch_login: "Already have an account? Login",
    auth_or_browse: "or",
    auth_continue_guest: "Continue as Guest",
    plan_free_btn: "Start Free",
    plan_pro_btn: "Subscribe to Pro Suite",
    plan_ent_btn: "Request Quote",
    div1_title: "⚡ Industrial & Building Electrical",
    div1_desc: "CAD electrical diagrams, power balance calculations, three-phase networks and industrial protection.",
    div2_title: "🏭 Industrial Computing & Automation",
    div2_desc: "PLC programming, HMI interfaces, SCADA supervision and production workshop monitoring (MES).",
    div3_title: "🔄 Odoo Integration & App Connectors",
    div3_desc: "Custom Odoo connectors and modules synchronized with production equipment and CNC machines.",
    div4_title: "🏠 Smart Building & Home Automation",
    div4_desc: "KNX protocols, Yoosee camera configuration, energy management and access automation.",
    div5_title: "💻 Desktop & Mobile Applications",
    div5_desc: "Windows/Linux software and Android apps ready for download with automated activation licenses.",
    div6_title: "🕹️ Interactive Simulation & Gaming",
    div6_desc: "Interactive 3D simulators of production lines and virtual technical learning environments.",
    service1_title: "Electrical & Home Automation",
    service1_desc: "Design and implementation of building and industrial electrical networks.",
    service2_title: "Automation & CAD Schematics",
    service2_desc: "Design of electrical plans to CAD standards and PLC programming.",
    service3_title: "Security & Surveillance Systems",
    service3_desc: "Installation of Yoosee surveillance systems, alarms and power regulators.",
    service4_title: "Custom Development & Odoo",
    service4_desc: "Creation of platforms and integration of custom software for workshops and factories."
  }
};

// Configuration de la langue
window.currentLang = localStorage.getItem('app_lang') || 'fr';

// Fonction de traduction avec fallback
window.t = function(key) {
  const dict = translations[window.currentLang] || translations.fr;
  const value = dict[key] || translations.fr[key] || key;
  // Log pour debug
  if (!dict[key] && !translations.fr[key]) {
    console.warn(`⚠️ Traduction manquante: "${key}" en ${window.currentLang}`);
  }
  return value;
};

// Mise à jour du DOM
window.updateTranslations = function() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const translated = window.t(key);
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      if (el.hasAttribute('placeholder')) el.placeholder = translated;
    } else {
      el.textContent = translated;
    }
  });
  document.documentElement.dir = window.currentLang === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = window.currentLang;
  
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('is-active', btn.dataset.lang === window.currentLang);
  });
};

// Changement de langue
window.setLanguage = function(lang) {
  if (!translations[lang]) return;
  window.currentLang = lang;
  localStorage.setItem('app_lang', lang);
  window.updateTranslations();
  document.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
};

// Initialisation au chargement
document.addEventListener('DOMContentLoaded', function() {
  console.log('🌐 i18n initialisé, langue:', window.currentLang);
  window.updateTranslations();
  
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      window.setLanguage(this.dataset.lang);
    });
  });
});