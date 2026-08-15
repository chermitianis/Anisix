/* =========================================================
   Système de traduction multilingue — fr / ar / en
   Fonctionne via l'attribut data-i18n sur les éléments HTML
   ========================================================= */

const TRANSLATIONS = {
  fr: {
    // Navigation
    nav_home: "Accueil",
    nav_divisions: "Divisions",
    nav_software: "Logiciels & Téléchargements",
    nav_pricing: "Tarifs & Abonnements",
    nav_services: "Services Ingénierie",
    nav_portfolio: "Portfolio",
    nav_contact: "Contact",
    logo_subtitle: "Ingénierie · Automatisme · Logiciels",

    // Auth
    auth_login: "Connexion",
    auth_logout: "Déconnexion",
    auth_account: "Mon compte",
    auth_admin_panel: "Panneau d'administration",
    auth_favorites: "Favoris",
    auth_login_title: "Connexion à la Plateforme",
    auth_signup_title: "Créer un compte",
    auth_email: "Adresse E-mail",
    auth_password: "Mot de passe",
    auth_confirm: "Confirmer le mot de passe",
    auth_login_btn: "Se connecter",
    auth_signup_btn: "Créer le compte",
    auth_switch_signup: "Pas encore de compte ? S'inscrire",
    auth_switch_login: "Déjà inscrit ? Se connecter",
    auth_continue_guest: "Continuer en tant que visiteur",
    auth_close: "Fermer",
    auth_error_generic: "Une erreur est survenue, vérifiez vos informations.",
    auth_error_mismatch: "Les mots de passe ne correspondent pas.",
    auth_success_signup: "Compte créé ! Vérifiez votre e-mail pour l'activer.",
    auth_perk_1: "Téléchargement des logiciels et connecteurs",
    auth_perk_2: "Obtention des clés de licences (Abonnés Pro)",
    auth_perk_3: "Suivi des abonnements et support technique",
    auth_or_browse: "ou",

    // Hero
    hero_eyebrow: "Disponible pour projets & intégrations SaaS",
    hero_title_1: "De l'Électricité Industrielle",
    hero_title_2: "à l'Intelligence Logicielle.",
    hero_lead: "Ingénierie, automatisme et distribution SaaS en un seul écosystème. <strong>Téléchargez, intégrez, industrialisez.</strong>",
    hero_cta_1: "Explorer le Hub Logiciels",
    hero_cta_2: "Voir les Plans d'Abonnement",

    // Divisions
    divisions_title: "Divisions & Pôles d'Expertise",
    divisions_lead: "Solutions technologiques et logicielles organisées par secteur d'activité.",
    div1_title: "⚡ Électricité Industrielle & Bâtiment",
    div1_desc: "Schémas électriques CAD, calculs de bilan de puissance, réseaux triphasés et protection industrielle.",
    div2_title: "🏭 Informatique Industrielle & Automatisme",
    div2_desc: "Programmation PLC, interfaces HMI, supervision SCADA et suivi d'atelier de production (MES).",
    div3_title: "🔄 Intégration Odoo & Connecteurs APPs",
    div3_desc: "Connecteurs et modules Odoo personnalisés synchronisés avec les équipements de production et machines CNC.",
    div4_title: "🏠 Bâtiment Intelligent & Domotique (Smart Home)",
    div4_desc: "Protocoles KNX, configuration de caméras Yoosee, gestion d'énergie et automatisation des accès.",
    div5_title: "💻 Applications Bureau & Mobile",
    div5_desc: "Logiciels Windows/Linux et applications Android prêts au téléchargement avec licences d'activation automatisées.",
    div6_title: "🕹️ Simulation Interactive & Gaming",
    div6_desc: "Simulateurs 3D interactifs de lignes de production et environnements virtuels d'apprentissage technique.",

    // Software
    software_title: "Hub de Distribution des Logiciels",
    software_lead: "Applications Android, logiciels PC, modules Odoo, plateformes Web et simulateurs.",
    filter_all: "Tous",
    filter_android: "Apps Android",
    filter_desktop: "Logiciels PC",
    filter_saas: "Plateformes SaaS",
    filter_game: "Jeux & Simulation",
    loading_items: "Chargement en cours...",
    empty_state: "Aucun élément disponible pour le moment.",
    btn_download: "Télécharger",
    btn_use_online: "Utiliser en ligne",
    btn_details: "Détails",
    favorite_add: "Ajouter aux favoris",
    favorite_remove: "Retirer des favoris",

    // Pricing
    pricing_title: "Plans d'Abonnement & Licences",
    pricing_lead: "Choisissez le plan adapté pour télécharger des applications, obtenir des clés de licence et bénéficier des services d'intégration.",
    plan_free_btn: "Commencer Gratuitement",
    plan_pro_btn: "S'abonner à Pro Suite",
    plan_ent_btn: "Demander un Devis",

    // Services
    services_title: "Services d'Ingénierie & Conseils",
    services_lead: "Solutions techniques de terrain et développements personnalisés.",
    service1_title: "Électricité & Domotique",
    service1_desc: "Conception et réalisation de réseaux électriques bâtiment et industriels.",
    service2_title: "Automatisme & Schématique CAD",
    service2_desc: "Conception de plans électriques aux normes CAD et programmation d'automates PLC.",
    service3_title: "Sécurité & Vidéosurveillance",
    service3_desc: "Installation de systèmes de surveillance Yoosee, alarmes et régulateurs de puissance.",
    service4_title: "Développement sur Mesure & Odoo",
    service4_desc: "Création de plateformes et intégration de logiciels personnalisés pour ateliers et usines.",

    // Portfolio
    portfolio_title: "Portfolio & Réalisations",
    portfolio_lead: "Aperçu de nos projets en automatisation, intégration Odoo et électricité.",

    // Contact
    contact_title: "Contactez-moi",
    contact_lead: "Décrivez brièvement votre projet ou votre besoin en abonnement.",
    form_name: "Nom complet",
    form_contact: "E-mail ou Téléphone",
    form_contact_ph: "exemple@mail.com ou +216 00 000 000",
    form_service: "Type de Service / Abonnement",
    form_service_ph: "Sélectionnez une option",
    form_service_subscription: "Abonnement Pro Suite / Licences Apps",
    form_service_odoo: "Intégration Odoo & Logiciels d'Usine",
    form_service_android: "Application Android sur Mesure",
    form_service_desktop: "Logiciel PC sur Mesure",
    form_service_electrical: "Étude Électrique / Automatisme",
    form_service_website: "Plateforme Web Dédiée",
    form_service_other: "Autre demande",
    form_details: "Détails de la demande",
    form_details_ph: "Décrivez votre projet en quelques lignes...",
    form_submit: "Envoyer la demande",
    form_success: "Votre message a été reçu, je vous recontacte bientôt.",
    form_error_generic: "Une erreur est survenue, réessayez.",
    contact_whatsapp: "Contacter via WhatsApp",
    contact_response_time: "Temps de réponse habituel",
    contact_response_value: "Sous quelques heures",
    contact_scope: "Périmètre de service",
    contact_scope_value: "À distance + Sur site",

    // Footer
    footer_project: "Projet",
    footer_project_value: "Plateforme d'Ingénierie Tech — Anis CH",
    footer_version: "Version",
    footer_date: "Date",
    footer_status: "Statut",
    footer_status_value: "En Production Live",
    footer_rights: "Tous droits réservés",
    footer_top: "Haut de page ↑"
  },

  ar: {
    // Navigation
    nav_home: "الرئيسية",
    nav_divisions: "الأقسام",
    nav_software: "البرمجيات والتحميلات",
    nav_pricing: "الأسعار والاشتراكات",
    nav_services: "الخدمات الهندسية",
    nav_portfolio: "معرض الأعمال",
    nav_contact: "تواصل معي",
    logo_subtitle: "هندسة · أتمتة · برمجيات",

    // Auth
    auth_login: "تسجيل الدخول",
    auth_logout: "تسجيل الخروج",
    auth_account: "حسابي",
    auth_admin_panel: "لوحة التحكم",
    auth_favorites: "المفضلة",
    auth_login_title: "تسجيل الدخول إلى المنصة",
    auth_signup_title: "إنشاء حساب جديد",
    auth_email: "البريد الإلكتروني",
    auth_password: "كلمة المرور",
    auth_confirm: "تأكيد كلمة المرور",
    auth_login_btn: "دخول",
    auth_signup_btn: "إنشاء الحساب",
    auth_switch_signup: "ليس لديك حساب؟ أنشئ واحداً",
    auth_switch_login: "لديك حساب؟ سجل الدخول",
    auth_continue_guest: "متابعة كزائر",
    auth_close: "إغلاق",
    auth_error_generic: "حدث خطأ، تحقق من بياناتك وحاول مجدداً.",
    auth_error_mismatch: "كلمتا المرور غير متطابقتين.",
    auth_success_signup: "تم إنشاء الحساب! تحقق من بريدك لتفعيله.",
    auth_perk_1: "تحميل البرمجيات والموصلات",
    auth_perk_2: "الحصول على مفاتيح الترخيص (للمشتركين Pro)",
    auth_perk_3: "متابعة الاشتراكات والدعم الفني",
    auth_or_browse: "أو",

    // Hero
    hero_eyebrow: "متاح للمشاريع والتكاملات SaaS",
    hero_title_1: "من الكهرباء الصناعية",
    hero_title_2: "إلى الذكاء البرمجي.",
    hero_lead: "الهندسة، الأتمتة وتوزيع SaaS في نظام بيئي واحد. <strong>حمّل، دمج، صنّع.</strong>",
    hero_cta_1: "استكشف مركز البرمجيات",
    hero_cta_2: "اطلع على خطط الاشتراك",

    // Divisions
    divisions_title: "الأقسام ومجالات الخبرة",
    divisions_lead: "حلول تقنية وبرمجية منظمة حسب قطاع النشاط.",
    div1_title: "⚡ الكهرباء الصناعية والمباني",
    div1_desc: "المخططات الكهربائية CAD، حسابات توازن القدرة، الشبكات ثلاثية الطور والحماية الصناعية.",
    div2_title: "🏭 المعلوماتية الصناعية والأتمتة",
    div2_desc: "برمجة PLC، واجهات HMI، مراقبة SCADA وتتبع ورشة الإنتاج (MES).",
    div3_title: "🔄 تكامل Odoo وموصلات التطبيقات",
    div3_desc: "موصلات ووحدات Odoo مخصصة متزامنة مع معدات الإنتاج وآلات CNC.",
    div4_title: "🏠 المباني الذكية والدوموتيك",
    div4_desc: "بروتوكولات KNX، تكوين كاميرات Yoosee، إدارة الطاقة وأتمتة الوصول.",
    div5_title: "💻 تطبيقات المكتب والهواتف",
    div5_desc: "برامج Windows/Linux وتطبيقات Android جاهزة للتحميل مع تراخيص تفعيل آلية.",
    div6_title: "🕹️ المحاكاة التفاعلية والألعاب",
    div6_desc: "محاكيات ثلاثية الأبعاد تفاعلية لخطوط الإنتاج وبيئات تعلم تقنية افتراضية.",

    // Software
    software_title: "مركز توزيع البرمجيات",
    software_lead: "تطبيقات Android، برامج حاسوب، وحدات Odoo، منصات ويب ومحاكيات.",
    filter_all: "الكل",
    filter_android: "تطبيقات أندرويد",
    filter_desktop: "برامج حاسوب",
    filter_saas: "منصات SaaS",
    filter_game: "ألعاب ومحاكاة",
    loading_items: "جارٍ التحميل...",
    empty_state: "لا توجد عناصر متاحة حالياً.",
    btn_download: "تحميل",
    btn_use_online: "استخدام أونلاين",
    btn_details: "التفاصيل",
    favorite_add: "أضف للمفضلة",
    favorite_remove: "إزالة من المفضلة",

    // Pricing
    pricing_title: "خطط الاشتراك والتراخيص",
    pricing_lead: "اختر الخطة المناسبة لتحميل التطبيقات، الحصول على مفاتيح الترخيص والاستفادة من خدمات التكامل.",
    plan_free_btn: "ابدأ مجاناً",
    plan_pro_btn: "اشترك في Pro Suite",
    plan_ent_btn: "اطلب عرض سعر",

    // Services
    services_title: "الخدمات الهندسية والاستشارات",
    services_lead: "حلول تقنية ميدانية وتطويرات مخصصة.",
    service1_title: "الكهرباء والدوموتيك",
    service1_desc: "تصميم وتنفيذ الشبكات الكهربائية للمباني والمنشآت الصناعية.",
    service2_title: "الأتمتة والمخططات CAD",
    service2_desc: "تصميم المخططات الكهربائية وفق معايير CAD وبرمجة وحدات PLC.",
    service3_title: "الأمن والمراقبة بالفيديو",
    service3_desc: "تركيب أنظمة المراقبة Yoosee، الإنذارات ومنظمات الطاقة.",
    service4_title: "التطوير المخصص و Odoo",
    service4_desc: "إنشاء منصات وتكامل برمجيات مخصصة للورش والمصانع.",

    // Portfolio
    portfolio_title: "معرض الأعمال والإنجازات",
    portfolio_lead: "نظرة على مشاريعنا في الأتمتة وتكامل Odoo والكهرباء.",

    // Contact
    contact_title: "تواصل معي",
    contact_lead: "صِف مشروعك أو حاجتك للاشتراك بإيجاز.",
    form_name: "الاسم الكامل",
    form_contact: "البريد الإلكتروني أو رقم الهاتف",
    form_contact_ph: "exemple@mail.com أو +216 00 000 000",
    form_service: "نوع الخدمة أو الاشتراك",
    form_service_ph: "اختر خياراً",
    form_service_subscription: "اشتراك Pro Suite / تراخيص التطبيقات",
    form_service_odoo: "تكامل Odoo وبرامج المصانع",
    form_service_android: "تطبيق Android مخصص",
    form_service_desktop: "برنامج حاسوب مخصص",
    form_service_electrical: "دراسة كهربائية / أتمتة",
    form_service_website: "منصة ويب مخصصة",
    form_service_other: "طلب آخر",
    form_details: "تفاصيل الطلب",
    form_details_ph: "صِف مشروعك في بضعة أسطر...",
    form_submit: "إرسال الطلب",
    form_success: "تم استلام رسالتك، سأتصل بك قريباً.",
    form_error_generic: "حدث خطأ أثناء الإرسال، حاول مجدداً.",
    contact_whatsapp: "تواصل عبر واتساب",
    contact_response_time: "وقت الرد المعتاد",
    contact_response_value: "خلال ساعات قليلة",
    contact_scope: "نطاق الخدمة",
    contact_scope_value: "عن بُعد + ميداني",

    // Footer
    footer_project: "المشروع",
    footer_project_value: "منصة الهندسة التقنية — أنيس CH",
    footer_version: "الإصدار",
    footer_date: "التاريخ",
    footer_status: "الحالة",
    footer_status_value: "قيد التشغيل المباشر",
    footer_rights: "جميع الحقوق محفوظة",
    footer_top: "أعلى الصفحة ↑"
  },

  en: {
    // Navigation
    nav_home: "Home",
    nav_divisions: "Divisions",
    nav_software: "Software & Downloads",
    nav_pricing: "Pricing & Subscriptions",
    nav_services: "Engineering Services",
    nav_portfolio: "Portfolio",
    nav_contact: "Contact",
    logo_subtitle: "Engineering · Automation · Software",

    // Auth
    auth_login: "Log in",
    auth_logout: "Log out",
    auth_account: "My Account",
    auth_admin_panel: "Admin Panel",
    auth_favorites: "Favorites",
    auth_login_title: "Platform Login",
    auth_signup_title: "Create an Account",
    auth_email: "Email Address",
    auth_password: "Password",
    auth_confirm: "Confirm Password",
    auth_login_btn: "Log in",
    auth_signup_btn: "Create Account",
    auth_switch_signup: "No account yet? Sign up",
    auth_switch_login: "Already have an account? Log in",
    auth_continue_guest: "Continue as Guest",
    auth_close: "Close",
    auth_error_generic: "Something went wrong, check your details.",
    auth_error_mismatch: "Passwords don't match.",
    auth_success_signup: "Account created! Check your email to activate it.",
    auth_perk_1: "Download software and connectors",
    auth_perk_2: "Get license keys (Pro Subscribers)",
    auth_perk_3: "Subscription tracking and technical support",
    auth_or_browse: "or",

    // Hero
    hero_eyebrow: "Available for projects & SaaS integrations",
    hero_title_1: "From Industrial Electricity",
    hero_title_2: "to Software Intelligence.",
    hero_lead: "Engineering, automation and SaaS distribution in one ecosystem. <strong>Download, integrate, industrialize.</strong>",
    hero_cta_1: "Explore Software Hub",
    hero_cta_2: "View Subscription Plans",

    // Divisions
    divisions_title: "Divisions & Areas of Expertise",
    divisions_lead: "Technology and software solutions organized by business sector.",
    div1_title: "⚡ Industrial & Building Electricity",
    div1_desc: "CAD electrical schematics, power balance calculations, three-phase networks and industrial protection.",
    div2_title: "🏭 Industrial IT & Automation",
    div2_desc: "PLC programming, HMI interfaces, SCADA supervision and production workshop tracking (MES).",
    div3_title: "🔄 Odoo Integration & App Connectors",
    div3_desc: "Custom Odoo connectors and modules synchronized with production equipment and CNC machines.",
    div4_title: "🏠 Smart Building & Home Automation",
    div4_desc: "KNX protocols, Yoosee camera configuration, energy management and access automation.",
    div5_title: "💻 Desktop & Mobile Applications",
    div5_desc: "Windows/Linux software and Android applications ready for download with automated activation licenses.",
    div6_title: "🕹️ Interactive Simulation & Gaming",
    div6_desc: "3D interactive simulators of production lines and virtual technical learning environments.",

    // Software
    software_title: "Software Distribution Hub",
    software_lead: "Android apps, PC software, Odoo modules, Web platforms and simulators.",
    filter_all: "All",
    filter_android: "Android Apps",
    filter_desktop: "Desktop Software",
    filter_saas: "SaaS Platforms",
    filter_game: "Games & Simulation",
    loading_items: "Loading...",
    empty_state: "No items available at the moment.",
    btn_download: "Download",
    btn_use_online: "Use Online",
    btn_details: "Details",
    favorite_add: "Add to favorites",
    favorite_remove: "Remove from favorites",

    // Pricing
    pricing_title: "Subscription Plans & Licenses",
    pricing_lead: "Choose the right plan to download apps, get license keys and benefit from integration services.",
    plan_free_btn: "Start Free",
    plan_pro_btn: "Subscribe to Pro Suite",
    plan_ent_btn: "Request a Quote",

    // Services
    services_title: "Engineering & Consulting Services",
    services_lead: "On-site technical solutions and custom developments.",
    service1_title: "Electrical & Home Automation",
    service1_desc: "Design and implementation of electrical networks for buildings and industrial facilities.",
    service2_title: "Automation & CAD Schematics",
    service2_desc: "Electrical plan design to CAD standards and PLC programming.",
    service3_title: "Security & Video Surveillance",
    service3_desc: "Installation of Yoosee surveillance systems, alarms and power regulators.",
    service4_title: "Custom Development & Odoo",
    service4_desc: "Creation of platforms and integration of custom software for workshops and factories.",

    // Portfolio
    portfolio_title: "Portfolio & Achievements",
    portfolio_lead: "Overview of our projects in automation, Odoo integration and electrical.",

    // Contact
    contact_title: "Get in Touch",
    contact_lead: "Briefly describe your project or subscription need.",
    form_name: "Full name",
    form_contact: "Email or Phone",
    form_contact_ph: "example@mail.com or +216 00 000 000",
    form_service: "Service Type / Subscription",
    form_service_ph: "Select an option",
    form_service_subscription: "Pro Suite Subscription / App Licenses",
    form_service_odoo: "Odoo Integration & Factory Software",
    form_service_android: "Custom Android App",
    form_service_desktop: "Custom PC Software",
    form_service_electrical: "Electrical Study / Automation",
    form_service_website: "Dedicated Web Platform",
    form_service_other: "Other Request",
    form_details: "Request Details",
    form_details_ph: "Describe your project in a few lines...",
    form_submit: "Send Request",
    form_success: "Your message was received, I'll get back to you soon.",
    form_error_generic: "An error occurred, please try again.",
    contact_whatsapp: "Contact via WhatsApp",
    contact_response_time: "Usual response time",
    contact_response_value: "Within a few hours",
    contact_scope: "Service scope",
    contact_scope_value: "Remote + On-site",

    // Footer
    footer_project: "Project",
    footer_project_value: "Tech Engineering Platform — Anis CH",
    footer_version: "Version",
    footer_date: "Date",
    footer_status: "Status",
    footer_status_value: "Live in Production",
    footer_rights: "All rights reserved",
    footer_top: "Top of page ↑"
  }
};

