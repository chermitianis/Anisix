/* =========================================================
   admin.js — لوحة تحكم المشرف مع حماية صارمة وتقييد الملفات
   ========================================================= */

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🔐 Chargement de admin.js...');

  const guardMsg = document.getElementById('adminGuard');
  const panel = document.getElementById('adminPanel');
  const listBody = document.getElementById('adminItemsBody');
  const form = document.getElementById('uploadForm');
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');
  const fileNameLabel = document.getElementById('fileNameLabel');
  const progressBar = document.getElementById('uploadProgress');
  const statusBox = document.getElementById('uploadStatus');
  const uploadModeRadios = document.querySelectorAll('input[name="uploadMode"]');
  const fileModeBox = document.getElementById('fileModeBox');
  const linkModeBox = document.getElementById('linkModeBox');
  const externalUrlLinkMode = document.getElementById('externalUrlLinkMode');

  // ====== قيود الأمان ======
  const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200 MB
  const ALLOWED_SOFTWARE_EXTS = ['apk', 'exe', 'msi', 'zip', 'rar', '7z', 'pdf', 'mp4', 'txt', 'png', 'jpg', 'jpeg', 'webp', 'dmg', 'iso'];
  const ALLOWED_PORTFOLIO_EXTS = ['jpg', 'jpeg', 'png', 'webp', 'mp4'];

  let selectedFile = null;
  let selectedPortfolioFile = null;

  // ====== وظائف مساعدة ======

  function isFileAllowed(file, allowedList) {
    const ext = file.name.split('.').pop().toLowerCase();
    return allowedList.includes(ext);
  }

  function showToast(message, type = 'info') {
    const existing = document.querySelector('.admin-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `admin-toast admin-toast--${type}`;
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%);
      background: ${type === 'success' ? '#1F6B4D' : type === 'error' ? '#B23A2E' : '#10263B'};
      color: white; padding: 12px 24px; border-radius: 8px; font-size: 0.9rem;
      z-index: 9999; box-shadow: 0 4px 12px rgba(0,0,0,0.2); max-width: 90%;
      transition: opacity 0.3s ease;
      font-weight: 500;
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 400);
    }, 3500);
  }

  function setGuardState(state, message) {
    if (!guardMsg || !panel) return;
    if (state === 'ok') {
      guardMsg.hidden = true;
      panel.hidden = false;
    } else {
      guardMsg.hidden = false;
      panel.hidden = true;
      guardMsg.textContent = message;
    }
  }

  function escapeAdminHTML(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  function extractStoragePath(url, bucket) {
    if (!url) return null;
    const marker = `/storage/v1/object/public/${bucket}/`;
    const idx = url.indexOf(marker);
    if (idx === -1) return null;
    return decodeURIComponent(url.slice(idx + marker.length));
  }

  // ====== تحميل البيانات ======

  async function loadItems() {
    if (!listBody) return;
    listBody.innerHTML = '<tr><td colspan="5">⏳ جارٍ التحميل...</td></tr>';

    try {
      const { data, error } = await window.supabaseClient
        .from('software_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        listBody.innerHTML = '<tr><td colspan="5">📭 لا توجد عناصر بعد.</td></tr>';
        return;
      }

      listBody.innerHTML = data.map(item => `
        <tr>
          <td>${escapeAdminHTML(item.name_ar)}</td>
          <td><span class="soft-badge">${escapeAdminHTML(item.category)}</span></td>
          <td>${item.version ? 'v' + escapeAdminHTML(item.version) : '—'}</td>
          <td>${item.file_url ? '📎 ملف' : ''} ${item.external_url ? '🔗 رابط' : ''} <span class="soft-plan-lock">${escapeAdminHTML(item.required_plan || 'free')}</span></td>
          <td><button class="btn btn--sm btn--ghost admin-delete-btn" data-id="${item.id}">🗑️ حذف</button></td>
        </tr>
      `).join('');

      listBody.querySelectorAll('.admin-delete-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteItem(btn.dataset.id));
      });
    } catch (err) {
      listBody.innerHTML = `<tr><td colspan="5">❌ خطأ: ${escapeAdminHTML(err.message)}</td></tr>`;
    }
  }

  async function loadPortfolioItems() {
    const portfolioItemsBody = document.getElementById('portfolioItemsBody');
    if (!portfolioItemsBody) return;
    portfolioItemsBody.innerHTML = '<tr><td colspan="4">⏳ جارٍ التحميل...</td></tr>';

    try {
      const { data, error } = await window.supabaseClient
        .from('portfolio_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        portfolioItemsBody.innerHTML = '<tr><td colspan="4">📭 لا توجد أعمال بعد.</td></tr>';
        return;
      }

      portfolioItemsBody.innerHTML = data.map(item => `
        <tr>
          <td>${escapeAdminHTML(item.title_ar)}</td>
          <td><span class="soft-badge">${escapeAdminHTML(item.category)}</span></td>
          <td>${item.media_type === 'video' ? '🎬' : '🖼️'}</td>
          <td><button class="btn btn--sm btn--ghost portfolio-delete-btn" data-id="${item.id}">🗑️ حذف</button></td>
        </tr>
      `).join('');

      portfolioItemsBody.querySelectorAll('.portfolio-delete-btn').forEach(btn => {
        btn.addEventListener('click', () => deletePortfolioItem(btn.dataset.id));
      });
    } catch (err) {
      portfolioItemsBody.innerHTML = `<tr><td colspan="4">❌ خطأ: ${escapeAdminHTML(err.message)}</td></tr>`;
    }
  }

  async function loadContactMessages() {
    const body = document.getElementById('contactMessagesBody');
    const badge = document.getElementById('unreadBadge');
    if (!body) return;
    body.innerHTML = '<tr><td colspan="6">⏳ جارٍ التحميل...</td></tr>';

    try {
      const { data, error } = await window.supabaseClient
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      if (!data || data.length === 0) {
        body.innerHTML = '<tr><td colspan="6">📭 لا توجد رسائل بعد.</td></tr>';
        if (badge) badge.hidden = true;
        return;
      }

      const unreadCount = data.filter(m => !m.is_read).length;
      if (badge) {
        badge.hidden = unreadCount === 0;
        badge.textContent = unreadCount + ' غير مقروءة';
      }

      body.innerHTML = data.map(m => `
        <tr style="${m.is_read ? '' : 'font-weight:700'}">
          <td>${escapeAdminHTML(m.name)}</td>
          <td>${escapeAdminHTML(m.contact_info)}</td>
          <td>${escapeAdminHTML(m.service_type)}</td>
          <td style="max-width:260px;white-space:pre-wrap">${escapeAdminHTML(m.details)}</td>
          <td>${new Date(m.created_at).toLocaleDateString('ar')}</td>
          <td style="white-space:nowrap">
            ${!m.is_read ? `<button class="btn btn--sm btn--ghost msg-read-btn" data-id="${m.id}">✔️ مقروء</button>` : ''}
            <button class="btn btn--sm btn--ghost msg-delete-btn" data-id="${m.id}">🗑️</button>
          </td>
        </tr>
      `).join('');

      body.querySelectorAll('.msg-read-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          await window.supabaseClient.from('contact_messages').update({ is_read: true }).eq('id', btn.dataset.id);
          await loadContactMessages();
        });
      });
      body.querySelectorAll('.msg-delete-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          if (!confirm('⚠️ حذف هذه الرسالة نهائيًا؟')) return;
          await window.supabaseClient.from('contact_messages').delete().eq('id', btn.dataset.id);
          await loadContactMessages();
        });
      });
    } catch (err) {
      body.innerHTML = `<tr><td colspan="6">❌ خطأ: ${escapeAdminHTML(err.message)}</td></tr>`;
    }
  }

  async function searchUsers(emailQuery) {
    const body = document.getElementById('usersBody');
    if (!body) return;
    if (!emailQuery || emailQuery.length < 3) {
      body.innerHTML = '<tr><td colspan="5">اكتب 3 أحرف على الأقل من البريد للبحث</td></tr>';
      return;
    }
    body.innerHTML = '<tr><td colspan="5">⏳ جارٍ البحث...</td></tr>';

    try {
      const { data, error } = await window.supabaseClient
        .from('profiles')
        .select('id, email, full_name, subscription_plan, is_admin, created_at')
        .ilike('email', `%${emailQuery}%`)
        .limit(20);

      if (error) throw error;

      if (!data || data.length === 0) {
        body.innerHTML = '<tr><td colspan="5">لا نتائج.</td></tr>';
        return;
      }

      body.innerHTML = data.map(u => `
        <tr>
          <td>${escapeAdminHTML(u.email)} ${u.is_admin ? '👑' : ''}</td>
          <td>${escapeAdminHTML(u.full_name || '—')}</td>
          <td>
            <select class="plan-select" data-id="${u.id}" ${u.is_admin ? 'disabled title="حساب مشرف"' : ''}>
              <option value="free" ${u.subscription_plan === 'free' ? 'selected' : ''}>مجاني</option>
              <option value="pro" ${u.subscription_plan === 'pro' ? 'selected' : ''}>Pro</option>
              <option value="enterprise" ${u.subscription_plan === 'enterprise' ? 'selected' : ''}>Enterprise</option>
            </select>
          </td>
          <td>${new Date(u.created_at).toLocaleDateString('ar')}</td>
          <td></td>
        </tr>
      `).join('');

      body.querySelectorAll('.plan-select').forEach(sel => {
        sel.addEventListener('change', async () => {
          try {
            const { error } = await window.supabaseClient
              .from('profiles')
              .update({ subscription_plan: sel.value })
              .eq('id', sel.dataset.id);
            if (error) throw error;
            showToast('✅ تم تحديث الخطة بنجاح.', 'success');
          } catch (err) {
            showToast('❌ تعذّر التحديث: ' + err.message, 'error');
          }
        });
      });
    } catch (err) {
      body.innerHTML = `<tr><td colspan="5">❌ خطأ: ${escapeAdminHTML(err.message)}</td></tr>`;
    }
  }

  // ====== التحقق المحصن من الصلاحية (حل خطأ TypeError الجذري) ======

  async function checkAccess() {
    console.log('🔍 Vérification des accès admin...');

    if (!window.Auth) {
      setGuardState('denied', '⏳ جارٍ تحميل نظام المصادقة...');
      return false;
    }

    if (!window.Auth.isLoggedIn || !window.Auth.isLoggedIn()) {
      setGuardState('denied', '🔒 هذه الصفحة مخصصة للمشرف فقط. سجّل الدخول بحساب المشرف من الصفحة الرئيسية.');
      setTimeout(() => { window.location.href = '/index.html#hero'; }, 3000);
      return false;
    }

    // المعالجة الآمنة لحالة كائن isAdmin سواء كان دالة أو خاصية
    let isAuthorized = false;
    if (typeof window.Auth.isAdmin === 'function') {
      isAuthorized = await window.Auth.isAdmin();
    } else {
      isAuthorized = Boolean(window.Auth.isAdmin);
    }

    if (!isAuthorized) {
      setGuardState('denied', `⛔ حسابك (${window.Auth.user?.email || 'مجهول'}) مسجّل لكنه لا يملك صلاحية المشرف.`);
      setTimeout(() => { window.location.href = '/index.html#hero'; }, 3000);
      return false;
    }

    setGuardState('ok');

    try {
      await loadItems();
      await loadPortfolioItems();
      await loadContactMessages();
    } catch (err) {
      console.error('❌ Erreur lors du chargement des données:', err);
    }

    return true;
  }

  // ====== وظائف الحذف ======

  async function deleteItem(id) {
    if (!confirm('⚠️ حذف هذا العنصر نهائيًا من الموقع؟')) return;

    try {
      const { data: item } = await window.supabaseClient
        .from('software_items')
        .select('file_url, file_name')
        .eq('id', id)
        .single();

      const { error } = await window.supabaseClient.from('software_items').delete().eq('id', id);
      if (error) throw error;

      if (item && item.file_url) {
        await window.supabaseClient
          .storage.from(window.APP_CONFIG.STORAGE_BUCKET)
          .remove([item.file_url])
          .catch(() => {});
      }

      showToast('✅ تم الحذف بنجاح.', 'success');
      await loadItems();
    } catch (err) {
      showToast('❌ تعذّر الحذف: ' + err.message, 'error');
    }
  }

  async function deletePortfolioItem(id) {
    if (!confirm('⚠️ حذف هذا العمل نهائيًا من المعرض؟')) return;

    try {
      const { data: item } = await window.supabaseClient
        .from('portfolio_items')
        .select('media_url')
        .eq('id', id)
        .single();

      const { error } = await window.supabaseClient.from('portfolio_items').delete().eq('id', id);
      if (error) throw error;

      if (item && item.media_url) {
        const path = extractStoragePath(item.media_url, window.APP_CONFIG.PORTFOLIO_BUCKET);
        if (path) {
          await window.supabaseClient
            .storage.from(window.APP_CONFIG.PORTFOLIO_BUCKET)
            .remove([path])
            .catch(() => {});
        }
      }

      showToast('✅ تم حذف العمل.', 'success');
      await loadPortfolioItems();
    } catch (err) {
      showToast('❌ تعذّر الحذف: ' + err.message, 'error');
    }
  }

  // ====== التهيئة المضمونة ======

  if (!window.isSupabaseConfigured || !window.isSupabaseConfigured()) {
    setGuardState('denied', '⚠️ الموقع غير مربوط بقاعدة البيانات. عدّل js/config.js أولاً.');
    return;
  }

  async function waitForAuth(retries = 0) {
    const maxRetries = 20;

    if (window.Auth && typeof window.Auth.init === 'function') {
      try {
        await window.Auth.init();
        const hasAccess = await checkAccess();

        if (hasAccess) {
          document.addEventListener('auth:changed', () => {
            console.log('🔄 Auth changé, re-vérification...');
            checkAccess();
          });
          setupAdminFeatures();
        }
      } catch (err) {
        console.error('❌ Erreur d\'initialisation Auth:', err);
        setGuardState('denied', '❌ خطأ في تهيئة المصادقة: ' + err.message);
      }
      return;
    }

    retries++;
    if (retries > maxRetries) {
      setGuardState('denied', '❌ فشل تحميل نظام المصادقة. يرجى إعادة تحميل الصفحة.');
      return;
    }

    setTimeout(() => waitForAuth(retries), 300);
  }

  // ====== إعداد ميزات لوحة التحكم ======

  function setupAdminFeatures() {
    console.log('⚙️ Configuration des fonctionnalités admin...');

    const userSearchInput = document.getElementById('userSearchInput');
    if (userSearchInput) {
      let debounceTimer = null;
      userSearchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => searchUsers(userSearchInput.value.trim()), 400);
      });
    }

    uploadModeRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        const isFile = document.querySelector('input[name="uploadMode"]:checked').value === 'file';
        if (fileModeBox) fileModeBox.hidden = !isFile;
        if (linkModeBox) linkModeBox.hidden = isFile;
        if (isFile && externalUrlLinkMode) {
          externalUrlLinkMode.value = '';
          if (form.elements['externalUrl']) form.elements['externalUrl'].value = '';
        }
        if (!isFile) {
          selectedFile = null;
          if (fileNameLabel) fileNameLabel.textContent = '';
          if (fileInput) fileInput.value = '';
        }
      });
    });

    if (dropzone) {
      ['dragenter', 'dragover'].forEach(evt =>
        dropzone.addEventListener(evt, (e) => {
          e.preventDefault();
          dropzone.classList.add('is-dragging');
        })
      );
      ['dragleave', 'drop'].forEach(evt =>
        dropzone.addEventListener(evt, (e) => {
          e.preventDefault();
          dropzone.classList.remove('is-dragging');
        })
      );
      dropzone.addEventListener('drop', (e) => {
        const file = e.dataTransfer.files[0];
        if (file) setSelectedFile(file);
      });
      dropzone.addEventListener('click', () => fileInput && fileInput.click());
    }

    fileInput && fileInput.addEventListener('change', () => {
      if (fileInput.files[0]) setSelectedFile(fileInput.files[0]);
    });

    function setSelectedFile(file) {
      if (!file) {
        selectedFile = null;
        if (fileNameLabel) fileNameLabel.textContent = '';
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        showToast(`⚠️ الملف كبير جداً (الحد الأقصى ${MAX_FILE_SIZE / (1024 * 1024)} ميجابايت)`, 'error');
        if (fileInput) fileInput.value = '';
        return;
      }

      if (!isFileAllowed(file, ALLOWED_SOFTWARE_EXTS)) {
        showToast(`⚠️ امتداد غير مسموح. الامتدادات المقبولة: ${ALLOWED_SOFTWARE_EXTS.join(', ')}`, 'error');
        if (fileInput) fileInput.value = '';
        return;
      }

      selectedFile = file;
      if (fileNameLabel) fileNameLabel.textContent = `${file.name} — ${(file.size / (1024 * 1024)).toFixed(2)} MB`;
    }

    form && form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (statusBox) {
        statusBox.textContent = '';
        statusBox.className = 'upload-status';
      }

      const uploadMode = document.querySelector('input[name="uploadMode"]:checked').value;
      const fd = new FormData(form);

      const payload = {
        category: fd.get('category'),
        badge_label: fd.get('badgeLabel') || null,
        name_ar: fd.get('nameAr'),
        name_fr: fd.get('nameFr') || null,
        name_en: fd.get('nameEn') || null,
        description_ar: fd.get('descAr'),
        description_fr: fd.get('descFr') || null,
        description_en: fd.get('descEn') || null,
        version: fd.get('version') || null,
        meta_text: fd.get('metaText') || null,
        external_url: fd.get('externalUrl') || null,
        required_plan: fd.get('requiredPlan') || 'free',
        is_published: true
      };

      if (!payload.name_ar || !payload.description_ar || !payload.category) {
        if (statusBox) {
          statusBox.textContent = '⚠️ الحقول الأساسية (الاسم بالعربي، الوصف، التصنيف) مطلوبة.';
          statusBox.classList.add('is-error');
        }
        return;
      }

      if (uploadMode === 'file' && !selectedFile) {
        if (statusBox) {
          statusBox.textContent = '⚠️ الرجاء اختيار ملف للرفع، أو التبديل لوضع "رابط خارجي فقط".';
          statusBox.classList.add('is-error');
        }
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;
      if (statusBox) statusBox.textContent = '⏳ جارٍ الرفع...';

      try {
        if (uploadMode === 'file' && selectedFile) {
          const safeName = selectedFile.name.replace(/[^\w.\-]/g, '_');
          const path = `${payload.category}/${Date.now()}_${safeName}`;

          if (progressBar) {
            progressBar.hidden = false;
            progressBar.value = 10;
          }

          const { error: uploadError } = await window.supabaseClient
            .storage.from(window.APP_CONFIG.STORAGE_BUCKET)
            .upload(path, selectedFile, { cacheControl: '3600', upsert: false });

          if (uploadError) throw uploadError;
          if (progressBar) progressBar.value = 80;

          payload.file_url = path;
          payload.file_name = selectedFile.name;
          if (progressBar) progressBar.value = 100;
        }

        const { error: insertError } = await window.supabaseClient.from('software_items').insert(payload);
        if (insertError) throw insertError;

        if (statusBox) {
          statusBox.textContent = '✅ تمت الإضافة بنجاح — العنصر ظاهر الآن في الموقع.';
          statusBox.classList.remove('is-error');
          statusBox.classList.add('is-success');
        }
        showToast('✅ تمت الإضافة بنجاح!', 'success');

        form.reset();
        selectedFile = null;
        if (fileNameLabel) fileNameLabel.textContent = '';
        if (externalUrlLinkMode) externalUrlLinkMode.value = '';
        if (form.elements['externalUrl']) form.elements['externalUrl'].value = '';
        await loadItems();

      } catch (err) {
        if (statusBox) {
          statusBox.textContent = '❌ خطأ: ' + (err.message || 'تعذّر إتمام العملية.');
          statusBox.classList.add('is-error');
        }
        showToast('❌ تعذّر إتمام العملية.', 'error');
      } finally {
        if (submitBtn) submitBtn.disabled = false;
        setTimeout(() => {
          if (progressBar) {
            progressBar.hidden = true;
            progressBar.value = 0;
          }
        }, 800);
      }
    });

    const portfolioForm = document.getElementById('portfolioForm');
    const portfolioDropzone = document.getElementById('portfolioDropzone');
    const portfolioFileInput = document.getElementById('portfolioFileInput');
    const portfolioFileNameLabel = document.getElementById('portfolioFileNameLabel');
    const portfolioProgress = document.getElementById('portfolioProgress');
    const portfolioStatus = document.getElementById('portfolioStatus');

    if (portfolioDropzone) {
      ['dragenter', 'dragover'].forEach(evt =>
        portfolioDropzone.addEventListener(evt, (e) => {
          e.preventDefault();
          portfolioDropzone.classList.add('is-dragging');
        })
      );
      ['dragleave', 'drop'].forEach(evt =>
        portfolioDropzone.addEventListener(evt, (e) => {
          e.preventDefault();
          portfolioDropzone.classList.remove('is-dragging');
        })
      );
      portfolioDropzone.addEventListener('drop', (e) => {
        const file = e.dataTransfer.files[0];
        if (file) setSelectedPortfolioFile(file);
      });
      portfolioDropzone.addEventListener('click', () => portfolioFileInput && portfolioFileInput.click());
    }

    portfolioFileInput && portfolioFileInput.addEventListener('change', () => {
      if (portfolioFileInput.files[0]) setSelectedPortfolioFile(portfolioFileInput.files[0]);
    });

    function setSelectedPortfolioFile(file) {
      if (!file) {
        selectedPortfolioFile = null;
        if (portfolioFileNameLabel) portfolioFileNameLabel.textContent = '';
        return;
      }

      const MAX_PORTFOLIO_SIZE = 10 * 1024 * 1024;
      if (file.size > MAX_PORTFOLIO_SIZE) {
        showToast(`⚠️ الملف كبير جداً (الحد الأقصى ${MAX_PORTFOLIO_SIZE / (1024 * 1024)} ميجابايت)`, 'error');
        if (portfolioFileInput) portfolioFileInput.value = '';
        return;
      }

      if (!isFileAllowed(file, ALLOWED_PORTFOLIO_EXTS)) {
        showToast(`⚠️ امتداد غير مسموح. الامتدادات المقبولة: ${ALLOWED_PORTFOLIO_EXTS.join(', ')}`, 'error');
        if (portfolioFileInput) portfolioFileInput.value = '';
        return;
      }

      selectedPortfolioFile = file;
      if (portfolioFileNameLabel) portfolioFileNameLabel.textContent = `${file.name} — ${(file.size / (1024 * 1024)).toFixed(2)} MB`;
    }

    portfolioForm && portfolioForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (portfolioStatus) {
        portfolioStatus.textContent = '';
        portfolioStatus.className = 'upload-status';
      }

      const fd = new FormData(portfolioForm);
      const payload = {
        category: fd.get('category'),
        title_ar: fd.get('titleAr'),
        title_fr: fd.get('titleFr') || null,
        title_en: fd.get('titleEn') || null,
        is_published: true
      };

      if (!payload.title_ar || !payload.category) {
        if (portfolioStatus) {
          portfolioStatus.textContent = '⚠️ العنوان بالعربي والتصنيف مطلوبان.';
          portfolioStatus.classList.add('is-error');
        }
        return;
      }

      if (!selectedPortfolioFile) {
        if (portfolioStatus) {
          portfolioStatus.textContent = '⚠️ الرجاء اختيار صورة أو فيديو.';
          portfolioStatus.classList.add('is-error');
        }
        return;
      }

      const submitBtn = portfolioForm.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.disabled = true;
      if (portfolioStatus) portfolioStatus.textContent = '⏳ جارٍ الرفع...';
      if (portfolioProgress) {
        portfolioProgress.hidden = false;
        portfolioProgress.value = 10;
      }

      try {
        const safeName = selectedPortfolioFile.name.replace(/[^\w.\-]/g, '_');
        const path = `${payload.category}/${Date.now()}_${safeName}`;

        const { error: uploadError } = await window.supabaseClient
          .storage.from(window.APP_CONFIG.PORTFOLIO_BUCKET)
          .upload(path, selectedPortfolioFile, { cacheControl: '3600', upsert: false });

        if (uploadError) throw uploadError;
        if (portfolioProgress) portfolioProgress.value = 80;

        const { data: publicData } = window.supabaseClient
          .storage.from(window.APP_CONFIG.PORTFOLIO_BUCKET).getPublicUrl(path);

        payload.media_url = publicData.publicUrl;
        payload.media_type = selectedPortfolioFile.type.startsWith('video') ? 'video' : 'image';
        if (portfolioProgress) portfolioProgress.value = 100;

        const { error: insertError } = await window.supabaseClient.from('portfolio_items').insert(payload);
        if (insertError) throw insertError;

        if (portfolioStatus) {
          portfolioStatus.textContent = '✅ تمت الإضافة بنجاح.';
          portfolioStatus.classList.add('is-success');
        }
        showToast('✅ تمت إضافة العمل بنجاح!', 'success');

        portfolioForm.reset();
        setSelectedPortfolioFile(null);
        await loadPortfolioItems();

      } catch (err) {
        if (portfolioStatus) {
          portfolioStatus.textContent = '❌ خطأ: ' + (err.message || 'تعذّر إتمام العملية.');
          portfolioStatus.classList.add('is-error');
        }
        showToast('❌ تعذّر إتمام العملية.', 'error');
      } finally {
        if (submitBtn) submitBtn.disabled = false;
        setTimeout(() => {
          if (portfolioProgress) {
            portfolioProgress.hidden = true;
            portfolioProgress.value = 0;
          }
        }, 800);
      }
    });
  }

  // ====== بدء التهيئة ======
  await waitForAuth();
});
