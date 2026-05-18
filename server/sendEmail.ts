import sgMail from "@sendgrid/mail";
import type { PropertyCleaningQuote, QuoteRequest } from "@shared/schema";

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || "blake@gooddayservices.net";
const SENDGRID_FROM_NAME = "Good Day Services";
const OWNER_EMAIL = "blake@gooddayservices.net";
const OWNER_PHONE = "+16153909779";

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

if (SENDGRID_API_KEY) sgMail.setApiKey(SENDGRID_API_KEY);

// ─── Generic send ────────────────────────────────────────────────────────────
export async function sendEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<{ success: boolean; message: string }> {
  if (SENDGRID_API_KEY) {
    try {
      await sgMail.send({
        to,
        from: { email: SENDGRID_FROM_EMAIL, name: SENDGRID_FROM_NAME },
        subject,
        text,
        html: html || text,
      });
      return { success: true, message: "Email sent via SendGrid" };
    } catch (error: any) {
      console.error("SendGrid error:", error);
      return { success: false, message: `Email failed: ${error.message}` };
    }
  }
  console.log(`[EMAIL] To: ${to} | Subject: ${subject}\n${text}`);
  return { success: true, message: "Email logged (SendGrid not configured)" };
}

// ─── Owner SMS helper ─────────────────────────────────────────────────────────
async function smsOwner(message: string): Promise<void> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.log(`[SMS → owner] ${message}`);
    return;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const twilio = require("twilio");
    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    await client.messages.create({ body: message, from: TWILIO_PHONE_NUMBER, to: OWNER_PHONE });
  } catch (err: any) {
    console.error("Twilio owner SMS error:", err.message);
  }
}

// ─── Owner alert (email + SMS) ─────────────────────────────────────────────────
export async function notifyOwner(subject: string, body: string): Promise<void> {
  await Promise.all([
    sendEmail({ to: OWNER_EMAIL, subject, text: body }),
    smsOwner(`GDS Alert: ${subject}`),
  ]);
}

// ─── Property Cleaning Quote ──────────────────────────────────────────────────
export function generatePropertyCleaningQuoteEmail(quote: PropertyCleaningQuote): {
  subject: string;
  html: string;
  text: string;
} {
  const services: string[] = [];
  if (quote.driveway) services.push(`Driveway Cleaning — $${quote.driveway ? 350 : 0}`);
  if (quote.roof) services.push("Roof Cleaning — $425");
  if (quote.siding) services.push("House Siding — $375");
  if (quote.gutters) services.push("Gutter Cleaning — $200");
  if (quote.fenceSides > 0) {
    services.push(`Fence Cleaning (${quote.fenceSides} sides) — $${Number(quote.fencePricePerSide) * quote.fenceSides}`);
  }
  const servicesHtml = services.map(s => `<li>${s}</li>`).join("");
  const servicesList = services.join("\n");
  const subject = `Your Property Cleaning Quote #${quote.id.slice(0, 8)}`;

  const html = `<!DOCTYPE html><html><head><style>
    body{font-family:Arial,sans-serif;line-height:1.6;color:#333}
    .wrap{max-width:600px;margin:0 auto;padding:20px}
    .hdr{background:#1e40af;color:#fff;padding:20px;text-align:center;border-radius:8px 8px 0 0}
    .body{background:#f9fafb;padding:30px;border:1px solid #e5e7eb;border-radius:0 0 8px 8px}
    .box{background:#fff;padding:20px;border-radius:8px;margin:20px 0;border:1px solid #e5e7eb}
    .total{font-size:24px;font-weight:bold;color:#1e40af;text-align:right;margin:20px 0}
    .btn{display:inline-block;padding:16px 32px;background:#10b981;color:#fff;text-decoration:none;border-radius:6px;font-size:18px;margin:20px 0}
    .note{background:#dcfce7;border:1px solid #10b981;padding:12px;border-radius:6px;margin:15px 0}
    .ftr{margin-top:30px;padding-top:20px;border-top:1px solid #e5e7eb;text-align:center;color:#6b7280}
  </style></head><body><div class="wrap">
    <div class="hdr"><h1>Good Day Services</h1><p>Property Cleaning Quote</p></div>
    <div class="body">
      <h2>Hello ${quote.customerName},</h2>
      <p>Thank you for requesting a quote. Here's your estimate:</p>
      <div class="box">
        <p><strong>Property:</strong> ${quote.propertyAddress}</p>
        <h3>Services Selected:</h3>
        <ul>${servicesHtml}</ul>
        ${quote.minimumApplied ? '<p style="background:#fef3c7;padding:10px;border-radius:6px"><strong>Note:</strong> Minimum service charge of $975 applied.</p>' : ""}
        <div class="total">Total: $${quote.finalTotal}</div>
      </div>
      <div class="note"><strong>Book within 72 hours and save 10%!</strong></div>
      <center>
        <a href="tel:615-390-9779" class="btn">Book Now — Call (615) 390-9779</a>
        <p><strong>Or text "BOOK" to (615) 390-9779</strong></p>
      </center>
      <div class="ftr"><p><strong>Good Day Services</strong><br>Smyrna, TN · (615) 390-9779<br>${OWNER_EMAIL}</p>
        <p style="font-size:12px">Quote valid 30 days. Final pricing may vary based on actual conditions.</p>
      </div>
    </div>
  </div></body></html>`;

  const text = `Good Day Services — Property Cleaning Quote\n\nHello ${quote.customerName},\n\nProperty: ${quote.propertyAddress}\n\nServices:\n${servicesList}\n\n${quote.minimumApplied ? "Note: Minimum $975 service charge applied.\n" : ""}Total: $${quote.finalTotal}\n\nCall (615) 390-9779 to schedule. Quote valid 30 days.\n\nGood Day Services · (615) 390-9779 · ${OWNER_EMAIL}`;

  return { subject, html, text };
}

