// =========================================================
// get-download-url — Edge Function آمنة لتوليد روابط تحميل مؤقتة
// =========================================================
// لماذا هذه الدالة ضرورية؟
// باكِت "software-files" أصبح خاصًا (private). لا يمكن لأي شخص
// الوصول للملفات مباشرة برابط عام. هذه الدالة الوحيدة المخوّلة
// (عبر service_role الذي لا يُكشف أبدًا للمتصفح) بتوليد رابط
// تحميل صالح لمدة 60 ثانية فقط، وبعد التحقق من:
//   1) أن المستخدم مسجّل دخوله فعليًا (JWT صالح).
//   2) أن العنصر المطلوب منشور (is_published = true).
//   3) أن خطة اشتراك المستخدم (free/pro/enterprise) تسمح بتحميله.
// كما تسجّل كل عملية تحميل في جدول download_logs للتدقيق الأمني،
// وتزيد عدّاد التحميلات download_count.
//
// النشر: supabase functions deploy get-download-url
// =========================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PLAN_RANK: Record<string, number> = { free: 0, pro: 1, enterprise: 2 };

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return json({ error: "Méthode non autorisée" }, 405);
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Authentification requise." }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // عميل يتحقق من هوية المستخدم عبر الـ JWT المُرسَل من المتصفح
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return json({ error: "جلسة غير صالحة. الرجاء تسجيل الدخول من جديد." }, 401);
    }
    const user = userData.user;

    const body = await req.json().catch(() => ({}));
    const itemId = body?.itemId;
    if (!itemId || typeof itemId !== "string") {
      return json({ error: "معرّف العنصر غير صالح." }, 400);
    }

    // عميل بصلاحيات كاملة (service role) — يُستخدم فقط داخل الخادم، أبدًا في المتصفح
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const [{ data: profile }, { data: item, error: itemErr }] = await Promise.all([
      adminClient.from("profiles").select("subscription_plan, is_admin").eq("id", user.id).single(),
      adminClient
        .from("software_items")
        .select("id, file_url, is_published, required_plan")
        .eq("id", itemId)
        .single(),
    ]);

    if (itemErr || !item) {
      return json({ error: "العنصر غير موجود." }, 404);
    }
    if (!item.is_published) {
      return json({ error: "هذا العنصر غير متاح حاليًا." }, 403);
    }
    if (!item.file_url) {
      return json({ error: "لا يوجد ملف مرتبط بهذا العنصر." }, 404);
    }

    const userPlan = profile?.subscription_plan ?? "free";
    const isAdmin = profile?.is_admin === true;
    const requiredRank = PLAN_RANK[item.required_plan ?? "free"] ?? 0;
    const userRank = PLAN_RANK[userPlan] ?? 0;

    if (!isAdmin && userRank < requiredRank) {
      return json(
        {
          error: "upgrade_required",
          message: "هذا الملف يتطلب اشتراك Pro أو أعلى. تواصل معنا للترقية.",
        },
        403
      );
    }

    // توليد رابط موقّع صالح لمدة 60 ثانية فقط
    const { data: signed, error: signErr } = await adminClient.storage
      .from("software-files")
      .createSignedUrl(item.file_url, 60);

    if (signErr || !signed) {
      return json({ error: "تعذّر توليد رابط التحميل." }, 500);
    }

    // تسجيل العملية للتدقيق + زيادة العدّاد (لا تفشل الطلب إن حدث خطأ هنا)
    await adminClient.from("download_logs").insert({ user_id: user.id, item_id: item.id });
    await adminClient.rpc("increment_download_count", { p_item_id: item.id }).catch(() => {});

    return json({ url: signed.signedUrl, expiresIn: 60 });
  } catch (e) {
    console.error(e);
    return json({ error: "خطأ داخلي في الخادم." }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}
