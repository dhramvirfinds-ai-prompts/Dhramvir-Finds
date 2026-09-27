// Dhramvir Finds - Viral AI Prompts
// Front-end prompt unlock system
// Real Razorpay payment will be connected in the next step.

const prompts = {
  "New Viral AI Prompt": {
    ai: "Flow AI",
    text: `Create a highly engaging viral AI video with cinematic quality.

Use the uploaded reference image as the main character.
Keep the same face, identity, hairstyle and overall appearance.
Create natural body movement, realistic expressions and smooth camera motion.

Make the video suitable for Instagram Reels and YouTube Shorts.
Use realistic lighting, detailed visuals and professional cinematic quality.

Do not change the person's identity.
Keep the character consistent throughout the video.`
  },

  "Trending Reel Prompt": {
    ai: "Flow AI",
    text: `Create a trending vertical social media reel using the uploaded reference image.

Keep the person's original face and identity exactly consistent.
Use realistic facial expressions, natural movement and smooth cinematic camera motion.

Create an attention-grabbing opening scene and modern viral-reel style visuals.

Format:
9:16 vertical
Full HD
High detail
Cinematic lighting
Smooth motion
Professional social-media quality.`
  },

  "HD Image With Your Original Face": {
    ai: "AI Image Generator",
    text: `Generate a high-quality realistic portrait using the uploaded original face as the identity reference.

Keep the exact facial identity, facial structure and natural appearance.

Create:
Ultra HD quality
Sharp details
Natural skin texture
Professional lighting
Realistic eyes
Natural facial expression
Cinematic background
Premium photography look

Do not replace or alter the person's identity.`
  },

  "Stylish AI New Viral Video": {
    ai: "Flow AI",
    text: `Create a stylish and modern viral AI video using the uploaded reference image.

Keep the exact same person, face and identity.

Use:
Cinematic camera movement
Smooth transitions
Realistic body movement
Natural facial expressions
Professional lighting
High-detail environment
Modern viral social-media style

The final video should look professionally produced and suitable for Instagram Reels and YouTube Shorts.

Keep the character's identity consistent from beginning to end.`
  },

  "Cinematic Reel Prompt": {
    ai: "Flow AI",
    text: `Create a cinematic vertical reel using the uploaded reference image.

The uploaded person must remain the same throughout the complete video.
Do not change the face or identity.

Use realistic movement, cinematic composition, professional lighting and smooth camera movement.

Video format:
9:16 vertical
Full HD
High detail
Realistic textures
Cinematic depth
Smooth motion
Professional color and lighting

Create a visually engaging reel suitable for social media.`
  }
};


// ---------------------------------------------
// FIND PROMPT
// ---------------------------------------------

function getPrompt(name) {
  if (prompts[name]) {
    return prompts[name];
  }

  // Fallback prompt
  return {
    ai: "Flow AI",
    text: `Create a professional viral AI video using the uploaded reference image.

Keep the same face and identity throughout the video.
Use realistic movement, cinematic lighting and smooth camera motion.

Create high-quality vertical social media content suitable for Instagram Reels and YouTube Shorts.`
  };
}


// ---------------------------------------------
// UNLOCK BUTTON
// ---------------------------------------------

function unlock(name) {

  const prompt = getPrompt(name);

  const oldModal = document.getElementById("df-payment-modal");

  if (oldModal) {
    oldModal.remove();
  }

  const modal = document.createElement("div");

  modal.id = "df-payment-modal";

  modal.innerHTML = `
    <div class="df-overlay">

      <div class="df-modal">

        <button class="df-close" onclick="closePayment()">
          ×
        </button>

        <div class="df-logo">
          DF
        </div>

        <h2>Unlock Prompt</h2>

        <p class="df-prompt-name">
          ${name}
        </p>

        <div class="df-price">
          ₹9
        </div>

        <p class="df-small">
          One-time payment
        </p>

        <div class="df-payment-title">
          Choose payment method
        </div>

        <button class="df-pay-option" onclick="demoPayment('UPI')">
          <span>📱</span>
          <span>
            <b>UPI</b>
            <small>Google Pay / PhonePe / Paytm</small>
          </span>
        </button>

        <button class="df-pay-option" onclick="demoPayment('QR Code')">
          <span>▣</span>
          <span>
            <b>QR Code</b>
            <small>Scan and pay ₹9</small>
          </span>
        </button>

        <button class="df-pay-option" onclick="demoPayment('Net Banking')">
          <span>🏦</span>
          <span>
            <b>Net Banking</b>
            <small>Pay using your bank</small>
          </span>
        </button>

        <div class="df-demo-note">
          Payment gateway will be connected here.
        </div>

      </div>

    </div>
  `;

  document.body.appendChild(modal);

  addModalStyles();
}


