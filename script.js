async function submitSupportTicket() {
  const button = document.getElementById("df-support-submit");
  let ticketSaved = false;

  try {
    const user = await getLoggedInUser();

    if (!user) {
      showLoginModal();
      return;
    }

    const subjectInput = document.getElementById("df-support-subject");
    const messageInput = document.getElementById("df-support-message");

    const subject = subjectInput?.value.trim() || "";
    const message = messageInput?.value.trim() || "";
    const email = user.email || "";

    if (!email) {
      alert("Aapke account ka email nahi mila. Dobara login karein.");
      return;
    }

    if (!subject) {
      alert("Kripya support ticket ka subject likhiye.");
      subjectInput?.focus();
      return;
    }

    if (!message) {
      alert("Kripya apni problem detail mein likhiye.");
      messageInput?.focus();
      return;
    }

    if (subject.length > 120 || message.length > 2000) {
      alert("Subject ya message bahut lamba hai.");
      return;
    }

    if (button) {
      button.disabled = true;
      button.innerText = "Sending...";
    }

    // STEP 1: Save the support ticket in Supabase.
    const { data: ticket, error: ticketError } =
      await supabaseClient
        .from("support_tickets")
        .insert({
          user_id: user.id,
          email: email,
          subject: subject,
          message: message,
          status: "open"
        })
        .select("id")
        .single();

    if (ticketError) {
      console.error("Support ticket save error:", ticketError);

      alert(
        "Support ticket save nahi ho paya. " +
        "Supabase table aur RLS policies check karein."
      );

      return;
    }

    ticketSaved = true;

    // STEP 2: Request the support email notification.
    const { data: emailResult, error: emailError } =
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

    // The ticket remains saved even if email notification fails.
    if (emailError || emailResult?.success === false) {
      console.error(
        "Support email notification error:",
        emailError || emailResult
      );

      alert(
        "Aapka support ticket save ho gaya hai, " +
        "lekin email notification confirm nahi ho paya. " +
        "Aapka ticket My Support Tickets mein available rahega."
      );

      await openMyTickets();
      return;
    }

    alert(
      "Aapka support ticket submit ho gaya! " +
      "Email notification request bhi successfully process hui."
    );

    // STEP 3: Display the user's saved tickets.
    await openMyTickets();

  } catch (error) {
    console.error("Support ticket submission error:", error);

    if (ticketSaved) {
      alert(
        "Aapka support ticket save ho chuka hai, " +
        "lekin agla step complete nahi ho paya. " +
        "My Support Tickets mein apna ticket check karein."
      );
    } else {
      alert(
        error?.message ||
        "Support ticket submit nahi ho paya. Kripya dobara try karein."
      );
    }

  } finally {
    if (button) {
      button.disabled = false;
      button.innerText = "Send Support Ticket";
    }
  }
}