// ─── Restoration Quote ────────────────────────────────────────────────────────
export function generateRestorationQuoteEmail(quote: QuoteRequest): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `Your Paver Restoration Quote #${quote.id.slice(0, 8)}`;

  const html = `<!DOCTYPE html><html><head><style>
    body{font-family:Arial,sans-serif;line-height:1.6;color:#333}
    .wrap{max-width:600px;margin:0 auto;padding:20px}
    .hdr{background:#1e40af;color:#fff;padding:20px;text-align:center;border-radius:8px 8px 0 0}
    .body{background:#f9fafb;padding:30px;border:1px solid #e5e7eb;border-radius:0 0 8px 8px}
    .tier{border:2px solid #e5e7eb;padding:15px;margin:10px 0;border-radius:8px}
    .tier.rec{border-color:#10b981;background:#f0fdf4}
    .price{font-size:20px;font-weight:bold;color:#1e40af}
    .badge{background:#10b981;color:#fff;padding:4px 8px;border-radius:4px;font-size:12px}
    .btn{display:inline-block;padding:16px 32px;background:#10b981;color:#fff;text-decoration:none;border-radius:6px;font-size:18px;margin:20px 0}
    .ftr{margin-top:30px;padding-top:20px;border-top:1px solid #e5e7eb;text-align:center;color:#6b7280}
  </style></head><body><div class="wrap">
    <div class="hdr"><h1>Good Day Services</h1><p>Paver Restoration Quote</p></div>
    <div class="body">
      <h2>Hello ${quote.name},</h2>
      <p>Based on your <strong>${quote.squareFootage.toLocaleString()} sq ft</strong> surface at ${quote.address}, here are your options:</p>
      <div class="tier">
        <h4>Basic — <span class="price">$${quote.basicTierPrice}</span></h4>
        <ul><li>Professional pressure washing</li><li>Acrylic sealer application</li><li>Color enhancement &amp; stain resistance</li></ul>
      </div>
      <div class="tier rec">
        <h4>Recommended <span class="badge">BEST VALUE</span> — <span class="price">$${quote.recommendedTierPrice}</span></h4>
        <ul><li>Everything in Basic</li><li>Full polymeric sand installation</li><li>Locks pavers, stops weeds, stabilizes joints</li></ul>
      </div>
      <div class="tier">
        <h4>Premium — <span class="price">$${quote.premiumTierPrice}</span></h4>
        <ul><li>Everything in Recommended</li><li>Penetrating silane sealer (5–7 yr protection)</li><li>Superior freeze-thaw resistance</li></ul>
      </div>
      <center><a href="tel:615-390-9779" class="btn">Lock In Your Quote — (615) 390-9779</a></center>
      <div class="ftr"><p><strong>Good Day Services</strong><br>Smyrna, TN · (615) 390-9779<br>${OWNER_EMAIL}</p>
        <p style="font-size:12px">Quote valid 30 days. Final pricing may vary based on site conditions.</p>
      </div>
    </div>
  </div></body></html>`;

  const text = `Good Day Services — Paver Restoration Quote\n\nHello ${quote.name},\n\nAddress: ${quote.address}\nArea: ${quote.squareFootage.toLocaleString()} sq ft\n\nOptions:\nBasic: $${quote.basicTierPrice}\nRecommended: $${quote.recommendedTierPrice}\nPremium: $${quote.premiumTierPrice}\n\nCall (615) 390-9779 to schedule. Quote valid 30 days.\n\nGood Day Services · (615) 390-9779 · ${OWNER_EMAIL}`;

  return { subject, html, text };
}