// ---------------------------------------------
// DEMO PAYMENT
// ---------------------------------------------

function demoPayment(method) {

  const modal = document.getElementById("df-payment-modal");

  if (!modal) return;

  const name = modal.querySelector(".df-prompt-name").innerText;

  modal.querySelector(".df-modal").innerHTML = `

    <button class="df-close" onclick="closePayment()">
      ×
    </button>

    <div class="df-logo">
      DF
    </div>

    <h2>Payment Gateway</h2>

    <div class="df-price">
      ₹9
    </div>

    <p>
      Selected payment method:
      <b>${method}</b>
    </p>

    <div class="df-demo-box">
      <div class="df-demo-icon">💳</div>

      <h3>Razorpay will be connected here</h3>

      <p>
        This is currently a design preview.
        Real ₹9 payment will be added after connecting Razorpay.
      </p>
    </div>

    <button
      class="df-demo-success"
      onclick="showUnlockedPrompt('${escapeForAttribute(name)}')"
    >
      Preview Successful Payment
    </button>

    <p class="df-small">
      This button is only for testing the website.
    </p>
  `;
}


// ---------------------------------------------
// SHOW PROMPT AFTER PAYMENT
// ---------------------------------------------

function showUnlockedPrompt(name) {

  const prompt = getPrompt(name);

  const modal = document.getElementById("df-payment-modal");

  if (!modal) return;

  modal.querySelector(".df-modal").innerHTML = `

    <button class="df-close" onclick="closePayment()">
      ×
    </button>

    <div class="df-success">
      ✓
    </div>

    <h2>Prompt Unlocked</h2>

    <p class="df-prompt-name">
      ${name}
    </p>

    <div class="df-ai">
      Works with: <b>${prompt.ai}</b>
    </div>

    <textarea
      id="df-prompt-text"
      class="df-prompt-box"
      readonly
    >${prompt.text}</textarea>

    <button
      class="df-copy-button"
      onclick="copyPrompt()"
    >
      📋 Copy Prompt
    </button>

    <p id="df-copy-message" class="df-copy-message"></p>

  `;
}


// ---------------------------------------------
// COPY PROMPT
// ---------------------------------------------

function copyPrompt() {

  const box = document.getElementById("df-prompt-text");

  if (!box) return;

  const text = box.value;

  navigator.clipboard.writeText(text)
    .then(function() {

      const message =
        document.getElementById("df-copy-message");

      if (message) {
        message.innerText =
          "✓ Prompt copied successfully!";
      }

    })
    .catch(function() {

      box.select();
      document.execCommand("copy");

      const message =
        document.getElementById("df-copy-message");

      if (message) {
        message.innerText =
          "✓ Prompt copied successfully!";
      }

    });
}


// ---------------------------------------------
// CLOSE PAYMENT
// ---------------------------------------------

function closePayment() {

  const modal =
    document.getElementById("df-payment-modal");

  if (modal) {
    modal.remove();
  }
}


// ---------------------------------------------
// ESCAPE TEXT
// ---------------------------------------------

function escapeForAttribute(text) {

  return text
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/"/g, "&quot;");
}


// ---------------------------------------------
// MODAL CSS
// ---------------------------------------------

