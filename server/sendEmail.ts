import sgMail from "@sendgrid/mail";
import {
  generatePropertyCleaningQuoteEmail,
  generateRestorationQuoteEmail,
  generatePropertyCleaningQuoteSMS,
  generateRestorationQuoteSMS,
} from "./emailService";
import type { PropertyCleaningQuote, QuoteRequest } from "@shared/schema";

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || "hello@gooddaypressurewashing.com";
const SENDGRID_FROM_NAME = process.env.SENDGRID_FROM_NAME || "Good Day Pressure Washing";

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

async function sg(msg: Parameters<typeof sgMail.send>[0]): Promise<void> {
  if (!SENDGRID_API_KEY) throw new Error("SENDGRID_API_KEY not set");
  await sgMail.send(msg);
}

function devLog(label: string, to: string, subject: string, preview: string) {
  console.log(`=== ${label} ===`);
  console.log("To:", to);
  console.log("Subject:", subject);
  console.log("Preview:", preview.slice(0, 200));
  console.log("=".repeat(label.length + 8));
}

// ── Generic send ─────────────────────────────────────────────────────────────

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
      await sg({ to, from: { email: SENDGRID_FROM_EMAIL, name: SENDGRID_FROM_NAME }, subject, text, html: html || text });
      return { success: true, message: "Email sent via SendGrid" };
    } catch (err: any) {
      console.error("SendGrid error:", err);
      return { success: false, message: `Failed to send email: ${err.message}` };
    }
  }
  devLog("EMAIL", to, subject, text);
  return { success: true, message: "Email logged to console (SendGrid not configured)" };
}

// ── Booking confirmation ──────────────────────────────────────────────────────

export async function sendBookingConfirmationEmail({
  customerName,
  customerEmail,
  bookingNumber,
  serviceName,
  scheduledDate,
  address,
  totalPrice,
  specialInstructions,
}: {
  customerName: string;
  customerEmail: string;
  bookingNumber: string;
  serviceName: string;
  scheduledDate: Date;
  address: string;
  totalPrice: string;
  specialInstructions?: string | null;
}): Promise<void> {
  const dateStr = scheduledDate.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  const timeStr = scheduledDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  const subject = `Booking Confirmed – ${serviceName} on ${dateStr}`;

  const html = `<!DOCTYPE html>
<html>
<head><style>
  body{font-family:Arial,sans-serif;line-height:1.6;color:#333;margin:0;padding:0}
  .wrap{max-width:600px;margin:0 auto;padding:20px}
  .header{background:#1e40af;color:white;padding:24px 20px;border-radius:8px 8px 0 0;text-align:center}
  .body{background:#f9fafb;padding:30px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px}
  .box{background:white;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin:20px 0}
  .row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f3f4f6}
  .row:last-child{border-bottom:none}
  .label{color:#6b7280;font-size:14px}
  .value{font-weight:600;font-size:14px}
  .total{font-size:20px;font-weight:bold;color:#1e40af;text-align:right;margin-top:12px}
  .cta{display:inline-block;padding:14px 28px;background:#1e40af;color:white;text-decoration:none;border-radius:6px;font-weight:600;margin:8px 0}
  .phone{display:inline-block;padding:14px 28px;background:#10b981;color:white;text-decoration:none;border-radius:6px;font-weight:600;margin:8px 0}
  .footer{margin-top:30px;text-align:center;color:#6b7280;font-size:13px;border-top:1px solid #e5e7eb;padding-top:20px}
  .checkmark{color:#10b981;font-size:48px;text-align:center;display:block}
</style></head>
<body><div class="wrap">
  <div class="header">
    <h1 style="margin:0 0 4px">Good Day Pressure Washing</h1>
    <p style="margin:0;opacity:.85">Your booking is confirmed</p>
  </div>
  <div class="body">
    <span class="checkmark">✓</span>
    <h2 style="text-align:center;margin-top:8px">Thanks, ${customerName}!</h2>
    <p style="text-align:center;color:#6b7280">We'll see you on <strong>${dateStr}</strong> at <strong>${timeStr}</strong>.</p>

    <div class="box">
      <div class="row"><span class="label">Booking #</span><span class="value">${bookingNumber}</span></div>
      <div class="row"><span class="label">Service</span><span class="value">${serviceName}</span></div>
      <div class="row"><span class="label">Date</span><span class="value">${dateStr}</span></div>
      <div class="row"><span class="label">Time</span><span class="value">${timeStr}</span></div>
      <div class="row"><span class="label">Address</span><span class="value">${address}</span></div>
      ${specialInstructions ? `<div class="row"><span class="label">Notes</span><span class="value">${specialInstructions}</span></div>` : ""}
      <div class="total">Total: $${parseFloat(totalPrice).toFixed(2)}</div>
    </div>

    <h3>What to expect</h3>
    <ol>
      <li>Our crew arrives within the scheduled window</li>
      <li>We complete the work and do a walkthrough with you</li>
      <li>Payment is collected on completion</li>
    </ol>

    <p style="text-align:center;margin-top:24px">
      <a href="https://www.gooddaypressurewashing.com/my-appointments" class="cta">View My Appointment</a>
      &nbsp;&nbsp;
      <a href="tel:6153909779" class="phone">Call 615-390-9779</a>
    </p>

    <div class="footer">
      <strong>Good Day Pressure Washing</strong><br>
      Murfreesboro, TN &nbsp;·&nbsp; 615-390-9779 &nbsp;·&nbsp; hello@gooddaypressurewashing.com<br>
      <a href="https://www.gooddaypressurewashing.com">gooddaypressurewashing.com</a>
    </div>
  </div>
</div></body>
</html>`;

  const text = `Booking Confirmed – Good Day Pressure Washing

Hi ${customerName},

Your booking is confirmed! Here are the details:

Booking #: ${bookingNumber}
Service:   ${serviceName}
Date:      ${dateStr} at ${timeStr}
Address:   ${address}
Total:     $${parseFloat(totalPrice).toFixed(2)}
${specialInstructions ? `\nNotes: ${specialInstructions}` : ""}

Questions? Call or text us at 615-390-9779 or reply to this email.

Good Day Pressure Washing
Murfreesboro, TN
hello@gooddaypressurewashing.com
gooddaypressurewashing.com`;

  // Send to customer
  await sendEmail({ to: customerEmail, subject, text, html });

  // Notify admin
  await sendEmail({
    to: SENDGRID_FROM_EMAIL,
    subject: `New Booking: ${serviceName} – ${customerName} – ${dateStr}`,
    text: `New booking received.\n\nBooking #: ${bookingNumber}\nCustomer: ${customerName} <${customerEmail}>\nService: ${serviceName}\nDate: ${dateStr} at ${timeStr}\nAddress: ${address}\nTotal: $${parseFloat(totalPrice).toFixed(2)}${specialInstructions ? `\nNotes: ${specialInstructions}` : ""}`,
  });
}

