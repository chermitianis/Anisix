/* =========================================================
   لوحة تحكم المشرف — admin.html
   الحماية الحقيقية عبر سياسات RLS في Supabase، هذا الملف
   يتعامل فقط مع واجهة الاستخدام (UX) بافتراض أن الوصول مصرّح له.
   ========================================================= */
document.addEventListener('DOMContentLoaded', async () => {
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

  let selectedFile = null;

  function setGuardState(state, message) {
    if (state === 'ok') {
      guardMsg.hidden = true;
      panel.hidden = false;
    } else {
      guardMsg.hidden = false;
      panel.hidden = true;
      guardMsg.textContent = message;
    }
  }

  // التحقق من تهيئة Supabase
  if (!window.isSupabaseConfigured || !window.isSupabaseConfigured()) {
    setGuardState('denied', 'الموقع غير مربوط بقاعدة البيانات بعد. عدّل js/config.js أولاً.');
    return;
  }

  // انتظار تهيئة Auth
  if (!window.Auth) {
    setGuardState('denied', 'جاري تحميل نظام المصادقة...');
    // يمكن إعادة المحاولة بعد فترة
    setTimeout(() => checkAccess(), 1000);
    return;
  }

  async function checkAccess() {
    if (!window.Auth.isLoggedIn()) {
      setGuardState('denied', 'هذه الصفحة مخصصة للمشرف فقط. سجّل الدخول بحساب المشرف من الصفحة الرئيسية أولاً.');
      return;
    }
    if (!window.Auth.isAdmin) {
      setGuardState('denied', `حسابك (${window.Auth.user.email}) مسجّل لكنه لا يملك صلاحية المشرف. راجع README لتفعيل صلاحية is_admin.`);
      return;
    }
    setGuardState('ok');
    loadItems();
    if (typeof loadPortfolioItems === 'function') loadPortfolioItems();
  }

  await checkAccess();

  // الاستماع لتغييرات المصادقة
  document.addEventListener('auth:changed', () => {
    checkAccess();
  });

  /* ---------- تبديل وضع الرفع: ملف / رابط خارجي فقط ---------- */
  uploadModeRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      const isFile = document.querySelector('input[name="uploadMode"]:checked').value === 'file';
      fileModeBox.hidden = !isFile;
      linkModeBox.hidden = isFile;
    });
  });

  /* ---------- منطقة السحب والإفلات ---------- */
  if (dropzone) {
    ['dragenter', 'dragover'].forEach(evt =>
      dropzone.addEventListener(evt, (e) => { e.preventDefault(); dropzone.classList.add('is-dragging'); }));
    ['dragleave', 'drop'].forEach(evt =>
      dropzone.addEventListener(evt, (e) => { e.preventDefault(); dropzone.classList.remove('is-dragging'); }));
    dropzone.addEventListener('drop', (e) => {
      const file = e.dataTransfer.files[0];
      if (file) setSelectedFile(file);
    });
    dropzone.addEventListener('click', () => fileInput.click());
  }
  fileInput && fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) setSelectedFile(fileInput.files[0]);
  });

  function setSelectedFile(file) {
    selectedFile = file;
    fileNameLabel.textContent = `${file.name} — ${(file.size / (1024 * 1024)).toFixed(2)} MB`;
  }

  /* ---------- إرسال نموذج الإضافة ---------- */
  form && form.addEventListener('submit', async (e) => {
    e.preventDefault();
    statusBox.textContent = '';
    statusBox.className = 'upload-status';

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
      is_published: true,
      created_by: window.Auth.user ? window.Auth.user.id : null
    };

    if (!payload.name_ar || !payload.description_ar || !payload.category) {
      statusBox.textContent = 'الحقول الأساسية (الاسم بالعربي، الوصف، التصنيف) مطلوبة.';
      statusBox.classList.add('is-error');
      return;
    }
    if (uploadMode === 'file' && !selectedFile) {
      statusBox.textContent = 'الرجاء اختيار ملف للرفع، أو التبديل لوضع "رابط خارجي فقط".';
      statusBox.classList.add('is-error');
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    statusBox.textContent = 'جارٍ الرفع...';
    progressBar.hidden = false;
    progressBar.value = 0;

    try {
      if (uploadMode === 'file' && selectedFile) {
        const safeName = selectedFile.name.replace(/[^\w.\-]/g, '_');
        const path = `${payload.category}/${Date.now()}_${safeName}`;

        progressBar.value = 20;

        const { error: uploadError } = await window.supabaseClient
          .storage.from(window.APP_CONFIG.STORAGE_BUCKET)
          .upload(path, selectedFile, { cacheControl: '3600', upsert: false });

        if (uploadError) throw uploadError;
        progressBar.value = 80;

        const { data: publicData } = window.supabaseClient
          .storage.from(window.APP_CONFIG.STORAGE_BUCKET).getPublicUrl(path);

        payload.file_url = publicData.publicUrl;
        payload.file_name = selectedFile.name;
        progressBar.value = 100;
      }

      const { error: insertError } = await window.supabaseClient.from('software_items').insert(payload);
      if (insertError) throw insertError;

      statusBox.textContent = '✔ تمت الإضافة بنجاح — العنصر ظاهر الآن في الموقع.';
      statusBox.classList.remove('is-error');
      statusBox.classList.add('is-success');
      form.reset();
      selectedFile = null;
      fileNameLabel.textContent = '';
      loadItems();

    } catch (err) {
      statusBox.textContent = 'خطأ: ' + (err.message || 'تعذّر إتمام العملية.');
      statusBox.classList.add('is-error');
    } finally {
      submitBtn.disabled = false;
      setTimeout(() => { progressBar.hidden = true; progressBar.value = 0; }, 800);
    }
  });

  /* ---------- عرض العناصر الحالية + الحذف ---------- */
  async function loadItems() {
    if (!listBody) return;
    listBody.innerHTML = '<tr><td colspan="5">جارٍ التحميل...</td></tr>';
    const { data, error } = await window.supabaseClient
      .from('software_items').select('*').order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      listBody.innerHTML = '<tr><td colspan="5">لا توجد عناصر بعد.</td></tr>';
      return;
    }

    listBody.innerHTML = data.map(item => `
      <tr>
        <td>${escapeAdminHTML(item.name_ar)}</td>
        <td><span class="soft-badge">${escapeAdminHTML(item.category)}</span></td>
        <td>${item.version ? 'v' + escapeAdminHTML(item.version) : '—'}</td>
        <td>${item.file_url ? '📎 ملف' : ''} ${item.external_url ? '🔗 رابط' : ''}</td>
        <td><button class="btn btn--sm btn--ghost admin-delete-btn" data-id="${item.id}">حذف</button></td>
      </tr>
    `).join('');

    listBody.querySelectorAll('.admin-delete-btn').forEach(btn => {
      btn.addEventListener('click', () => deleteItem(btn.dataset.id));
    });
  }

  async function deleteItem(id) {
    if (!confirm('حذف هذا العنصر نهائيًا من الموقع؟')) return;
    const { error } = await window.supabaseClient.from('software_items').delete().eq('id', id);
    if (error) { alert('تعذّر الحذف: ' + error.message); return; }
    loadItems();
  }

  function escapeAdminHTML(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  /* =========================================================
     إدارة معرض الأعمال (portfolio_items)
     ========================================================= */
  const portfolioForm = document.getElementById('portfolioForm');
  const portfolioDropzone = document.getElementById('portfolioDropzone');
  const portfolioFileInput = document.getElementById('portfolioFileInput');
  const portfolioFileNameLabel = document.getElementById('portfolioFileNameLabel');
  const portfolioProgress = document.getElementById('portfolioProgress');
  const portfolioStatus = document.getElementById('portfolioStatus');
  const portfolioItemsBody = document.getElementById('portfolioItemsBody');

  let selectedPortfolioFile = null;

  if (portfolioDropzone) {
    ['dragenter', 'dragover'].forEach(evt =>
      portfolioDropzone.addEventListener(evt, (e) => { e.preventDefault(); portfolioDropzone.classList.add('is-dragging'); }));
    ['dragleave', 'drop'].forEach(evt =>
      portfolioDropzone.addEventListener(evt, (e) => { e.preventDefault(); portfolioDropzone.classList.remove('is-dragging'); }));
    portfolioDropzone.addEventListener('drop', (e) => {
      const file = e.dataTransfer.files[0];
      if (file) setSelectedPortfolioFile(file);
    });
    portfolioDropzone.addEventListener('click', () => portfolioFileInput.click());
  }
  portfolioFileInput && portfolioFileInput.addEventListener('change', () => {
    if (portfolioFileInput.files[0]) setSelectedPortfolioFile(portfolioFileInput.files[0]);
  });

  function setSelectedPortfolioFile(file) {
    selectedPortfolioFile = file;
    portfolioFileNameLabel.textContent = `${file.name} — ${(file.size / (1024 * 1024)).toFixed(2)} MB`;
  }

  portfolioForm && portfolioForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    portfolioStatus.textContent = '';
    portfolioStatus.className = 'upload-status';

    const fd = new FormData(portfolioForm);
    const payload = {
      category: fd.get('category'),
      title_ar: fd.get('titleAr'),
      title_fr: fd.get('titleFr') || null,
      title_en: fd.get('titleEn') || null,
      is_published: true,
      created_by: window.Auth.user ? window.Auth.user.id : null
    };

    if (!payload.title_ar || !payload.category) {
      portfolioStatus.textContent = 'العنوان بالعربي والتصنيف مطلوبان.';
      portfolioStatus.classList.add('is-error');
      return;
    }
    if (!selectedPortfolioFile) {
      portfolioStatus.textContent = 'الرجاء اختيار صورة أو فيديو.';
      portfolioStatus.classList.add('is-error');
      return;
    }

    const submitBtn = portfolioForm.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    portfolioStatus.textContent = 'جارٍ الرفع...';
    portfolioProgress.hidden = false;
    portfolioProgress.value = 10;

    try {
      const safeName = selectedPortfolioFile.name.replace(/[^\w.\-]/g, '_');
      const path = `${payload.category}/${Date.now()}_${safeName}`;

      const { error: uploadError } = await window.supabaseClient
        .storage.from(window.APP_CONFIG.PORTFOLIO_BUCKET)
        .upload(path, selectedPortfolioFile, { cacheControl: '3600', upsert: false });
      if (uploadError) throw uploadError;
      portfolioProgress.value = 80;

      const { data: publicData } = window.supabaseClient
        .storage.from(window.APP_CONFIG.PORTFOLIO_BUCKET).getPublicUrl(path);

      payload.media_url = publicData.publicUrl;
      payload.media_type = selectedPortfolioFile.type.startsWith('video') ? 'video' : 'image';
      portfolioProgress.value = 100;

      const { error: insertError } = await window.supabaseClient.from('portfolio_items').insert(payload);
      if (insertError) throw insertError;

      portfolioStatus.textContent = '✔ تمت الإضافة بنجاح.';
      portfolioStatus.classList.add('is-success');
      portfolioForm.reset();
      selectedPortfolioFile = null;
      portfolioFileNameLabel.textContent = '';
      loadPortfolioItems();

    } catch (err) {
      portfolioStatus.textContent = 'خطأ: ' + (err.message || 'تعذّر إتمام العملية.');
      portfolioStatus.classList.add('is-error');
    } finally {
      submitBtn.disabled = false;
      setTimeout(() => { portfolioProgress.hidden = true; portfolioProgress.value = 0; }, 800);
    }
  });

  async function loadPortfolioItems() {
    if (!portfolioItemsBody) return;
    portfolioItemsBody.innerHTML = '<tr><td colspan="4">جارٍ التحميل...</td></tr>';
    const { data, error } = await window.supabaseClient
      .from('portfolio_items').select('*').order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      portfolioItemsBody.innerHTML = '<tr><td colspan="4">لا توجد أعمال بعد.</td></tr>';
      return;
    }

    portfolioItemsBody.innerHTML = data.map(item => `
      <tr>
        <td>${escapeAdminHTML(item.title_ar)}</td>
        <td><span class="soft-badge">${escapeAdminHTML(item.category)}</span></td>
        <td>${item.media_type === 'video' ? '🎬' : '🖼️'}</td>
        <td><button class="btn btn--sm btn--ghost portfolio-delete-btn" data-id="${item.id}">حذف</button></td>
      </tr>
    `).join('');

    portfolioItemsBody.querySelectorAll('.portfolio-delete-btn').forEach(btn => {
      btn.addEventListener('click', () => deletePortfolioItem(btn.dataset.id));
    });
  }

  async function deletePortfolioItem(id) {
    if (!confirm('حذف هذا العمل نهائيًا من المعرض؟')) return;
    const { error } = await window.supabaseClient.from('portfolio_items').delete().eq('id', id);
    if (error) { alert('تعذّر الحذف: ' + error.message); return; }
    loadPortfolioItems();
  }

  // تحميل قائمة المعرض عند أي تغيّر في حالة الدخول
  document.addEventListener('auth:changed', () => {
    if (window.Auth && window.Auth.isAdmin) loadPortfolioItems();
  });
});