function addModalStyles() {

  if (document.getElementById("df-modal-styles")) {
    return;
  }

  const style =
    document.createElement("style");

  style.id = "df-modal-styles";

  style.innerHTML = `

    .df-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,.65);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      z-index: 99999;
      overflow-y: auto;
    }

    .df-modal {
      width: 100%;
      max-width: 430px;
      background: #ffffff;
      border-radius: 24px;
      padding: 28px 22px;
      position: relative;
      box-shadow: 0 20px 60px rgba(0,0,0,.25);
      text-align: center;
      font-family: Arial, sans-serif;
    }

    .df-close {
      position: absolute;
      right: 15px;
      top: 12px;
      width: 35px;
      height: 35px;
      border: 0;
      border-radius: 50%;
      background: #f1f3f7;
      font-size: 25px;
      cursor: pointer;
    }

    .df-logo {
      width: 58px;
      height: 58px;
      border-radius: 16px;
      background: #111827;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      font-size: 20px;
      margin: 0 auto 16px;
    }

    .df-modal h2 {
      margin: 5px 0 10px;
      color: #111827;
    }

    .df-prompt-name {
      color: #6b7280;
      font-size: 15px;
      margin-bottom: 12px;
    }

    .df-price {
      font-size: 34px;
      font-weight: 800;
      color: #111827;
      margin: 8px 0 0;
    }

    .df-small {
      color: #777;
      font-size: 12px;
      margin: 7px 0 18px;
    }

    .df-payment-title {
      text-align: left;
      font-weight: 700;
      margin: 20px 0 10px;
      color: #111827;
    }

    .df-pay-option {
      width: 100%;
      border: 1px solid #e2e5ea;
      background: #fff;
      border-radius: 14px;
      padding: 14px;
      margin: 7px 0;
      display: flex;
      align-items: center;
      gap: 13px;
      text-align: left;
      cursor: pointer;
      font-size: 20px;
    }

    .df-pay-option:hover {
      background: #f7f8fb;
    }

    .df-pay-option b {
      display: block;
      color: #111827;
      font-size: 15px;
    }

    .df-pay-option small {
      display: block;
      color: #777;
      font-size: 12px;
      margin-top: 3px;
    }

    .df-demo-note {
      margin-top: 18px;
      padding: 10px;
      background: #fff7ed;
      border-radius: 10px;
      color: #9a3412;
      font-size: 12px;
    }

    .df-demo-box {
      background: #f5f7fb;
      border-radius: 16px;
      padding: 20px 14px;
      margin: 20px 0;
    }

    .df-demo-icon {
      font-size: 38px;
      margin-bottom: 8px;
    }

    .df-demo-box h3 {
      font-size: 17px;
      margin: 5px 0 8px;
      color: #111827;
    }

    .df-demo-box p {
      color: #666;
      font-size: 13px;
      line-height: 1.5;
    }

    .df-demo-success,
    .df-copy-button {
      width: 100%;
      border: none;
      border-radius: 13px;
      padding: 15px;
      background: #111827;
      color: white;
      font-size: 16px;
      font-weight: 700;
      cursor: pointer;
      margin-top: 8px;
    }

    .df-success {
      width: 65px;
      height: 65px;
      border-radius: 50%;
      background: #dcfce7;
      color: #16a34a;
      font-size: 35px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 15px;
    }

    .df-ai {
      background: #f3f4f6;
      padding: 10px;
      border-radius: 10px;
      margin: 15px 0;
      font-size: 13px;
    }

    .df-prompt-box {
      width: 100%;
      min-height: 230px;
      box-sizing: border-box;
      border: 1px solid #ddd;
      border-radius: 13px;
      padding: 14px;
      font-size: 13px;
      line-height: 1.5;
      resize: vertical;
      background: #fafafa;
      color: #222;
      outline: none;
      text-align: left;
    }

    .df-copy-message {
      color: #16a34a;
      font-size: 13px;
      font-weight: 600;
      min-height: 18px;
      margin-top: 10px;
    }

    @media (max-width: 480px) {

      .df-overlay {
        padding: 12px;
      }

      .df-modal {
        padding: 25px 17px;
        border-radius: 20px;
      }

      .df-prompt-box {
        min-height: 250px;
      }

    }

  `;

  document.head.appendChild(style);
}


// ---------------------------------------------
// PAGE READY
// ---------------------------------------------

document.addEventListener("DOMContentLoaded", function() {

  console.log(
    "Dhramvir Finds website loaded successfully."
  );

});
