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
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB
  const ALLOWED_SOFTWARE_EXTS = ['apk', 'exe', 'zip', 'pdf', 'mp4', 'txt', 'png', 'jpg', 'jpeg', 'webp'];
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
    if (state === 'ok') {
      if (guardMsg) guardMsg.hidden = true;
      if (panel) panel.hidden = false;
    } else {
      if (guardMsg) {
        guardMsg.hidden = false;
        guardMsg.textContent = message;
      }
      if (panel) panel.hidden = true;
    }
  }

  function escapeAdminHTML(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  // ====== تعريف loadItems و loadPortfolioItems ======

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
          <td>${item.file_url ? '📎 ملف' : ''} ${item.external_url ? '🔗 رابط' : ''}</td>
          <td><button class="btn btn--sm btn--ghost admin-delete-btn" data-id="${item.id}">🗑️ حذف</button></td>
        </tr>
      `).join('');

      listBody.querySelectorAll('.admin-delete-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteItem(btn.dataset.id));
      });
    } catch (err) {
      listBody.innerHTML = `<tr><td colspan="5">❌ خطأ: ${err.message}</td></tr>`;
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
      portfolioItemsBody.innerHTML = `<tr><td colspan="4">❌ خطأ: ${err.message}</td></tr>`;
    }
  }

  // ====== التحقق من الصلاحية (checkAccess) ======

  async function checkAccess() {
    console.log('🔍 Vérification des accès...');
    console.log('window.Auth:', window.Auth);

    if (!window.Auth) {
      setGuardState('denied', '⏳ جارٍ تحميل نظام المصادقة...');
      return false;
    }

    if (!window.Auth.isLoggedIn || !window.Auth.isLoggedIn()) {
      setGuardState('denied', '🔒 هذه الصفحة مخصصة للمشرف فقط. سجّل الدخول بحساب المشرف من الصفحة الرئيسية.');
      setTimeout(() => {
        window.location.href = '/index.html#hero';
      }, 3000);
      return false;
    }

    // الفحص الآمن لـ isAdmin سواء كان Getter أو Function
    const isAdminUser = typeof window.Auth.isAdmin === 'function' 
      ? await window.Auth.isAdmin() 
      : window.Auth.isAdmin;

    if (!isAdminUser) {
      setGuardState('denied', `⛔ حسابك (${window.Auth.user?.email || ''}) مسجّل لكنه لا يملك صلاحية المشرف.`);
      setTimeout(() => {
        window.location.href = '/index.html#hero';
      }, 3000);
      return false;
    }

    setGuardState('ok');
    
    try {
      await loadItems();
      await loadPortfolioItems();
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
        const path = item.file_url.split('/').pop();
        if (path) {
          await window.supabaseClient
            .storage.from(window.APP_CONFIG.STORAGE_BUCKET)
            .remove([path])
            .catch(() => {});
        }
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
        const path = item.media_url.split('/').pop();
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

  // ====== التهيئة للانتظار والبدء ======

  if (typeof window.isSupabaseConfigured === 'function' && !window.isSupabaseConfigured()) {
    setGuardState('denied', '⚠️ الموقع غير مربوط بقاعدة البيانات. عدّل js/config.js أولاً.');
    return;
  }

  async function waitForAuth(retries = 0) {
    const maxRetries = 15;
    
    if (window.Auth && typeof window.Auth.init === 'function') {
      console.log('✅ Auth trouvé, initialisation...');
      try {
        await window.Auth.init();
        await checkAccess();
        
        document.addEventListener('auth:changed', () => {
          console.log('🔄 Auth changé, re-vérification...');
          checkAccess();
        });
        
        setupAdminFeatures();
        console.log('✅ Admin initialisé avec succès!');
      } catch (err) {
        console.error('❌ Erreur lors de l\'initialisation de Auth:', err);
        setGuardState('denied', '❌ خطأ في تهيئة المصادقة: ' + err.message);
      }
      return;
    }

    retries++;
    if (retries > maxRetries) {
      setGuardState('denied', '❌ فشل تحميل نظام المصادقة بعد ' + maxRetries + ' محاولات.');
      return;
    }

    console.log(`⏳ Attente de Auth... (tentative ${retries}/${maxRetries})`);
    setTimeout(() => waitForAuth(retries), 400);
  }

  // ====== إعداد ميزات عناصر التحكم والرفع ======

  function setupAdminFeatures() {
    console.log('⚙️ Configuration des fonctionnalités admin...');

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

    if (fileInput) {
      fileInput.addEventListener('change', () => {
        if (fileInput.files[0]) setSelectedFile(fileInput.files[0]);
      });
    }

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

    if (form) {
      form.addEventListener('submit', async (e) => {
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
          is_published: true
        };

        if (!payload.name_ar || !payload.description_ar || !payload.category) {
          if (statusBox) {
            statusBox.textContent = '⚠️ الحقول الأساسية مطلوبة.';
            statusBox.classList.add('is-error');
          }
          return;
        }

        if (uploadMode === 'file' && !selectedFile) {
          if (statusBox) {
            statusBox.textContent = '⚠️ الرجاء اختيار ملف للرفع.';
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

            const { data: publicData } = window.supabaseClient
              .storage.from(window.APP_CONFIG.STORAGE_BUCKET).getPublicUrl(path);

            payload.file_url = publicData.publicUrl;
            payload.file_name = selectedFile.name;
            if (progressBar) progressBar.value = 100;
          }

          const { error: insertError } = await window.supabaseClient.from('software_items').insert(payload);
          if (insertError) throw insertError;

          if (statusBox) {
            statusBox.textContent = '✅ تمت الإضافة بنجاح.';
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
            showToast(statusBox.textContent, 'error');
          }
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
    }

    // ====== معرض الأعمال ======
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

    if (portfolioFileInput) {
      portfolioFileInput.addEventListener('change', () => {
        if (portfolioFileInput.files[0]) setSelectedPortfolioFile(portfolioFileInput.files[0]);
      });
    }

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

    if (portfolioForm) {
      portfolioForm.addEventListener('submit', async (e) => {
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
            showToast(portfolioStatus.textContent, 'error');
          }
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
  }

  // ====== بدء التشغيل ======
  await waitForAuth();
});