// ─── SMS helpers ─────────────────────────────────────────────────────────────
export function generatePropertyCleaningQuoteSMS(quote: PropertyCleaningQuote): string {
  const services = [
    quote.driveway && "Driveway",
    quote.roof && "Roof",
    quote.siding && "Siding",
    quote.gutters && "Gutters",
    quote.fenceSides > 0 && `Fence(${quote.fenceSides})`,
  ].filter(Boolean).join(", ");

  return `GDS Quote #${quote.id.slice(0, 8)}\n${quote.propertyAddress}\nServices: ${services}\nTotal: $${quote.finalTotal}\n\nCall (615) 390-9779 · Valid 30 days`;
}

export function generateRestorationQuoteSMS(quote: QuoteRequest): string {
  return `GDS Quote #${quote.id.slice(0, 8)}\n${quote.squareFootage} sq ft\nBasic $${quote.basicTierPrice} · Rec $${quote.recommendedTierPrice} · Premium $${quote.premiumTierPrice}\n\nCall (615) 390-9779 · Valid 30 days`;
}

// ─── Send quote to customer ───────────────────────────────────────────────────
export async function sendPropertyCleaningQuoteEmail(
  quote: PropertyCleaningQuote,
  recipientEmail: string
): Promise<{ success: boolean; message: string }> {
  const content = generatePropertyCleaningQuoteEmail(quote);
  return sendEmail({ to: recipientEmail, ...content });
}

export async function sendRestorationQuoteEmail(
  quote: QuoteRequest,
  recipientEmail: string
): Promise<{ success: boolean; message: string }> {
  const content = generateRestorationQuoteEmail(quote);
  return sendEmail({ to: recipientEmail, ...content });
}

// ─── Send SMS quote to customer ───────────────────────────────────────────────
async function sendSMS(to: string, message: string): Promise<{ success: boolean; message: string }> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.log(`[SMS] To: ${to}\n${message}`);
    return { success: true, message: "SMS logged (Twilio not configured)" };
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const twilioClient = require("twilio")(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    const formatted = to.startsWith("+") ? to : `+1${to.replace(/\D/g, "")}`;
    await twilioClient.messages.create({ body: message, from: TWILIO_PHONE_NUMBER, to: formatted });
    return { success: true, message: "SMS sent via Twilio" };
  } catch (err: any) {
    console.error("Twilio error:", err);
    return { success: false, message: `SMS failed: ${err.message}` };
  }
}

export async function sendPropertyCleaningQuoteSMS(
  quote: PropertyCleaningQuote,
  recipientPhone: string
): Promise<{ success: boolean; message: string }> {
  return sendSMS(recipientPhone, generatePropertyCleaningQuoteSMS(quote));
}

export async function sendRestorationQuoteSMS(
  quote: QuoteRequest,
  recipientPhone: string
): Promise<{ success: boolean; message: string }> {
  return sendSMS(recipientPhone, generateRestorationQuoteSMS(quote));
}
