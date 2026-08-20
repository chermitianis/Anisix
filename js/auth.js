/* =========================================================
   auth.js — Gestion sécurisée de l'authentification Supabase
   Version sans import/export (compatible index.html et admin.html)

   🔒 Sécurité renforcée :
   - Politique de mot de passe forte (8+ car., lettre + chiffre)
   - Récupération de mot de passe (mot de passe oublié)
   - Protection anti double-soumission (spam / brute-force côté client)
   - Messages d'erreur génériques (ne révèle jamais si un e-mail existe)
   - Nettoyage systématique des entrées avant envoi
   - Déconnexion globale (toutes les sessions) disponible
   ========================================================= */

(function () {
  console.log('🔐 Chargement de auth.js (version durcie)...');

  let currentSession = null;
  let currentUser = null;
  let isAdminValue = false;
  let currentPlan = 'free';

  const authModal = document.getElementById('authModal');
  const authModalTitle = document.getElementById('authModalTitle');
  const authNameRow = document.getElementById('authNameRow');
  const authFullName = document.getElementById('authFullName');
  const authEmailInput = document.getElementById('authEmail');
  const authPasswordInput = document.getElementById('authPassword');
  const authPasswordHint = document.getElementById('authPasswordHint');
  const authConfirmRow = document.getElementById('authConfirmRow');
  const authConfirmPassword = document.getElementById('authConfirmPassword');
  const authSubmitBtn = document.getElementById('authSubmitBtn');
  const authSwitchBtn = document.getElementById('authSwitchBtn');
  const authGuestBtn = document.getElementById('authGuestBtn');
  const authError = document.getElementById('authError');
  const authSuccess = document.getElementById('authSuccess');
  const authModalClose = document.getElementById('authModalClose');
  const authForgotBtn = document.getElementById('authForgotBtn');

  const resetModal = document.getElementById('resetPasswordModal');
  const resetForm = document.getElementById('resetPasswordForm');
  const resetError = document.getElementById('resetPasswordError');

  let isSignUpMode = false;
  let isProcessingOAuth = false;
  let isSubmitting = false;

  // === أدوات مساعدة أمنية ===

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function isStrongPassword(pwd) {
    return typeof pwd === 'string' && pwd.length >= 8 && /[A-Za-z]/.test(pwd) && /[0-9]/.test(pwd);
  }

  function sanitizeInput(str) {
    return (str || '').toString().trim().slice(0, 255);
  }

  function setError(msg) {
    if (authError) authError.textContent = msg || '';
    if (authSuccess) authSuccess.textContent = '';
  }
  function setSuccess(msg) {
    if (authSuccess) authSuccess.textContent = msg || '';
    if (authError) authError.textContent = '';
  }

  function genericAuthError(err) {
    const raw = (err && err.message) ? err.message.toLowerCase() : '';
    if (raw.includes('invalid login credentials')) {
      return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
    }
    if (raw.includes('already registered') || raw.includes('user already exists')) {
      return 'تعذّر إتمام العملية. إذا كان لديك حساب بالفعل، جرّب تسجيل الدخول.';
    }
    if (raw.includes('rate limit') || raw.includes('too many')) {
      return 'محاولات كثيرة جدًا. الرجاء الانتظار قليلًا ثم إعادة المحاولة.';
    }
    if (raw.includes('email not confirmed')) {
      return 'الرجاء تفعيل بريدك الإلكتروني عبر الرابط المُرسَل إليك أولًا.';
    }
    return 'تعذّر إتمام العملية. تحقّق من المعطيات وحاول مجددًا.';
  }

  // === Fonctions de base ===

  function closeAuthModal() {
    if (authModal) { authModal.hidden = true; authModal.style.display = 'none'; }
    setError('');
  }
  function openAuthModal() {
    if (authModal) { authModal.hidden = false; authModal.style.display = 'flex'; }
  }
  function closeResetModal() {
    if (resetModal) { resetModal.hidden = true; resetModal.style.display = 'none'; }
    if (resetError) resetError.textContent = '';
  }
  function openResetModal() {
    if (resetModal) { resetModal.hidden = false; resetModal.style.display = 'flex'; }
  }

  function updateUIForUser(user) {
    const guestState = document.getElementById('authGuestState');
    const userState = document.getElementById('authUserState');
    const userEmail = document.getElementById('authUserEmail');
    const adminLink = document.getElementById('authAdminLink');

    if (user) {
      if (guestState) guestState.hidden = true;
      if (userState) userState.hidden = false;
      if (userEmail) userEmail.textContent = user.email;
      if (adminLink) adminLink.hidden = !isAdminValue;
    } else {
      if (guestState) guestState.hidden = false;
      if (userState) userState.hidden = true;
    }
  }

  // === Vérification de l'état ===

  async function checkUserState() {
    if (!window.supabaseClient) { updateUIForUser(null); return; }

    try {
      const { data: { session } } = await window.supabaseClient.auth.getSession();
      if (session && session.user) {
        currentSession = session;
        currentUser = session.user;

        const { data: profile } = await window.supabaseClient
          .from('profiles')
          .select('is_admin, subscription_plan')
          .eq('id', session.user.id)
          .maybeSingle();

        isAdminValue = profile ? !!profile.is_admin : false;
        currentPlan = profile ? (profile.subscription_plan || 'free') : 'free';

        updateUIForUser(session.user);
        closeAuthModal();
        document.dispatchEvent(new CustomEvent('auth:changed', {
          detail: { user: session.user, isAdmin: isAdminValue, plan: currentPlan }
        }));
        return;
      }
    } catch (e) {
      console.warn('⚠️ Supabase non disponible, mode invité activé.');
    }

    currentSession = null;
    currentUser = null;
    isAdminValue = false;
    currentPlan = 'free';
    updateUIForUser(null);
    document.dispatchEvent(new CustomEvent('auth:changed', { detail: { user: null, isAdmin: false, plan: 'free' } }));
  }

  // === Fonctions d'authentification ===

  async function signIn(email, password) {
    if (!window.supabaseClient) throw new Error('Supabase non initialisé.');
    const { data, error } = await window.supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async function signUp(email, password, fullName) {
    if (!window.supabaseClient) throw new Error('Supabase non initialisé.');
    const { data, error } = await window.supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName || '' },
        emailRedirectTo: window.location.origin + window.location.pathname,
      },
    });
    if (error) throw error;
    return data;
  }

  async function signOut() {
    if (!window.supabaseClient) return;
    await window.supabaseClient.auth.signOut();
    currentSession = null;
    currentUser = null;
    isAdminValue = false;
    currentPlan = 'free';
    updateUIForUser(null);
    document.dispatchEvent(new CustomEvent('auth:changed', { detail: { user: null, isAdmin: false, plan: 'free' } }));
  }

  async function sendPasswordReset(email) {
    if (!window.supabaseClient) throw new Error('Supabase non initialisé.');
    const { error } = await window.supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + window.location.pathname + '#reset-password',
    });
    if (error) throw error;
  }

  async function updatePassword(newPassword) {
    if (!window.supabaseClient) throw new Error('Supabase non initialisé.');
    
    const { data: { session } } = await window.supabaseClient.auth.getSession();
    if (!session) {
      throw new Error('جلسة إعادة التعيين منتهية أو غير صالحة. يرجى طلب رابط جديد عبر "نسيت كلمة المرور".');
    }

    const { data, error } = await window.supabaseClient.auth.updateUser({ password: newPassword });
    if (error) throw error;
    return data;
  }

  // === OAuth ===

  async function signInWithProvider(provider) {
    if (!window.supabaseClient) throw new Error('Supabase non initialisé.');
    if (isProcessingOAuth) return;
    isProcessingOAuth = true;
    try {
      const { error } = await window.supabaseClient.auth.signInWithOAuth({
        provider,
        options: { redirectTo: window.location.origin + window.location.pathname },
      });
      if (error) throw error;
    } catch (err) {
      isProcessingOAuth = false;
      throw err;
    }
  }

  // === API publique الجسرة بالتوافق المزدوج ===

  const authApi = function () {
    return isAdminValue;
  };

  Object.defineProperties(authApi, {
    session: { get: function () { return currentSession; } },
    user: { get: function () { return currentUser; } },
    isAdmin: { get: function () { return isAdminValue; } },
    plan: { get: function () { return currentPlan; } },
    isLoggedIn: { value: function () { return !!currentUser; } },
    init: { value: checkUserState },
    signIn: { value: signIn },
    signUp: { value: signUp },
    signOut: { value: signOut },
    signInWithProvider: { value: signInWithProvider },
    sendPasswordReset: { value: sendPasswordReset },
    updatePassword: { value: updatePassword },
    openModal: { value: openAuthModal },
    closeModal: { value: closeAuthModal }
  });

  window.Auth = authApi;

  console.log('✅ Auth initialisé avec succès (mode sécurisé)');

  // === Écouteurs d'événements ===

  document.addEventListener('DOMContentLoaded', async () => {
    document.querySelectorAll('[data-open-auth]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.Auth.isLoggedIn()) return;
        openAuthModal();
      });
    });

    if (authModalClose) authModalClose.addEventListener('click', closeAuthModal);
    const backdrop = document.getElementById('authModalBackdrop');
    if (backdrop) backdrop.addEventListener('click', closeAuthModal);

    if (resetModal) {
      const resetClose = document.getElementById('resetPasswordClose');
      const resetBackdrop = document.getElementById('resetPasswordBackdrop');
      if (resetClose) resetClose.addEventListener('click', closeResetModal);
      if (resetBackdrop) resetBackdrop.addEventListener('click', closeResetModal);
    }

    if (authGuestBtn) {
      authGuestBtn.addEventListener('click', (e) => {
        e.preventDefault();
        closeAuthModal();
        updateUIForUser(null);
      });
    }

    if (authSwitchBtn) {
      authSwitchBtn.addEventListener('click', () => {
        isSignUpMode = !isSignUpMode;
        const t = window.i18n ? window.i18n.t.bind(window.i18n) : (k) => k;

        if (isSignUpMode) {
          if (authModalTitle) authModalTitle.textContent = t('auth_signup_title') || 'Créer un compte';
          if (authNameRow) authNameRow.hidden = false;
          if (authConfirmRow) authConfirmRow.hidden = false;
          if (authPasswordHint) authPasswordHint.hidden = false;
          if (authSubmitBtn) authSubmitBtn.textContent = t('auth_signup_btn') || "S'inscrire";
          authSwitchBtn.textContent = t('auth_switch_login') || 'Déjà un compte ? Se connecter';
          if (authForgotBtn) authForgotBtn.hidden = true;
        } else {
          if (authModalTitle) authModalTitle.textContent = t('auth_login_title') || 'Connexion';
          if (authNameRow) authNameRow.hidden = true;
          if (authConfirmRow) authConfirmRow.hidden = true;
          if (authPasswordHint) authPasswordHint.hidden = true;
          if (authSubmitBtn) authSubmitBtn.textContent = t('auth_login_btn') || 'Se connecter';
          authSwitchBtn.textContent = t('auth_switch_signup') || "Pas encore de compte ? S'inscrire";
          if (authForgotBtn) authForgotBtn.hidden = false;
        }
        setError('');
      });
    }

    // === "Mot de passe oublié" ===
    if (authForgotBtn) {
      authForgotBtn.addEventListener('click', async () => {
        const email = sanitizeInput(authEmailInput ? authEmailInput.value : '');
        if (!EMAIL_RE.test(email)) {
          setError('أدخل بريدك الإلكتروني في الحقل أعلاه أولًا، ثم اضغط "نسيت كلمة المرور".');
          return;
        }
        authForgotBtn.disabled = true;
        try {
          await sendPasswordReset(email);
          setSuccess('✅ إذا كان هذا البريد مسجّلاً لدينا، ستصلك رسالة لإعادة تعيين كلمة المرور خلال دقائق.');
        } catch (err) {
          console.error(err);
          setSuccess('✅ إذا كان هذا البريد مسجّلاً لدينا، ستصلك رسالة لإعادة تعيين كلمة المرور خلال دقائق.');
        } finally {
          authForgotBtn.disabled = false;
        }
      });
    }

    // === Formulaire principal (connexion / inscription) ===
    const authForm = document.getElementById('authForm');
    if (authForm) {
      authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        setError('');
        if (isSubmitting) return;

        const email = sanitizeInput(authEmailInput.value);
        const password = authPasswordInput.value;
        const fullName = authFullName ? sanitizeInput(authFullName.value) : '';

        if (!EMAIL_RE.test(email)) { setError('البريد الإلكتروني غير صالح.'); return; }
        if (!password) { setError('الرجاء إدخال كلمة المرور.'); return; }

        if (isSignUpMode) {
          if (!isStrongPassword(password)) {
            setError('كلمة المرور ضعيفة: يجب أن تحتوي على 8 خانات على الأقل مع حرف ورقم.');
            return;
          }
          const confirm = authConfirmPassword.value;
          if (password !== confirm) { setError('كلمتا المرور غير متطابقتين.'); return; }
        }

        isSubmitting = true;
        const originalText = authSubmitBtn ? authSubmitBtn.textContent : '';
        if (authSubmitBtn) { authSubmitBtn.disabled = true; authSubmitBtn.textContent = '...'; }

        try {
          if (isSignUpMode) {
            await signUp(email, password, fullName);
            setSuccess('✅ تم إنشاء الحساب! تحقق من بريدك الإلكتروني لتفعيله قبل تسجيل الدخول.');
            authForm.reset();
          } else {
            await signIn(email, password);
            closeAuthModal();
            authForm.reset();
          }
        } catch (err) {
          console.error('Auth error:', err);
          setError(genericAuthError(err));
        } finally {
          isSubmitting = false;
          if (authSubmitBtn) { authSubmitBtn.disabled = false; authSubmitBtn.textContent = originalText; }
        }
      });
    }

    // === Formulaire de réinitialisation du mot de passe ===
    if (resetForm) {
      resetForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (resetError) resetError.textContent = '';
        const pwd = document.getElementById('newPassword').value;
        const pwd2 = document.getElementById('newPasswordConfirm').value;

        if (!isStrongPassword(pwd)) {
          if (resetError) resetError.textContent = 'كلمة المرور ضعيفة: 8 خانات على الأقل مع حرف ورقم.';
          return;
        }
        if (pwd !== pwd2) {
          if (resetError) resetError.textContent = 'كلمتا المرور غير متطابقتين.';
          return;
        }
        try {
          await updatePassword(pwd);
          closeResetModal();
          const toastFn = window.showToast;
          if (typeof toastFn === 'function') toastFn('✅ تم تحديث كلمة المرور بنجاح.', 'success');
          else alert('✅ تم تحديث كلمة المرور بنجاح.');
        } catch (err) {
          if (resetError) resetError.textContent = genericAuthError(err);
        }
      });
    }

    // === OAuth: Google, GitHub ===
    document.querySelectorAll('[data-oauth]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const provider = btn.dataset.oauth;
        btn.disabled = true;
        try {
          await window.Auth.signInWithProvider(provider);
        } catch (err) {
          console.error('Erreur OAuth:', err);
          setError('تعذّر الاتصال عبر ' + provider + '. حاول مجددًا.');
          btn.disabled = false;
        }
      });
    });

    // === Déconnexion ===
    const logoutBtn = document.getElementById('authLogoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', () => signOut());

    // === Écoute des changements d'état Supabase ===
    if (window.supabaseClient) {
      window.supabaseClient.auth.onAuthStateChange(async (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          openResetModal();
          return;
        }
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'SIGNED_OUT') {
          await checkUserState();
        }
      });
    }

    if (window.location.hash.includes('reset-password') || window.location.hash.includes('type=recovery')) {
      openResetModal();
    }

    await checkUserState();
  });
})();
