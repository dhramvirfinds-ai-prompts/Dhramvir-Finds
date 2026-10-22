
/* =========================================================
   Dhramvir Finds — script.js
   Compatibility update; existing index.html features remain.
   ========================================================= */

(function () {
  "use strict";

  console.info("Dhramvir Finds: script.js loaded.");

  // Report JavaScript errors without interrupting other features.
  window.addEventListener("error", function (event) {
    console.error(
      "Dhramvir Finds JavaScript error:",
      event.message,
      event.filename,
      event.lineno
    );
  });

  window.addEventListener("unhandledrejection", function (event) {
    console.error(
      "Dhramvir Finds promise error:",
      event.reason
    );
  });

  // Escape user-provided text before inserting it into HTML.
  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, function (char) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[char];
    });
  }

  /*
   * Backward-compatible Support Ticket function.
   * The current Help Center in index.html already has its own
   * submit handler. This function does not attach another one.
   */
  async function submitSupportTicket() {
    const button =
      document.getElementById("df-support-submit") ||
      document.getElementById("df-ticket-submit");

    const subjectInput =
      document.getElementById("df-support-subject") ||
      document.getElementById("df-ticket-subject");

    const messageInput =
      document.getElementById("df-support-message") ||
      document.getElementById("df-ticket-message");

    const statusBox =
      document.getElementById("df-ticket-message-status");

    let ticketSaved = false;

    function showStatus(message, success) {
      if (statusBox) {
        statusBox.className = success
          ? "df-help-message df-help-success"
          : "df-help-message df-help-error";

        statusBox.textContent = message;
      } else {
        alert(message);
      }
    }

    if (button && button.disabled) return;

    try {
      if (
        !window.supabase ||
        typeof supabaseClient === "undefined" ||
        !supabaseClient
      ) {
        throw new Error("Supabase connection nahi mil raha.");
      }

      const getUser =
        typeof getLoggedInUser === "function"
          ? getLoggedInUser
          : typeof getCurrentUser === "function"
            ? getCurrentUser
            : null;

      if (!getUser) {
        throw new Error("Login system ka user function nahi mila.");
      }

      const user = await getUser();

      if (!user) {
        if (typeof showLoginModal === "function") {
          showLoginModal();
        } else {
          const loginModal = document.getElementById("loginModal");
          if (loginModal) loginModal.style.display = "flex";
          else alert("Support ticket bhejne ke liye pehle login karein.");
        }
        return;
      }

      const subject = subjectInput?.value.trim() || "";
      const message = messageInput?.value.trim() || "";
      const email = user.email || "";

      if (!subject) {
        showStatus("Kripya ticket ka subject likhiye.", false);
        subjectInput?.focus();
        return;
      }

      if (!message) {
        showStatus("Kripya apni problem detail mein likhiye.", false);
        messageInput?.focus();
        return;
      }

      if (subject.length > 120 || message.length > 2000) {
        showStatus(
          "Subject 120 aur message 2000 characters se chhota rakhein.",
          false
        );
        return;
      }

      if (button) {
        button.disabled = true;
        button.textContent = "Sending...";
      }

      // Save using the existing support_tickets table fields.
      const { data: ticket, error } = await supabaseClient
        .from("support_tickets")
        .insert({
          user_id: user.id,
          subject: subject,
          message: message,
          status: "open",
          admin_reply: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select("id")
        .single();

      if (error) {
        console.error("Support ticket save error:", error);
        showStatus(
          "Ticket send nahi ho paya. Kripya dobara try karein.",
          false
        );
        return;
      }

      ticketSaved = true;

      if (subjectInput) subjectInput.value = "";
      if (messageInput) messageInput.value = "";

      // The ticket remains saved if the email notification fails.
      if (email && ticket?.id) {
        try {
          const { data, error: emailError } =
            await supabaseClient.functions.invoke(
              "send-support-email",
              {
                body: {
                  email: email,
                  subject: subject,
                  message: message,
                  ticket_id: ticket.id
                }
              }
            );

          if (emailError || data?.success === false) {
            console.error(
              "Support email notification error:",
              emailError || data
            );

            showStatus(
              "Ticket save ho gaya hai, lekin email notification confirm nahi hua.",
              true
            );
            return;
          }
        } catch (emailError) {
          console.error("Support email request error:", emailError);

          showStatus(
            "Ticket save ho gaya hai, lekin email notification nahi bheja ja saka.",
            true
          );
          return;
        }
      }

      showStatus("✓ Support ticket successfully sent.", true);

    } catch (error) {
      console.error("Support ticket submission error:", error);

      showStatus(
        ticketSaved
          ? "Ticket save ho gaya hai, lekin agla step complete nahi hua."
          : (error?.message || "Ticket submit nahi ho paya. Dobara try karein."),
        ticketSaved
      );

    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = "Send Support Ticket";
      }
    }
  }

  // Preserve compatibility with any existing inline HTML callers.
  window.submitSupportTicket = submitSupportTicket;

})();