const LANG_META = {
  fr: { dir: 'ltr', label: 'Français', short: 'FR' },
  ar: { dir: 'rtl', label: 'العربية', short: 'AR' },
  en: { dir: 'ltr', label: 'English', short: 'EN' },
};

window.i18n = {
  current: localStorage.getItem('site_lang') || (window.APP_CONFIG && window.APP_CONFIG.DEFAULT_LANG) || 'fr',

  t(key) {
    return (TRANSLATIONS[this.current] && TRANSLATIONS[this.current][key]) || TRANSLATIONS.fr[key] || key;
  },

  apply() {
    const lang = this.current;
    const meta = LANG_META[lang];
    document.documentElement.lang = lang;
    document.documentElement.dir = meta.dir;

    document.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = this.t(el.getAttribute('data-i18n'));
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(el => {
      el.setAttribute('placeholder', this.t(el.getAttribute('data-i18n-ph')));
    });
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      el.innerHTML = this.t(el.getAttribute('data-i18n-html'));
    });

    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.lang === lang);
    });

    document.dispatchEvent(new CustomEvent('i18n:changed', { detail: { lang } }));
  },

  setLang(lang) {
    if (!TRANSLATIONS[lang]) return;
    this.current = lang;
    localStorage.setItem('site_lang', lang);
    this.apply();
  }
};

document.addEventListener('DOMContentLoaded', () => {
  window.i18n.apply();

  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => window.i18n.setLang(btn.dataset.lang));
  });
});