// ── Quote emails ──────────────────────────────────────────────────────────────

export async function sendPropertyCleaningQuoteEmail(
  quote: PropertyCleaningQuote,
  recipientEmail: string
): Promise<{ success: boolean; message: string }> {
  const content = generatePropertyCleaningQuoteEmail(quote);
  if (SENDGRID_API_KEY) {
    try {
      await sg({ to: recipientEmail, from: { email: SENDGRID_FROM_EMAIL, name: SENDGRID_FROM_NAME }, subject: content.subject, text: content.text, html: content.html });
      return { success: true, message: "Email sent via SendGrid" };
    } catch (err: any) {
      console.error("SendGrid error:", err);
      return { success: false, message: `Failed to send email: ${err.message}` };
    }
  }
  devLog("PROPERTY CLEANING QUOTE EMAIL", recipientEmail, content.subject, content.text);
  return { success: true, message: "Email logged to console (SendGrid not configured)" };
}

export async function sendRestorationQuoteEmail(
  quote: QuoteRequest,
  recipientEmail: string
): Promise<{ success: boolean; message: string }> {
  const content = generateRestorationQuoteEmail(quote);
  if (SENDGRID_API_KEY) {
    try {
      await sg({ to: recipientEmail, from: { email: SENDGRID_FROM_EMAIL, name: SENDGRID_FROM_NAME }, subject: content.subject, text: content.text, html: content.html });
      return { success: true, message: "Email sent via SendGrid" };
    } catch (err: any) {
      console.error("SendGrid error:", err);
      return { success: false, message: `Failed to send email: ${err.message}` };
    }
  }
  devLog("RESTORATION QUOTE EMAIL", recipientEmail, content.subject, content.text);
  return { success: true, message: "Email logged to console (SendGrid not configured)" };
}

// ── SMS ───────────────────────────────────────────────────────────────────────

async function sendSMS(to: string, body: string): Promise<{ success: boolean; message: string }> {
  if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const twilio = require("twilio");
      const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
      const phone = to.startsWith("+") ? to : `+1${to.replace(/\D/g, "")}`;
      await client.messages.create({ body, from: TWILIO_PHONE_NUMBER, to: phone });
      return { success: true, message: "SMS sent via Twilio" };
    } catch (err: any) {
      console.error("Twilio error:", err);
      return { success: false, message: `Failed to send SMS: ${err.message}` };
    }
  }
  console.log("=== SMS ===\nTo:", to, "\nBody:", body, "\n==========");
  return { success: true, message: "SMS logged to console (Twilio not configured)" };
}

export async function sendPropertyCleaningQuoteSMS(quote: PropertyCleaningQuote, recipientPhone: string) {
  return sendSMS(recipientPhone, generatePropertyCleaningQuoteSMS(quote));
}

export async function sendRestorationQuoteSMS(quote: QuoteRequest, recipientPhone: string) {
  return sendSMS(recipientPhone, generateRestorationQuoteSMS(quote));
}
