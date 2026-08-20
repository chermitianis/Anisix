/* =========================================================
   contact-form.js — إدارة نموذج التواصل
   ========================================================= */

import { showToast } from '../utils/helpers.js';

export function initContactForm() {
  const form = document.getElementById('contactForm');
  const formNote = document.getElementById('formNote');
  if (!form) return;

  const validators = {
    name: value => value.trim().length >= 2 && value.trim().length <= 200,
    contactInfo: value => {
      const v = value.trim();
      if (v.length > 200) return false;
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      const isPhone = /^\+?[\d\s-]{7,}$/.test(v) && /\d{6,}/.test(v.replace(/\D/g, ''));
      return isEmail || isPhone;
    },
    serviceType: value => !!value,
    details: value => value.trim().length >= 10 && value.trim().length <= 5000
  };

  let attempted = false;

  const showError = (field, ok) => {
    const row = field.closest('.form-row');
    row.classList.toggle('has-error', !ok);
  };

  Object.keys(validators).forEach(name => {
    const field = form.elements[name];
    if (!field) return;
    field.addEventListener('input', () => {
      if (attempted) showError(field, validators[name](field.value));
    });
    field.addEventListener('change', () => {
      if (attempted) showError(field, validators[name](field.value));
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    attempted = true;

    // مصيدة البوتات: إن كان هذا الحقل المخفي مملوءًا، فهذا بوت — نتجاهل الطلب بصمت
    const honeypot = form.elements['website'];
    if (honeypot && honeypot.value) {
      formNote.textContent = window.i18n ? window.i18n.t('form_success') : 'Votre message a été reçu, je vous recontacte bientôt.';
      formNote.classList.add('is-success');
      form.reset();
      return;
    }

    let valid = true;

    Object.keys(validators).forEach(name => {
      const field = form.elements[name];
      if (!field) return;
      const ok = validators[name](field.value);
      showError(field, ok);
      if (!ok) valid = false;
    });

    if (!valid) {
      formNote.textContent = 'Veuillez corriger les champs surlignés.';
      formNote.classList.remove('is-success');
      return;
    }

    const payload = {
      name: form.elements['name'].value.trim(),
      contact_info: form.elements['contactInfo'].value.trim(),
      service_type: form.elements['serviceType'].value,
      details: form.elements['details'].value.trim(),
      user_id: window.Auth && window.Auth.session ? window.Auth.session.user.id : null
    };

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;

    try {
      if (window.isSupabaseConfigured()) {
        const { error } = await window.supabaseClient.from('contact_messages').insert(payload);
        if (error) throw error;
      }
      const msg = window.i18n ? window.i18n.t('form_success') : 'Votre message a été reçu, je vous recontacte bientôt.';
      formNote.textContent = msg;
      formNote.classList.add('is-success');
      form.querySelectorAll('.form-row').forEach(row => row.classList.remove('has-error'));
      form.reset();
      attempted = false;
      showToast(msg, 'success');
    } catch (err) {
      const msg = window.i18n ? window.i18n.t('form_error_generic') : 'Une erreur est survenue, réessayez.';
      formNote.textContent = msg;
      formNote.classList.remove('is-success');
      showToast(msg, 'error');
    } finally {
      submitBtn.disabled = false;
    }
  });
}