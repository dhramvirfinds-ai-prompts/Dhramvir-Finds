// Dhramvir Finds — Viral AI Prompts
// Supabase-powered front-end
// Real Razorpay payment will be connected in the next step.

(function () {
  "use strict";

  const promptCache = {};
  let currentUser = null;
  let supportEmail = "";

  // --------------------------------------------------
  // HELPERS
  // --------------------------------------------------

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatDate(value) {
    if (!value) return "-";

    try {
      return new Date(value).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short"
      });
    } catch {
      return value;
    }
  }

  function showLoginModal() {
    const modal = document.getElementById("loginModal");

    if (modal) {
      modal.style.display = "flex";
    }
  }

  function closeContentModal() {
    const modal =
      document.getElementById("df-content-modal");

    if (modal) {
      modal.style.display = "none";
    }
  }

  function openContent(title, html) {
    const titleEl =
      document.getElementById("df-content-title");

    const bodyEl =
      document.getElementById("df-content-body");

    const modal =
      document.getElementById("df-content-modal");

    if (!titleEl || !bodyEl || !modal) {
      return;
    }

    titleEl.innerText = title;
    bodyEl.innerHTML = html;

    modal.style.display = "flex";
  }

  async function getLoggedInUser() {
    const { data, error } =
      await supabaseClient.auth.getUser();

    if (error) {
      console.error(
        "getUser error:",
        error
      );

      return null;
    }

    return data?.user || null;
  }

  // --------------------------------------------------
  // PROMPTS
  // --------------------------------------------------

  async function loadPrompts() {
    const { data, error } =
      await supabaseClient
        .from("prompts")
        .select(`
          id,
          title,
          ai,
          category,
          price,
          description,
          thumbnail_url,
          demo_video_url,
          active
        `)
        .eq("active", true)
        .order("created_at", {
          ascending: false
        });

    if (error) {
      console.error(
        "Prompts load error:",
        error
      );

      return [];
    }

    (data || []).forEach(function (item) {
      promptCache[item.title] = item;
    });

    return data || [];
  }

  async function getPromptByTitle(title) {
    if (promptCache[title]) {
      return promptCache[title];
    }

    const { data, error } =
      await supabaseClient
        .from("prompts")
        .select(`
          id,
          title,
          ai,
          category,
          price,
          description,
          thumbnail_url,
          demo_video_url,
          active
        `)
        .eq("title", title)
        .eq("active", true)
        .maybeSingle();

    if (error) {
      console.error(
        "Prompt error:",
        error
      );

      return null;
    }

    if (data) {
      promptCache[title] = data;
    }

    return data;
  }

  // --------------------------------------------------
  // UNLOCK BUTTON
  // --------------------------------------------------

  window.unlock = async function (name) {

    const user =
      await getLoggedInUser();

    if (!user) {
      showLoginModal();
      return;
    }

    const prompt =
      await getPromptByTitle(name);

    if (!prompt) {
      alert(
        "Ye prompt abhi available nahi hai."
      );

      return;
    }

    const oldModal =
      document.getElementById(
        "df-payment-modal"
      );

    if (oldModal) {
      oldModal.remove();
    }

    const price =
      Number(prompt.price || 9);

    const modal =
      document.createElement("div");

    modal.id =
      "df-payment-modal";

    modal.innerHTML = `
      <div class="df-overlay">

        <div class="df-modal">

          <button
            class="df-close"
            onclick="closePayment()">
            ×
          </button>

          <div class="df-logo">
            DF
          </div>

          <h2>
            Unlock Prompt
          </h2>

          <p class="df-prompt-name">
            ${escapeHtml(prompt.title)}
          </p>

          <div class="df-price">
            ₹${price}
          </div>

          <p class="df-small">
            One-time payment
          </p>

          <div class="df-payment-title">
            Choose payment method
          </div>

          <button
            class="df-pay-option"
            onclick="demoPayment('UPI')">

            <span>
              📱
            </span>

            <span>
              <b>
                UPI
              </b>

              <small>
                Google Pay / PhonePe / Paytm
              </small>
            </span>

          </button>

          <button
            class="df-pay-option"
            onclick="demoPayment('QR Code')">

            <span>
              ▣
            </span>

            <span>
              <b>
                QR Code
              </b>

              <small>
                Scan and pay ₹${price}
              </small>
            </span>

          </button>

          <button
            class="df-pay-option"
            onclick="demoPayment('Net Banking')">

            <span>
              🏦
            </span>

            <span>
              <b>
                Net Banking
              </b>

              <small>
                Pay using your bank
              </small>
            </span>

          </button>

          <div class="df-demo-note">
            Razorpay payment gateway will be connected in the next step.
          </div>

        </div>

      </div>
    `;

    document.body.appendChild(modal);

    addModalStyles();
  };

  // --------------------------------------------------
  // DEMO PAYMENT
  // --------------------------------------------------

  window.demoPayment = function (method) {

    const modal =
      document.getElementById(
        "df-payment-modal"
      );

    if (!modal) {
      return;
    }

    const promptName =
      modal.querySelector(
        ".df-prompt-name"
      )?.innerText || "";

    const prompt =
      promptCache[promptName];

    const price =
      Number(prompt?.price || 9);

    const box =
      modal.querySelector(
        ".df-modal"
      );

    if (!box) {
      return;
    }

    box.innerHTML = `
      <button
        class="df-close"
        onclick="closePayment()">
        ×
      </button>

      <div class="df-logo">
        DF
      </div>

      <h2>
        Payment Gateway
      </h2>

      <div class="df-price">
        ₹${price}
      </div>

      <p>
        Selected payment method:
        <b>
          ${escapeHtml(method)}
        </b>
      </p>

      <div class="df-demo-box">

        <div class="df-demo-icon">
          💳
        </div>

        <h3>
          Razorpay will be connected here
        </h3>

        <p>
          This is currently a design/testing screen.
          No real payment has been made.
        </p>

      </div>

      <button
        class="df-demo-success"
        onclick="showPaymentTestResult()">

        Continue Test

      </button>

      <p class="df-small">
        Testing only. This does not unlock or create a purchase.
      </p>
    `;
  };

  // --------------------------------------------------
  // PAYMENT TEST RESULT
  // --------------------------------------------------

  window.showPaymentTestResult = function () {

    const modal =
      document.getElementById(
        "df-payment-modal"
      );

    if (!modal) {
      return;
    }

    const box =
      modal.querySelector(
        ".df-modal"
      );

    if (!box) {
      return;
    }

    box.innerHTML = `
      <button
        class="df-close"
        onclick="closePayment()">
        ×
      </button>

      <div class="df-demo-icon">
        🧪
      </div>

      <h2>
        Payment Test Complete
      </h2>

      <div class="df-demo-box">

        <h3>
          Real payment is not connected yet
        </h3>

        <p>
          Razorpay connection will be added next.
          Until then, this test does not create a purchase
          and does not reveal paid prompt content.
        </p>

      </div>

      <button
        class="df-demo-success"
        onclick="closePayment()">

        Close

      </button>
    `;
  };

  // --------------------------------------------------
  // REAL PURCHASE CHECK
  // --------------------------------------------------

  async function hasPaidPurchase(
    userId,
    promptId
  ) {

    const { data, error } =
      await supabaseClient
        .from("purchases")
        .select("id,status")
        .eq("user_id", userId)
        .eq("prompt_id", promptId)
        .eq("status", "paid")
        .limit(1);

    if (error) {
      console.error(
        "Purchase check error:",
        error
      );

      return false;
    }

    return (
      Array.isArray(data) &&
      data.length > 0
    );
  }

  // --------------------------------------------------
  // SHOW UNLOCKED PROMPT
  // --------------------------------------------------

  window.showUnlockedPrompt =
    async function (name) {

      const user =
        await getLoggedInUser();

      if (!user) {
        closePayment();
        showLoginModal();

        return;
      }

      const prompt =
        await getPromptByTitle(name);

      if (!prompt) {
        alert(
          "Prompt nahi mila."
        );

        return;
      }

      const paid =
        await hasPaidPurchase(
          user.id,
          prompt.id
        );

      if (!paid) {
        alert(
          "Is prompt ka successful payment abhi record nahi hai."
        );

        return;
      }

      const { data, error } =
        await supabaseClient
          .from("prompt_content")
          .select("prompt_text")
          .eq("prompt_id", prompt.id)
          .maybeSingle();

      if (error) {
        console.error(
          "Prompt content error:",
          error
        );

        alert(
          "Prompt content abhi access nahi ho pa raha hai. " +
          "Supabase access policy check karein."
        );

        return;
      }

      if (
        !data ||
        !data.prompt_text
      ) {
        alert(
          "Paid prompt content abhi available nahi hai."
        );

        return;
      }

      const modal =
        document.getElementById(
          "df-payment-modal"
        );

      if (!modal) {
        return;
      }

      const box =
        modal.querySelector(
          ".df-modal"
        );

      if (!box) {
        return;
      }

      box.innerHTML = `
        <button
          class="df-close"
          onclick="closePayment()">
          ×
        </button>

        <div class="df-success">
          ✓
        </div>

        <h2>
          Prompt Unlocked
        </h2>

        <p class="df-prompt-name">
          ${escapeHtml(prompt.title)}
        </p>

        <div class="df-ai">
          Works with:
          <b>
            ${escapeHtml(prompt.ai || "-")}
          </b>
        </div>

        <textarea
          id="df-prompt-text"
          class="df-prompt-box"
          readonly>${escapeHtml(data.prompt_text)}</textarea>

        <button
          class="df-copy-button"
          onclick="copyPrompt()">

          📋 Copy Prompt

        </button>

        <p
          id="df-copy-message"
          class="df-copy-message">
        </p>
      `;
    };

  // --------------------------------------------------
  // COPY PROMPT
  // --------------------------------------------------

  window.copyPrompt = function () {

    const box =
      document.getElementById(
        "df-prompt-text"
      );

    if (!box) {
      return;
    }

    const text =
      box.value;

    if (
      navigator.clipboard &&
      navigator.clipboard.writeText
    ) {

      navigator.clipboard
        .writeText(text)
        .then(function () {

          const message =
            document.getElementById(
              "df-copy-message"
            );

          if (message) {
            message.innerText =
              "✓ Prompt copied successfully!";
          }

        })
        .catch(function () {

          fallbackCopy(box);

        });

      return;
    }

    fallbackCopy(box);
  };

  function fallbackCopy(box) {

    box.focus();
    box.select();

    try {

      document.execCommand("copy");

      const message =
        document.getElementById(
          "df-copy-message"
        );

      if (message) {
        message.innerText =
          "✓ Prompt copied successfully!";
      }

    } catch (error) {

      alert(
        "Prompt copy nahi ho paya."
      );

    }
  }

  // --------------------------------------------------
  // CLOSE PAYMENT
  // --------------------------------------------------

  window.closePayment = function () {

    const modal =
      document.getElementById(
        "df-payment-modal"
      );

    if (modal) {
      modal.remove();
    }
  };

  // --------------------------------------------------
  // SITE SETTINGS
  // --------------------------------------------------

  async function loadSiteSettings() {

    const { data, error } =
      await supabaseClient
        .from("site_settings")
        .select(`
          site_name,
          support_email,
          support_phone,
          logo_url,
          background_url,
          primary_color,
          secondary_color
        `)
        .limit(1)
        .maybeSingle();

    if (error) {

      console.error(
        "Site settings error:",
        error
      );

      return null;
    }

    if (!data) {
      return null;
    }

    supportEmail =
      data.support_email || "";

    applySiteSettings(data);

    return data;
  }

  function applySiteSettings(settings) {

    if (settings.site_name) {

      document.title =
        settings.site_name +
        " — Viral AI Prompts";

      document
        .querySelectorAll(".brand b")
        .forEach(function (el) {

          el.innerText =
            settings.site_name;

        });

      document
        .querySelectorAll("footer b")
        .forEach(function (el) {

          el.innerText =
            settings.site_name;

        });
    }

    if (settings.logo_url) {

      const logos =
        document.querySelectorAll(
          ".logo"
        );

      logos.forEach(function (el) {

        el.style.backgroundImage =
          `url("${settings.logo_url}")`;

        el.style.backgroundSize =
          "cover";

        el.style.backgroundPosition =
          "center";

        el.innerText = "";

      });
    }

    if (settings.background_url) {

      document.body.style.backgroundImage =
        `url("${settings.background_url}")`;

      document.body.style.backgroundSize =
        "cover";

      document.body.style.backgroundAttachment =
        "fixed";
    }

    if (settings.primary_color) {

      document.documentElement.style
        .setProperty(
          "--df-primary",
          settings.primary_color
        );
    }

    if (settings.secondary_color) {

      document.documentElement.style
        .setProperty(
          "--df-secondary",
          settings.secondary_color
        );
    }
  }

  // --------------------------------------------------
  // CUSTOMER SUPPORT STYLES
  // --------------------------------------------------

  function addSupportStyles() {

    if (
      document.getElementById(
        "df-support-styles"
      )
    ) {
      return;
    }

    const style =
      document.createElement("style");

    style.id =
      "df-support-styles";

    style.innerHTML = `

      .df-support-form {
        text-align:left;
      }

      .df-support-label {
        display:block;
        margin:14px 0 6px;
        color:#111827;
        font-size:13px;
        font-weight:700;
      }

      .df-support-input,
      .df-support-textarea {
        width:100%;
        box-sizing:border-box;
        border:1px solid #e1e4e8;
        border-radius:12px;
        padding:12px;
        font-size:14px;
        outline:none;
        background:#fff;
      }

      .df-support-textarea {
        min-height:120px;
        resize:vertical;
        line-height:1.5;
      }

      .df-support-input:focus,
      .df-support-textarea:focus {
        border-color:#111827;
      }

      .df-support-submit {
        width:100%;
        border:0;
        background:#111827;
        color:#fff;
        border-radius:13px;
        padding:14px;
        margin-top:16px;
        font-size:15px;
        font-weight:700;
        cursor:pointer;
      }

      .df-support-submit:disabled {
        opacity:.6;
        cursor:not-allowed;
      }

      .df-support-email {
        margin:0 0 15px;
        padding:12px;
        background:#f5f7fb;
        border-radius:12px;
        font-size:13px;
        color:#374151;
        word-break:break-word;
      }

      .df-ticket {
        border:1px solid #e5e7eb;
        border-radius:14px;
        padding:13px;
        margin-top:10px;
        background:#fff;
      }

      .df-ticket-head {
        display:flex;
        justify-content:space-between;
        gap:10px;
        align-items:flex-start;
      }

      .df-ticket-title {
        color:#111827;
        font-weight:800;
        font-size:14px;
      }

      .df-ticket-status {
        display:inline-block;
        padding:4px 8px;
        border-radius:20px;
        background:#f1f5f9;
        color:#475569;
        font-size:11px;
        font-weight:700;
        text-transform:capitalize;
      }

      .df-ticket-message {
        margin-top:9px;
        color:#4b5563;
        font-size:13px;
        line-height:1.5;
        white-space:pre-wrap;
        word-break:break-word;
      }

      .df-ticket-date {
        margin-top:9px;
        color:#9ca3af;
        font-size:11px;
      }

      .df-support-empty {
        text-align:center;
        padding:20px 10px;
        background:#f5f7fb;
        border-radius:14px;
        color:#6b7280;
        font-size:13px;
      }

      .df-support-link {
        display:inline-block;
        color:#111827;
        font-weight:700;
        text-decoration:none;
      }

      .df-support-link:hover {
        text-decoration:underline;
      }

    `;

    document.head.appendChild(style);
  }

  // --------------------------------------------------
  // CUSTOMER SUPPORT
  // --------------------------------------------------

  async function openSupportForm() {

    const user =
      await getLoggedInUser();

    if (!user) {
      showLoginModal();
      return;
    }

    addSupportStyles();

    const email =
      user.email ||
      supportEmail ||
      "Email not available";

    openContent(
      "🆘 Customer Support",
      `

        <div class="df-support-form">

          <div class="df-support-email">

            Support:

            ${
              supportEmail
                ? `
                  <a
                    class="df-support-link"
                    href="mailto:${escapeHtml(supportEmail)}">

                    ${escapeHtml(supportEmail)}

                  </a>
                `
                : "Email not configured yet."
            }

          </div>

          <label class="df-support-label">
            Your email
          </label>

          <input
            id="df-support-email-input"
            class="df-support-input"
            value="${escapeHtml(email)}"
            readonly>

          <label class="df-support-label">
            Subject
          </label>

          <input
            id="df-support-subject"
            class="df-support-input"
            maxlength="120"
            placeholder="Example: Purchased prompt issue">

          <label class="df-support-label">
            Message
          </label>

          <textarea
            id="df-support-message"
            class="df-support-textarea"
            maxlength="2000"
            placeholder="Describe your problem..."></textarea>

          <button
            id="df-support-submit"
            class="df-support-submit"
            type="button">

            Send Support Ticket

          </button>

        </div>

      `
    );

    const submit =
      document.getElementById(
        "df-support-submit"
      );

    if (submit) {

      submit.addEventListener(
        "click",
        submitSupportTicket
      );

    }
  }

  async function submitSupportTicket() {

    const user =
      await getLoggedInUser();

    if (!user) {
      showLoginModal();
      return;
    }

    const subject =
      document
        .getElementById(
          "df-support-subject"
        )
        ?.value
        .trim();

    const message =
      document
        .getElementById(
          "df-support-message"
        )
        ?.value
        .trim();

    const button =
      document.getElementById(
        "df-support-submit"
      );

    if (!subject) {

      alert(
        "Subject likhiye."
      );

      return;
    }

    if (!message) {

      alert(
        "Message likhiye."
      );

      return;
    }

    if (button) {

      button.disabled = true;

      button.innerText =
        "Sending...";

    }

    const { error } =
      await supabaseClient
        .from("support_tickets")
        .insert({

          user_id:
            user.id,

          email:
            user.email || "",

          subject:
            subject,

          message:
            message,

          status:
            "open"

        });

    if (error) {

      console.error(
        "Support ticket error:",
        error
      );

      alert(
        "Support ticket send nahi ho paya. " +
        "Please try again."
      );

      if (button) {

        button.disabled =
          false;

        button.innerText =
          "Send Support Ticket";

      }

      return;
    }

    alert(
      "Support ticket successfully send ho gaya."
    );

    await openMyTickets();
  }

  async function openMyTickets() {

    const user =
      await getLoggedInUser();

    if (!user) {
      showLoginModal();
      return;
    }

    const { data, error } =
      await supabaseClient
        .from("support_tickets")
        .select(`
          id,
          subject,
          message,
          status,
          created_at,
          updated_at
        `)
        .eq(
          "user_id",
          user.id
        )
        .order(
          "created_at",
          {
            ascending:false
          }
        );

    if (error) {

      console.error(
        "Ticket list error:",
        error
      );

      openContent(
        "🎫 My Support Tickets",
        `

          <div class="df-support-empty">

            Tickets load nahi ho pa rahe hain.

          </div>

        `
      );

      return;
    }

    if (
      !data ||
      data.length === 0
    ) {

      openContent(
        "🎫 My Support Tickets",
        `

          <div class="df-support-empty">

            Abhi koi support ticket nahi hai.

          </div>

        `
      );

      return;
    }

    const ticketsHtml =
      data.map(
        function (ticket) {

          return `

            <div class="df-ticket">

              <div class="df-ticket-head">

                <div class="df-ticket-title">
                  ${escapeHtml(ticket.subject)}
                </div>

                <span class="df-ticket-status">
                  ${escapeHtml(
                    ticket.status || "open"
                  )}
                </span>

              </div>

              <div class="df-ticket-message">
                ${escapeHtml(ticket.message)}
              </div>

              <div class="df-ticket-date">

                Created:
                ${escapeHtml(
                  formatDate(ticket.created_at)
                )}

              </div>

            </div>

          `;

        }
      ).join("");

    openContent(
      "🎫 My Support Tickets",
      ticketsHtml
    );
  }

  // --------------------------------------------------
  // PURCHASES
  // --------------------------------------------------

  async function openMyPurchases() {

    const user =
      await getLoggedInUser();

    if (!user) {
      showLoginModal();
      return;
    }

    let data = null;

    let {
      data: purchaseData,
      error
    } =
      await supabaseClient
        .from("purchases")
        .select(`
          user_id,
          prompt_id,
          amount,
          currency,
          status,
          razorpay_order_id,
          razorpay_payment_id,
          created_at,
          prompts (
            title,
            ai
          )
        `)
        .eq(
          "user_id",
          user.id
        )
        .order(
          "created_at",
          {
            ascending:false
          }
        );

    if (!error) {

      data =
        purchaseData || [];

    } else {

      console.error(
        "Purchase join error, using fallback:",
        error
      );

      const fallback =
        await supabaseClient
          .from("purchases")
          .select(`
            user_id,
            prompt_id,
            amount,
            currency,
            status,
            razorpay_order_id,
            razorpay_payment_id,
            created_at
          `)
          .eq(
            "user_id",
            user.id
          )
          .order(
            "created_at",
            {
              ascending:false
            }
          );

      if (fallback.error) {

        console.error(
          "Purchase fallback error:",
          fallback.error
        );

        openContent(
          "🎫 My Purchases",
          `

            <div class="df-support-empty">

              Purchases load nahi ho pa rahe hain.

            </div>

          `
        );

        return;
      }

      data =
        fallback.data || [];

      for (
        const purchase of data
      ) {

        const prompt =
          await supabaseClient
            .from("prompts")
            .select(
              "title,ai"
            )
            .eq(
              "id",
              purchase.prompt_id
            )
            .maybeSingle();

        purchase.prompts =
          prompt.data || null;
      }
    }

    if (
      !data ||
      data.length === 0
    ) {

      openContent(
        "🎫 My Purchases",
        `

          <div class="df-empty-purchases">

            <div class="df-empty-purchases-icon">
              🛒
            </div>

            <h3>
              No purchases yet
            </h3>

            <p>
              Your purchased prompts will appear here
              after a successful payment.
            </p>

          </div>

        `
      );

      return;
    }

    const html =
      data.map(
        function (purchase) {

          const prompt =
            purchase.prompts || {};

          return `

            <div class="df-ticket">

              <div class="df-ticket-head">

                <div class="df-ticket-title">
                  ${escapeHtml(
                    prompt.title || "Prompt"
                  )}
                </div>

                <span class="df-ticket-status">
                  ${escapeHtml(
                    purchase.status || "pending"
                  )}
                </span>

              </div>

              <div class="df-ticket-message">

                Amount:
                ₹${escapeHtml(
                  purchase.amount ?? 0
                )}
                ${escapeHtml(
                  purchase.currency || "INR"
                )}

              </div>

              ${
                prompt.ai
                  ? `
                    <div class="df-ticket-date">

                      AI:
                      ${escapeHtml(
                        prompt.ai
                      )}

                    </div>
                  `
                  : ""
              }

              <div class="df-ticket-date">

                Purchased:
                ${escapeHtml(
                  formatDate(
                    purchase.created_at
                  )
                )}

              </div>

            </div>

          `;

        }
      ).join("");

    openContent(
      "🎫 My Purchases",
      html
    );
  }

  // --------------------------------------------------
  // UNLOCKED PROMPTS
  // --------------------------------------------------

  async function openMyUnlockedPrompts() {

    const user =
      await getLoggedInUser();

    if (!user) {
      showLoginModal();
      return;
    }

    const {
      data: purchases,
      error
    } =
      await supabaseClient
        .from("purchases")
        .select(
          "prompt_id,created_at"
        )
        .eq(
          "user_id",
          user.id
        )
        .eq(
          "status",
          "paid"
        )
        .order(
          "created_at",
          {
            ascending:false
          }
        );

    if (error) {

      console.error(
        "Unlocked prompts error:",
        error
      );

      openContent(
        "🔓 My Unlocked Prompts",
        `

          <div class="df-support-empty">

            Unlocked prompts load nahi ho pa rahe hain.

          </div>

        `
      );

      return;
    }

    if (
      !purchases ||
      purchases.length === 0
    ) {

      openContent(
        "🔓 My Unlocked Prompts",
        `

          <div class="df-empty-purchases">

            <div class="df-empty-purchases-icon">
              🔓
            </div>

            <h3>
              No unlocked prompts yet
            </h3>

            <p>
              Your unlocked prompts will appear here
              after a successful purchase.
            </p>

          </div>

        `
      );

      return;
    }

    const uniqueIds = [
      ...new Set(
        purchases.map(
          function (item) {
            return item.prompt_id;
          }
        )
      )
    ];

    const {
      data: promptsData,
      error: promptsError
    } =
      await supabaseClient
        .from("prompts")
        .select(`
          id,
          title,
          ai,
          price
        `)
        .in(
          "id",
          uniqueIds
        );

    if (promptsError) {

      console.error(
        "Unlocked prompt details error:",
        promptsError
      );

      openContent(
        "🔓 My Unlocked Prompts",
        `

          <div class="df-support-empty">

            Prompt details load nahi ho pa rahe hain.

          </div>

        `
      );

      return;
    }

    const promptMap = {};

    (
      promptsData || []
    ).forEach(
      function (item) {

        promptMap[item.id] =
          item;

      }
    );

    const html =
      purchases.map(
        function (purchase) {

          const prompt =
            promptMap[
              purchase.prompt_id
            ];

          if (!prompt) {
            return "";
          }

          return `

            <div class="df-ticket">

              <div class="df-ticket-head">

                <div class="df-ticket-title">
                  ${escapeHtml(
                    prompt.title
                  )}
                </div>

                <span class="df-ticket-status">
                  Unlocked
                </span>

              </div>

              <div class="df-ticket-message">

                Works with:
                ${escapeHtml(
                  prompt.ai || "-"
                )}

              </div>

              <button
                class="df-support-submit"
                type="button"
                onclick="openPaidPromptById('${escapeHtml(
                  prompt.id
                )}')">

                Open Prompt

              </button>

            </div>

          `;

        }
      ).join("");

    openContent(
      "🔓 My Unlocked Prompts",
      html
    );
  }

  // --------------------------------------------------
  // OPEN PAID PROMPT BY ID
  // --------------------------------------------------

  window.openPaidPromptById =
    async function (promptId) {

      const user =
        await getLoggedInUser();

      if (!user) {
        showLoginModal();
        return;
      }

      const {
        data: prompt,
        error: promptError
      } =
        await supabaseClient
          .from("prompts")
          .select(
            "id,title,ai"
          )
          .eq(
            "id",
            promptId
          )
          .maybeSingle();

      if (
        promptError ||
        !prompt
      ) {

        alert(
          "Prompt nahi mila."
        );

        return;
      }

      const paid =
        await hasPaidPurchase(
          user.id,
          promptId
        );

      if (!paid) {

        alert(
          "Is prompt ka paid access nahi mila."
        );

        return;
      }

      const {
        data: content,
        error
      } =
        await supabaseClient
          .from("prompt_content")
          .select(
            "prompt_text"
          )
          .eq(
            "prompt_id",
            promptId
          )
          .maybeSingle();

      if (error) {

        console.error(
          "Paid content error:",
          error
        );

        alert(
          "Prompt content access nahi ho pa raha hai. " +
          "Supabase RLS policy check karein."
        );

        return;
      }

      if (
        !content?.prompt_text
      ) {

        alert(
          "Prompt content available nahi hai."
        );

        return;
      }

      const oldModal =
        document.getElementById(
          "df-payment-modal"
        );

      if (oldModal) {
        oldModal.remove();
      }

      const modal =
        document.createElement(
          "div"
        );

      modal.id =
        "df-payment-modal";

      modal.innerHTML = `

        <div class="df-overlay">

          <div class="df-modal">

            <button
              class="df-close"
              onclick="closePayment()">

              ×

            </button>

            <div class="df-success">
              ✓
            </div>

            <h2>
              Prompt Unlocked
            </h2>

            <p class="df-prompt-name">

              ${escapeHtml(
                prompt.title
              )}

            </p>

            <div class="df-ai">

              Works with:

              <b>
                ${escapeHtml(
                  prompt.ai || "-"
                )}
              </b>

            </div>

            <textarea
              id="df-prompt-text"
              class="df-prompt-box"
              readonly>${escapeHtml(
                content.prompt_text
              )}</textarea>

            <button
              class="df-copy-button"
              onclick="copyPrompt()">

              📋 Copy Prompt

            </button>

            <p
              id="df-copy-message"
              class="df-copy-message">
            </p>

          </div>

        </div>

      `;

      document.body.appendChild(
        modal
      );

      addModalStyles();
    };

  // --------------------------------------------------
  // ACCOUNT SETTINGS
  // --------------------------------------------------

  async function openAccountSettings() {

    const user =
      await getLoggedInUser();

    if (!user) {
      showLoginModal();
      return;
    }

    openContent(
      "⚙️ Account Settings",
      `

        <div class="df-info-box">

          <div class="df-info-label">
            Account
          </div>

          <div class="df-info-value">
            Connected with Google
          </div>

        </div>

        <div class="df-info-box">

          <div class="df-info-label">
            Support Email
          </div>

          <div class="df-info-value">

            ${
              supportEmail
                ? escapeHtml(
                    supportEmail
                  )
                : "Not configured"
            }

          </div>

        </div>

        <div class="df-info-box">

          <div class="df-info-label">
            Payment
          </div>

          <div class="df-info-value">
            Razorpay will be connected later
          </div>

        </div>

        <div class="df-info-box">

          <div class="df-info-label">
            Purchases
          </div>

          <div class="df-info-value">
            Purchases are linked to this account
          </div>

        </div>

      `
    );
  }

  // --------------------------------------------------
  // PROFILE UI
  // --------------------------------------------------

  function showCustomerProfile(user) {

    if (!user) {
      return;
    }

    currentUser =
      user;

    const metadata =
      user.user_metadata || {};

    const name =
      metadata.full_name ||
      metadata.name ||
      "Customer";

    const email =
      user.email ||
      "Email not available";

    const avatar =
      metadata.avatar_url ||
      metadata.picture ||
      (
        "https://ui-avatars.com/api/?name=" +
        encodeURIComponent(name) +
        "&background=111827&color=ffffff"
      );

    const profileName =
      document.getElementById(
        "df-profile-name"
      );

    const profileEmail =
      document.getElementById(
        "df-profile-email"
      );

    const profilePhoto =
      document.getElementById(
        "df-profile-photo"
      );

    const profileBtn =
      document.getElementById(
        "df-profile-btn"
      );

    if (profileName) {

      profileName.innerText =
        name;

    }

    if (profileEmail) {

      profileEmail.innerText =
        email;

    }

    if (profilePhoto) {

      profilePhoto.src =
        avatar;

    }

    if (profileBtn) {

      profileBtn.innerHTML = `

        <img
          class="df-profile-avatar-small"
          src="${escapeHtml(
            avatar
          )}"
          alt="Profile">

        <span>
          Profile
        </span>

      `;

      profileBtn.style.display =
        "flex";
    }

    // Make sure Help Center is available after Google login.
    setTimeout(
      ensureProfileSupportButtons,
      50
    );
  }

  function hideCustomerProfile() {

    currentUser =
      null;

    const profileBtn =
      document.getElementById(
        "df-profile-btn"
      );

    const profileModal =
      document.getElementById(
        "df-profile-modal"
      );

    closeContentModal();

    if (profileBtn) {

      profileBtn.style.display =
        "none";

    }

    if (profileModal) {

      profileModal.style.display =
        "none";

    }
  }

  // --------------------------------------------------
  // MY PROFILE
  // --------------------------------------------------

  async function openMyProfile() {

    const user =
      await getLoggedInUser();

    if (!user) {
      showLoginModal();
      return;
    }

    const metadata =
      user.user_metadata || {};

    const name =
      metadata.full_name ||
      metadata.name ||
      "Customer";

    const email =
      user.email ||
      "Not available";

    openContent(
      "👤 My Profile",
      `

        <div class="df-info-box">

          <div class="df-info-label">
            Name
          </div>

          <div class="df-info-value">
            ${escapeHtml(
              name
            )}
          </div>

        </div>

        <div class="df-info-box">

          <div class="df-info-label">
            Email
          </div>

          <div class="df-info-value">
            ${escapeHtml(
              email
            )}
          </div>

        </div>

        <div class="df-info-box">

          <div class="df-info-label">
            Login method
          </div>

          <div class="df-info-value">
            Google Account
          </div>

        </div>

      `
    );
  }

  // --------------------------------------------------
  // MODAL CSS
  // --------------------------------------------------

  function addModalStyles() {

    if (
      document.getElementById(
        "df-modal-styles"
      )
    ) {
      return;
    }

    const style =
      document.createElement(
        "style"
      );

    style.id =
      "df-modal-styles";

    style.innerHTML = `

      .df-overlay {
        position:fixed;
        inset:0;
        background:rgba(0,0,0,.65);
        display:flex;
        align-items:center;
        justify-content:center;
        padding:20px;
        z-index:99999;
        overflow-y:auto;
      }

      .df-modal {
        width:100%;
        max-width:430px;
        background:#ffffff;
        border-radius:24px;
        padding:28px 22px;
        position:relative;
        box-shadow:0 20px 60px rgba(0,0,0,.25);
        text-align:center;
        font-family:Arial,sans-serif;
      }

      .df-close {
        position:absolute;
        right:15px;
        top:12px;
        width:35px;
        height:35px;
        border:0;
        border-radius:50%;
        background:#f1f3f7;
        font-size:25px;
        cursor:pointer;
      }

      .df-logo {
        width:58px;
        height:58px;
        border-radius:16px;
        background:#111827;
        color:white;
        display:flex;
        align-items:center;
        justify-content:center;
        font-weight:bold;
        font-size:20px;
        margin:0 auto 16px;
      }

      .df-modal h2 {
        margin:5px 0 10px;
        color:#111827;
      }

      .df-prompt-name {
        color:#6b7280;
        font-size:15px;
        margin-bottom:12px;
      }

      .df-price {
        font-size:34px;
        font-weight:800;
        color:#111827;
        margin:8px 0 0;
      }

      .df-small {
        color:#777;
        font-size:12px;
        margin:7px 0 18px;
      }

      .df-payment-title {
        text-align:left;
        font-weight:700;
        margin:20px 0 10px;
        color:#111827;
      }

      .df-pay-option {
        width:100%;
        border:1px solid #e2e5ea;
        background:#fff;
        border-radius:14px;
        padding:14px;
        margin:7px 0;
        display:flex;
        align-items:center;
        gap:13px;
        text-align:left;
        cursor:pointer;
        font-size:20px;
      }

      .df-pay-option:hover {
        background:#f7f8fb;
      }

      .df-pay-option b {
        display:block;
        color:#111827;
        font-size:15px;
      }

      .df-pay-option small {
        display:block;
        color:#777;
        font-size:12px;
        margin-top:3px;
      }

      .df-demo-note {
        margin-top:18px;
        padding:10px;
        background:#fff7ed;
        border-radius:10px;
        color:#9a3412;
        font-size:12px;
      }

      .df-demo-box {
        background:#f5f7fb;
        border-radius:16px;
        padding:20px 14px;
        margin:20px 0;
      }

      .df-demo-icon {
        font-size:38px;
        margin-bottom:8px;
      }

      .df-demo-box h3 {
        font-size:17px;
        margin:5px 0 8px;
        color:#111827;
      }

      .df-demo-box p {
        color:#666;
        font-size:13px;
        line-height:1.5;
      }

      .df-demo-success,
      .df-copy-button {
        width:100%;
        border:none;
        border-radius:13px;
        padding:15px;
        background:#111827;
        color:white;
        font-size:16px;
        font-weight:700;
        cursor:pointer;
        margin-top:8px;
      }

      .df-success {
        width:65px;
        height:65px;
        border-radius:50%;
        background:#dcfce7;
        color:#16a34a;
        font-size:35px;
        display:flex;
        align-items:center;
        justify-content:center;
        margin:0 auto 15px;
      }

      .df-ai {
        background:#f3f4f6;
        padding:10px;
        border-radius:10px;
        margin:15px 0;
        font-size:13px;
      }

      .df-prompt-box {
        width:100%;
        min-height:230px;
        box-sizing:border-box;
        border:1px solid #ddd;
        border-radius:13px;
        padding:14px;
        font-size:13px;
        line-height:1.5;
        resize:vertical;
        background:#fafafa;
        color:#222;
        outline:none;
        text-align:left;
      }

      .df-copy-message {
        color:#16a34a;
        font-size:13px;
        font-weight:600;
        min-height:18px;
        margin-top:10px;
      }

      @media (max-width:480px) {

        .df-overlay {
          padding:12px;
        }

        .df-modal {
          padding:25px 17px;
          border-radius:20px;
        }

        .df-prompt-box {
          min-height:250px;
        }

      }

    `;

    document.head.appendChild(
      style
    );
  }

  // --------------------------------------------------
  // PROFILE HELP CENTER / SUPPORT BUTTONS
  // --------------------------------------------------

  function ensureProfileSupportButtons() {

    const profileModal =
      document.getElementById(
        "df-profile-modal"
      );

    if (!profileModal) {
      return;
    }

    // Existing profile modal already contains Logout.
    // We use Logout to find the correct container.
    const logoutBtn =
      document.getElementById(
        "df-logout-btn"
      );

    let container =
      null;

    if (
      logoutBtn &&
      profileModal.contains(
        logoutBtn
      )
    ) {

      container =
        logoutBtn.parentElement;

    }

    // Fallback: use an existing profile option.
    if (!container) {

      const existingOption =
        profileModal.querySelector(
          "#df-my-profile, " +
          "#df-unlocked-prompts, " +
          "#df-my-purchases, " +
          "#df-account-settings"
        );

      if (existingOption) {

        container =
          existingOption.parentElement;

      }
    }

    if (!container) {
      return;
    }

    // ------------------------------------------------
    // HELP CENTER
    // ------------------------------------------------

    let helpButton =
      document.getElementById(
        "df-customer-support"
      );

    if (!helpButton) {

      helpButton =
        document.createElement(
          "button"
        );

      helpButton.id =
        "df-customer-support";

      helpButton.className =
        "df-profile-option";

      helpButton.type =
        "button";

      helpButton.innerText =
        "🆘 Help Center";

      helpButton.addEventListener(
        "click",
        function () {

          if (profileModal) {
            profileModal.style.display =
              "none";
          }

          openSupportForm();

        }
      );

      if (
        logoutBtn &&
        container.contains(
          logoutBtn
        )
      ) {

        container.insertBefore(
          helpButton,
          logoutBtn
        );

      } else {

        container.appendChild(
          helpButton
        );

      }
    }

    // ------------------------------------------------
    // MY SUPPORT TICKETS
    // ------------------------------------------------

    let ticketButton =
      document.getElementById(
        "df-my-support-tickets"
      );

    if (!ticketButton) {

      ticketButton =
        document.createElement(
          "button"
        );

      ticketButton.id =
        "df-my-support-tickets";

      ticketButton.className =
        "df-profile-option";

      ticketButton.type =
        "button";

      ticketButton.innerText =
        "🎫 My Support Tickets";

      ticketButton.addEventListener(
        "click",
        function () {

          if (profileModal) {
            profileModal.style.display =
              "none";
          }

          openMyTickets();

        }
      );

      if (
        helpButton &&
        helpButton.parentElement ===
          container
      ) {

        helpButton.insertAdjacentElement(
          "afterend",
          ticketButton
        );

      } else if (
        logoutBtn &&
        container.contains(
          logoutBtn
        )
      ) {

        container.insertBefore(
          ticketButton,
          logoutBtn
        );

      } else {

        container.appendChild(
          ticketButton
        );

      }
    }

    // ------------------------------------------------
    // SUPPORT BUTTON STYLE
    // ------------------------------------------------

    if (
      !document.getElementById(
        "df-help-center-style"
      )
    ) {

      const style =
        document.createElement(
          "style"
        );

      style.id =
        "df-help-center-style";

      style.innerHTML = `

        #df-customer-support,
        #df-my-support-tickets {

          width:100%;
          box-sizing:border-box;
          display:flex;
          align-items:center;
          justify-content:flex-start;
          gap:8px;
          margin:6px 0;
          padding:10px 12px;
          border:1px solid #e5e7eb;
          border-radius:10px;
          background:#fff;
          color:#111827;
          font-size:13px;
          font-weight:600;
          text-align:left;
          cursor:pointer;

        }

        #df-customer-support:hover,
        #df-my-support-tickets:hover {

          background:#f7f8fb;

        }

      `;

      document.head.appendChild(
        style
      );
    }
  }

  // --------------------------------------------------
  // DOM READY
  // --------------------------------------------------

  document.addEventListener(
    "DOMContentLoaded",
    async function () {

      addModalStyles();

      addSupportStyles();

      // Load public settings.
      await loadSiteSettings();

      // Load active prompts.
      await loadPrompts();

      // Current session.
      const {
        data: sessionData
      } =
        await supabaseClient.auth.getSession();

      if (
        sessionData?.session?.user
      ) {

        showCustomerProfile(
          sessionData.session.user
        );

      }

      // Auth changes.
      supabaseClient.auth.onAuthStateChange(
        function (
          event,
          session
        ) {

          if (session?.user) {

            showCustomerProfile(
              session.user
            );

            const loginModal =
              document.getElementById(
                "loginModal"
              );

            if (loginModal) {

              loginModal.style.display =
                "none";

            }

          } else {

            hideCustomerProfile();

          }

        }
      );

      // ------------------------------------------------
      // GET STARTED
      // ------------------------------------------------

      const getStartedBtn =
        document.getElementById(
          "getStartedBtn"
        );

      if (getStartedBtn) {

        getStartedBtn.addEventListener(
          "click",
          async function () {

            const user =
              await getLoggedInUser();

            if (user) {

              showCustomerProfile(
                user
              );

              const profileModal =
                document.getElementById(
                  "df-profile-modal"
                );

              if (profileModal) {

                profileModal.style.display =
                  "flex";

                ensureProfileSupportButtons();

              }

            } else {

              showLoginModal();

            }

          }
        );
      }

      // ------------------------------------------------
      // CLOSE LOGIN
      // ------------------------------------------------

      const closeLoginBtn =
        document.getElementById(
          "closeLoginBtn"
        );

      if (closeLoginBtn) {

        closeLoginBtn.addEventListener(
          "click",
          function () {

            const modal =
              document.getElementById(
                "loginModal"
              );

            if (modal) {

              modal.style.display =
                "none";

            }

          }
        );
      }

      const loginModal =
        document.getElementById(
          "loginModal"
        );

      if (loginModal) {

        loginModal.addEventListener(
          "click",
          function (event) {

            if (
              event.target ===
              loginModal
            ) {

              loginModal.style.display =
                "none";

            }

          }
        );
      }

      // ------------------------------------------------
      // GOOGLE LOGIN
      // ------------------------------------------------

      const googleLoginBtn =
        document.getElementById(
          "googleLoginBtn"
        );

      if (googleLoginBtn) {

        googleLoginBtn.addEventListener(
          "click",
          async function () {

            googleLoginBtn.disabled =
              true;

            googleLoginBtn.innerText =
              "Connecting...";

            try {

              const { error } =
                await supabaseClient.auth
                  .signInWithOAuth({

                    provider:
                      "google",

                    options: {

                      redirectTo:
                        "https://dhramvirfinds-ai-prompts.github.io/Dhramvir-Finds/"

                    }

                  });

              if (error) {

                console.error(
                  error
                );

                alert(
                  "Google Login error: " +
                  error.message
                );

                googleLoginBtn.disabled =
                  false;

                googleLoginBtn.innerText =
                  "🔵 Continue with Google";

              }

            } catch (error) {

              console.error(
                error
              );

              alert(
                "Google Login start nahi ho paya."
              );

              googleLoginBtn.disabled =
                false;

              googleLoginBtn.innerText =
                "🔵 Continue with Google";

            }

          }
        );
      }

      // ------------------------------------------------
      // MOBILE LOGIN
      // ------------------------------------------------

      const mobileLoginBtn =
        document.getElementById(
          "mobileLoginBtn"
        );

      if (mobileLoginBtn) {

        mobileLoginBtn.addEventListener(
          "click",
          function () {

            alert(
              "Mobile OTP login ko next step mein connect karenge."
            );

          }
        );
      }

      // ------------------------------------------------
      // PROFILE BUTTON
      // ------------------------------------------------

      const profileBtn =
        document.getElementById(
          "df-profile-btn"
        );

      const profileModal =
        document.getElementById(
          "df-profile-modal"
        );

      if (profileBtn) {

        profileBtn.addEventListener(
          "click",
          function () {

            if (profileModal) {

              profileModal.style.display =
                "flex";

              ensureProfileSupportButtons();

            }

          }
        );
      }

      const profileClose =
        document.getElementById(
          "df-profile-close"
        );

      if (profileClose) {

        profileClose.addEventListener(
          "click",
          function () {

            if (profileModal) {

              profileModal.style.display =
                "none";

            }

          }
        );
      }

      if (profileModal) {

        profileModal.addEventListener(
          "click",
          function (event) {

            if (
              event.target ===
              profileModal
            ) {

              profileModal.style.display =
                "none";

            }

          }
        );
      }

      // ------------------------------------------------
      // MY PROFILE
      // ------------------------------------------------

      const myProfileBtn =
        document.getElementById(
          "df-my-profile"
        );

      if (myProfileBtn) {

        myProfileBtn.addEventListener(
          "click",
          openMyProfile
        );

      }

      // ------------------------------------------------
      // UNLOCKED PROMPTS
      // ------------------------------------------------

      const unlockedPromptsBtn =
        document.getElementById(
          "df-unlocked-prompts"
        );

      if (unlockedPromptsBtn) {

        unlockedPromptsBtn.addEventListener(
          "click",
          openMyUnlockedPrompts
        );

      }

      // ------------------------------------------------
      // PURCHASES
      // ------------------------------------------------

      const purchasesBtn =
        document.getElementById(
          "df-my-purchases"
        );

      if (purchasesBtn) {

        purchasesBtn.addEventListener(
          "click",
          openMyPurchases
        );

      }

      // ------------------------------------------------
      // ACCOUNT SETTINGS
      // ------------------------------------------------

      const accountSettingsBtn =
        document.getElementById(
          "df-account-settings"
        );

      if (accountSettingsBtn) {

        accountSettingsBtn.addEventListener(
          "click",
          openAccountSettings
        );

      }

      // ------------------------------------------------
      // HELP CENTER + SUPPORT TICKETS
      // ------------------------------------------------

      ensureProfileSupportButtons();

      setTimeout(
        ensureProfileSupportButtons,
        300
      );

      setTimeout(
        ensureProfileSupportButtons,
        1000
      );

      // Watch the profile modal for dynamic changes.
      const profileObserver =
        new MutationObserver(
          function () {

            ensureProfileSupportButtons();

          }
        );

      profileObserver.observe(
        document.body,
        {
          childList:true,
          subtree:true
        }
      );

      // ------------------------------------------------
      // CONTENT CLOSE
      // ------------------------------------------------

      const contentClose =
        document.getElementById(
          "df-content-close"
        );

      if (contentClose) {

        contentClose.addEventListener(
          "click",
          closeContentModal
        );

      }

      const contentModal =
        document.getElementById(
          "df-content-modal"
        );

      if (contentModal) {

        contentModal.addEventListener(
          "click",
          function (event) {

            if (
              event.target ===
              contentModal
            ) {

              closeContentModal();

            }

          }
        );
      }

      // ------------------------------------------------
      // LOGOUT
      // ------------------------------------------------

      const logoutBtn =
        document.getElementById(
          "df-logout-btn"
        );

      if (logoutBtn) {

        logoutBtn.addEventListener(
          "click",
          async function () {

            const { error } =
              await supabaseClient
                .auth
                .signOut();

            if (error) {

              console.error(
                error
              );

              alert(
                "Logout nahi ho paya."
              );

              return;
            }

            hideCustomerProfile();

            alert(
              "Aap successfully logout ho gaye."
            );

          }
        );
      }

      console.log(
        "Dhramvir Finds website loaded successfully."
      );

    }
  );

})();
