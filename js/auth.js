/* =========================================================
   auth.js — Gestion de l'authentification Supabase
   Version stable avec gestion d'erreurs et mise à jour UI
   ========================================================= */

(function() {
  // État interne
  let currentSession = null;
  let currentUser = null;
  let isAdmin = false;

  // Éléments DOM
  const authModal = document.getElementById('authModal');
  const authModalTitle = document.getElementById('authModalTitle');
  const authEmailInput = document.getElementById('authEmail');
  const authPasswordInput = document.getElementById('authPassword');
  const authConfirmRow = document.getElementById('authConfirmRow');
  const authConfirmPassword = document.getElementById('authConfirmPassword');
  const authSubmitBtn = document.getElementById('authSubmitBtn');
  const authSwitchBtn = document.getElementById('authSwitchBtn');
  const authGuestBtn = document.getElementById('authGuestBtn');
  const authError = document.getElementById('authError');
  const authModalClose = document.getElementById('authModalClose');

  let isSignUpMode = false;

  // --- Fonctions utilitaires ---
  function closeAuthModal() {
    if (authModal) {
      authModal.hidden = true;
      authModal.style.display = 'none';
    }
    if (authError) authError.textContent = '';
  }

  function openAuthModal() {
    if (authModal) {
      authModal.hidden = false;
      authModal.style.display = 'flex';
    }
  }

  // Mise à jour de l'interface utilisateur (header)
  function updateUIForUser(user) {
    const guestState = document.getElementById('authGuestState');
    const userState = document.getElementById('authUserState');
    const userEmail = document.getElementById('authUserEmail');
    const adminLink = document.getElementById('authAdminLink');

    if (user) {
      if (guestState) guestState.hidden = true;
      if (userState) userState.hidden = false;
      if (userEmail) userEmail.textContent = user.email;
      if (adminLink) {
        adminLink.hidden = !isAdmin;
      }
    } else {
      if (guestState) guestState.hidden = false;
      if (userState) userState.hidden = true;
    }
  }

  // Vérification de l'état de l'utilisateur (appelée au chargement et après chaque changement)
  async function checkUserState() {
    if (!window.supabaseClient) {
      updateUIForUser(null);
      return;
    }

    try {
      const { data: { session } } = await window.supabaseClient.auth.getSession();
      if (session && session.user) {
        currentSession = session;
        currentUser = session.user;
        
        // Vérifier si l'utilisateur est admin
        const { data: profile } = await window.supabaseClient
          .from('profiles')
          .select('is_admin')
          .eq('id', session.user.id)
          .maybeSingle();
        isAdmin = profile ? profile.is_admin : false;
        
        updateUIForUser(session.user);
        closeAuthModal();
        document.dispatchEvent(new CustomEvent('auth:changed', { detail: { user: session.user, isAdmin } }));
        return;
      }
    } catch (e) {
      console.warn('⚠️ Supabase non disponible, mode invité activé.');
    }

    // Mode invité ou non connecté
    currentSession = null;
    currentUser = null;
    isAdmin = false;
    updateUIForUser(null);
    document.dispatchEvent(new CustomEvent('auth:changed', { detail: { user: null, isAdmin: false } }));
  }

  // --- Fonctions d'authentification ---
  async function signIn(email, password) {
    if (!window.supabaseClient) throw new Error('Supabase n\'est pas initialisé.');
    const { data, error } = await window.supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async function signUp(email, password) {
    if (!window.supabaseClient) throw new Error('Supabase n\'est pas initialisé.');
    const { data, error } = await window.supabaseClient.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  }

  async function signOut() {
    if (!window.supabaseClient) return;
    await window.supabaseClient.auth.signOut();
    currentSession = null;
    currentUser = null;
    isAdmin = false;
    updateUIForUser(null);
    document.dispatchEvent(new CustomEvent('auth:changed', { detail: { user: null, isAdmin: false } }));
  }

  // --- Exposition de l'API publique ---
  window.Auth = {
    get session() { return currentSession; },
    get user() { return currentUser; },
    get isAdmin() { return isAdmin; },
    isLoggedIn() { return !!currentUser; },
    init: checkUserState,
    signIn,
    signUp,
    signOut,
    openModal: openAuthModal,
    closeModal: closeAuthModal,
  };

  // --- Écouteurs d'événements (DOMContentLoaded) ---
  document.addEventListener('DOMContentLoaded', async () => {
    // Ouvrir la modale depuis les boutons [data-open-auth]
    document.querySelectorAll('[data-open-auth]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        openAuthModal();
      });
    });

    // Fermeture de la modale
    if (authModalClose) {
      authModalClose.addEventListener('click', closeAuthModal);
    }
    const backdrop = document.getElementById('authModalBackdrop');
    if (backdrop) {
      backdrop.addEventListener('click', closeAuthModal);
    }

    // Bouton "Invité"
    if (authGuestBtn) {
      authGuestBtn.addEventListener('click', (e) => {
        e.preventDefault();
        closeAuthModal();
        updateUIForUser(null);
      });
    }

    // Bascule Connexion / Inscription
    if (authSwitchBtn) {
      authSwitchBtn.addEventListener('click', () => {
        isSignUpMode = !isSignUpMode;
        const t = window.t || ((k) => k);
        if (isSignUpMode) {
          if (authModalTitle) authModalTitle.textContent = t('auth_title_signup') || 'Créer un compte';
          if (authConfirmRow) authConfirmRow.hidden = false;
          if (authSubmitBtn) authSubmitBtn.textContent = t('auth_signup_btn') || 'S\'inscrire';
          authSwitchBtn.textContent = t('auth_switch_login') || 'Déjà un compte ? Se connecter';
        } else {
          if (authModalTitle) authModalTitle.textContent = t('auth_login_title') || 'Connexion';
          if (authConfirmRow) authConfirmRow.hidden = true;
          if (authSubmitBtn) authSubmitBtn.textContent = t('auth_login_btn') || 'Se connecter';
          authSwitchBtn.textContent = t('auth_switch_signup') || 'Pas encore de compte ? S\'inscrire';
        }
        if (authError) authError.textContent = '';
      });
    }

    // Soumission du formulaire
    const authForm = document.getElementById('authForm');
    if (authForm) {
      authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (authError) authError.textContent = '';

        const email = authEmailInput.value.trim();
        const password = authPasswordInput.value;

        if (!email || !password) {
          if (authError) authError.textContent = 'Veuillez remplir tous les champs.';
          return;
        }

        if (isSignUpMode) {
          const confirm = authConfirmPassword.value;
          if (password !== confirm) {
            if (authError) authError.textContent = 'Les mots de passe ne correspondent pas !';
            return;
          }
          try {
            await signUp(email, password);
            alert('✅ Compte créé ! Vérifiez votre boîte mail pour activer votre compte.');
            closeAuthModal();
          } catch (err) {
            if (authError) authError.textContent = err.message;
          }
        } else {
          try {
            await signIn(email, password);
            closeAuthModal();
          } catch (err) {
            if (authError) authError.textContent = 'Erreur de connexion : ' + err.message;
          }
        }
      });
    }

    // Bouton Déconnexion
    const logoutBtn = document.getElementById('authLogoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        signOut();
      });
    }

    // Initialisation de l'état
    await checkUserState();

    // Écoute des changements d'état Supabase (rafraîchissement token, etc.)
    if (window.supabaseClient) {
      window.supabaseClient.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await checkUserState();
        } else if (event === 'SIGNED_OUT') {
          await checkUserState();
        }
      });
    }
  });
})();