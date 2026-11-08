import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID")!;
    const razorpaySecret = Deno.env.get("RAZORPAY_KEY_SECRET")!;
    if (!supabaseUrl || !anonKey || !serviceKey || !razorpayKeyId || !razorpaySecret) {
      return json({ error: "Payment service configuration is incomplete." }, 500);
    }

    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "Please sign in before purchasing." }, 401);

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: authData, error: authError } = await authClient.auth.getUser(token);
    if (authError || !authData.user) return json({ error: "Your login session is invalid. Please sign in again." }, 401);
    const user = authData.user;

    const body = await req.json().catch(() => ({}));
    const promptTitle = typeof body.prompt_title === "string" ? body.prompt_title.trim() : "";
    if (!promptTitle || promptTitle.length > 200) return json({ error: "A valid prompt title is required." }, 400);

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: prompt, error: promptError } = await admin
      .from("prompts")
      .select("id,title,price,active")
      .eq("title", promptTitle)
      .eq("active", true)
      .maybeSingle();
    if (promptError || !prompt) return json({ error: "This prompt is unavailable. Please refresh the page." }, 404);

    const { data: existing } = await admin
      .from("purchases")
      .select("id,status")
      .eq("user_id", user.id)
      .eq("prompt_id", prompt.id)
      .in("status", ["paid", "completed"])
      .limit(1)
      .maybeSingle();

    if (existing) {
      const { data: content } = await admin
        .from("prompt_content")
        .select("prompt_text")
        .eq("prompt_id", prompt.id)
        .maybeSingle();
      return json({
        already_purchased: true,
        prompt_title: prompt.title,
        prompt_text: content?.prompt_text || null,
      });
    }

    const rupees = Number(prompt.price);
    if (!Number.isInteger(rupees) || rupees < 1 || rupees > 100000) {
      return json({ error: "The prompt price is not configured correctly." }, 500);
    }
    const amountPaise = rupees * 100;

    const basic = btoa(`${razorpayKeyId}:${razorpaySecret}`);
    const orderResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${basic}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: "INR",
        receipt: `df_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`,
        notes: { user_id: user.id, prompt_id: prompt.id },
      }),
    });
    const order = await orderResponse.json();
    if (!orderResponse.ok || !order.id) {
      console.error("Razorpay order creation failed:", order);
      return json({ error: "Could not create the payment order. Please try again later." }, 502);
    }

    const { error: insertError } = await admin.from("purchases").insert({
      user_id: user.id,
      prompt_id: prompt.id,
      amount: rupees,
      currency: "INR",
      status: "pending",
      razorpay_order_id: order.id,
    });
    if (insertError) {
      console.error("Pending purchase insert failed:", insertError);
      return json({ error: "Could not save the pending purchase. Please contact support before retrying." }, 500);
    }

    return json({
      order_id: order.id,
      key_id: razorpayKeyId,
      amount: order.amount,
      currency: order.currency,
      prompt_title: prompt.title,
      customer_email: user.email || "",
    });
  } catch (error) {
    console.error("create-razorpay-order error:", error);
    return json({ error: "Unexpected error while starting payment." }, 500);
  }
});
