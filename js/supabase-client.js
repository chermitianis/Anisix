/* =========================================================
   تهيئة الاتصال بقاعدة بيانات Supabase
   ========================================================= */

(function () {
  const config = window.APP_CONFIG || {};

  // التحقق مما إذا كانت مفاتيح Supabase مكيّفة وليست القيم الافتراضية
  window.isSupabaseConfigured = function () {
    return (
      config.SUPABASE_URL &&
      config.SUPABASE_ANON_KEY &&
      !config.SUPABASE_URL.includes('YOUR_PROJECT_ID') &&
      !config.SUPABASE_ANON_KEY.includes('YOUR_ANON_PUBLIC_KEY')
    );
  };

  if (window.isSupabaseConfigured()) {
    if (typeof supabase !== 'undefined') {
      window.supabaseClient = supabase.createClient(
        config.SUPABASE_URL,
        config.SUPABASE_ANON_KEY
      );
    } else {
      console.error('مكتبة Supabase SDK لم تُحمل بعد.');
    }
  } else {
    console.warn('تنبيه: لم يتم ضبط مفاتيح Supabase بعد في js/config.js');
    window.supabaseClient = null;
  }
})();