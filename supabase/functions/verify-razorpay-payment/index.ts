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

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(signature), (b) => b.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const publishableKeys = JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") || "{}");
    const anonKey = publishableKeys.default;
    const secretKeys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}");
    const serviceKey = secretKeys.default;
    const razorpayKeyId = Deno.env.get("RAZORPAY_KEY_ID")!;
    const razorpaySecret = Deno.env.get("RAZORPAY_KEY_SECRET")!;
    if (!supabaseUrl || !anonKey || !serviceKey || !razorpayKeyId || !razorpaySecret) {
      return json({ error: "Payment service configuration is incomplete." }, 500);
    }

    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "Please sign in before verifying payment." }, 401);

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: authData, error: authError } = await authClient.auth.getUser(token);
    if (authError || !authData.user) return json({ error: "Your login session is invalid. Please sign in again." }, 401);
    const user = authData.user;

    const body = await req.json().catch(() => ({}));
    const orderId = typeof body.razorpay_order_id === "string" ? body.razorpay_order_id : "";
    const paymentId = typeof body.razorpay_payment_id === "string" ? body.razorpay_payment_id : "";
    const signature = typeof body.razorpay_signature === "string" ? body.razorpay_signature : "";
    if (!orderId || !paymentId || !/^[a-f0-9]{64}$/i.test(signature)) {
      return json({ error: "Payment verification details are incomplete." }, 400);
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: purchase, error: purchaseError } = await admin
      .from("purchases")
      .select("id,user_id,prompt_id,amount,currency,status,razorpay_order_id,razorpay_payment_id")
      .eq("razorpay_order_id", orderId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (purchaseError || !purchase) return json({ error: "No matching purchase was found for this account." }, 404);

    const expectedSignature = await hmacSha256Hex(razorpaySecret, `${orderId}|${paymentId}`);
    if (!constantTimeEqual(expectedSignature, signature.toLowerCase())) {
      return json({ error: "Payment signature verification failed." }, 400);
    }

    const basic = btoa(`${razorpayKeyId}:${razorpaySecret}`);
    const paymentResponse = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`, {
      headers: { "Authorization": `Basic ${basic}` },
    });
    const payment = await paymentResponse.json();
    if (!paymentResponse.ok || payment.order_id !== orderId) {
      return json({ error: "Could not confirm this payment with Razorpay. Please check My Purchases or contact support; do not pay again." }, 502);
    }

    const expectedPaise = Number(purchase.amount) * 100;
    if (payment.amount !== expectedPaise || payment.currency !== "INR") {
      return json({ error: "The payment amount does not match this purchase. Please contact support." }, 400);
    }
    if (!["captured", "authorized"].includes(payment.status)) {
      return json({ error: "Razorpay has not confirmed a successful payment yet. Please check My Purchases before retrying." }, 409);
    }

    if (purchase.status !== "paid" && purchase.status !== "completed") {
      if (payment.status !== "captured") {
        return json({ error: "Payment is authorized but not captured yet. Please wait and check My Purchases." }, 409);
      }
      const { error: updateError } = await admin
        .from("purchases")
        .update({ status: "paid", razorpay_payment_id: paymentId })
        .eq("id", purchase.id)
        .eq("user_id", user.id);
      if (updateError) {
        console.error("Purchase status update failed:", updateError);
        return json({ error: "Payment was confirmed, but unlock recording is delayed. Please contact support; do not pay again." }, 500);
      }
    } else if (purchase.razorpay_payment_id && purchase.razorpay_payment_id !== paymentId) {
      return json({ error: "This purchase is already linked to a different payment. Please contact support." }, 409);
    }

    const { data: content, error: contentError } = await admin
      .from("prompt_content")
      .select("prompt_text")
      .eq("prompt_id", purchase.prompt_id)
      .maybeSingle();
    if (contentError || !content?.prompt_text) {
      console.error("Paid prompt content missing:", contentError);
      return json({
        verified: true,
        prompt_text: null,
        warning: "Payment verified. Your purchase is saved, but the prompt content could not be loaded. Contact support; do not pay again.",
      });
    }

    return json({ verified: true, prompt_text: content.prompt_text, warning: "Payment verified. Your prompt is unlocked." });
  } catch (error) {
    console.error("verify-razorpay-payment error:", error);
    return json({ error: "Unexpected error while verifying payment. Please check My Purchases before retrying." }, 500);
  }
});
