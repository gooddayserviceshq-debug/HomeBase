// Email sending functionality
// This module handles sending emails via SendGrid or fallback to console logging

import { 
  generatePropertyCleaningQuoteEmail,
  generateRestorationQuoteEmail,
  generatePropertyCleaningQuoteSMS,
  generateRestorationQuoteSMS
} from "./emailService";
import type { PropertyCleaningQuote, QuoteRequest } from "@shared/schema";

// Check if SendGrid is configured
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || "quotes@gooddayservices.com";
const SENDGRID_FROM_NAME = process.env.SENDGRID_FROM_NAME || "Good Day Services";

// Twilio configuration
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

// Generic email sending function
export async function sendEmail({
  to,
  subject,
  text,
  html
}: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<{ success: boolean; message: string }> {
  if (SENDGRID_API_KEY) {
    try {
      const sgMail = require("@sendgrid/mail");
      sgMail.setApiKey(SENDGRID_API_KEY);
      
      const msg = {
        to,
        from: {
          email: SENDGRID_FROM_EMAIL,
          name: SENDGRID_FROM_NAME
        },
        subject,
        text,
        html: html || text,
      };
      
      await sgMail.send(msg);
      return { success: true, message: "Email sent successfully via SendGrid" };
    } catch (error: any) {
      console.error("SendGrid error:", error);
      return { success: false, message: `Failed to send email: ${error.message}` };
    }
  } else {
    // Fallback to console logging for development
    console.log("=== EMAIL ===");
    console.log("To:", to);
    console.log("Subject:", subject);
    console.log("Text:", text);
    console.log("==============");
    
    return { 
      success: true, 
      message: "Email logged to console (SendGrid not configured)" 
    };
  }
}

export async function sendPropertyCleaningQuoteEmail(
  quote: PropertyCleaningQuote,
  recipientEmail: string
): Promise<{ success: boolean; message: string }> {
  const emailContent = generatePropertyCleaningQuoteEmail(quote);
  
  if (SENDGRID_API_KEY) {
    try {
      // SendGrid implementation
      const sgMail = require("@sendgrid/mail");
      sgMail.setApiKey(SENDGRID_API_KEY);
      
      const msg = {
        to: recipientEmail,
        from: {
          email: SENDGRID_FROM_EMAIL,
          name: SENDGRID_FROM_NAME
        },
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html,
      };
      
      await sgMail.send(msg);
      return { success: true, message: "Email sent successfully via SendGrid" };
    } catch (error: any) {
      console.error("SendGrid error:", error);
      return { success: false, message: `Failed to send email: ${error.message}` };
    }
  } else {
    // Fallback to console logging for development
    console.log("=== PROPERTY CLEANING QUOTE EMAIL ===");
    console.log("To:", recipientEmail);
    console.log("Subject:", emailContent.subject);
    console.log("Content Preview:", emailContent.text.substring(0, 200) + "...");
    console.log("=====================================");
    
    return { 
      success: true, 
      message: "Email logged to console (SendGrid not configured)" 
    };
  }
}

export async function sendRestorationQuoteEmail(
  quote: QuoteRequest,
  recipientEmail: string
): Promise<{ success: boolean; message: string }> {
  const emailContent = generateRestorationQuoteEmail(quote);
  
  if (SENDGRID_API_KEY) {
    try {
      // SendGrid implementation
      const sgMail = require("@sendgrid/mail");
      sgMail.setApiKey(SENDGRID_API_KEY);
      
      const msg = {
        to: recipientEmail,
        from: {
          email: SENDGRID_FROM_EMAIL,
          name: SENDGRID_FROM_NAME
        },
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html,
      };
      
      await sgMail.send(msg);
      return { success: true, message: "Email sent successfully via SendGrid" };
    } catch (error: any) {
      console.error("SendGrid error:", error);
      return { success: false, message: `Failed to send email: ${error.message}` };
    }
  } else {
    // Fallback to console logging for development
    console.log("=== RESTORATION QUOTE EMAIL ===");
    console.log("To:", recipientEmail);
    console.log("Subject:", emailContent.subject);
    console.log("Content Preview:", emailContent.text.substring(0, 200) + "...");
    console.log("================================");
    
    return { 
      success: true, 
      message: "Email logged to console (SendGrid not configured)" 
    };
  }
}

export async function sendPropertyCleaningQuoteSMS(
  quote: PropertyCleaningQuote,
  recipientPhone: string
): Promise<{ success: boolean; message: string }> {
  const smsContent = generatePropertyCleaningQuoteSMS(quote);
  
  if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER) {
    try {
      // Twilio implementation
      const twilio = require("twilio");
      const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
      
      // Format phone number if needed (add +1 for US numbers)
      const formattedPhone = recipientPhone.startsWith("+") 
        ? recipientPhone 
        : `+1${recipientPhone.replace(/\D/g, "")}`;
      
      await client.messages.create({
        body: smsContent,
        from: TWILIO_PHONE_NUMBER,
        to: formattedPhone
      });
      
      return { success: true, message: "SMS sent successfully via Twilio" };
    } catch (error: any) {
      console.error("Twilio error:", error);
      return { success: false, message: `Failed to send SMS: ${error.message}` };
    }
  } else {
    // Fallback to console logging for development
    console.log("=== PROPERTY CLEANING QUOTE SMS ===");
    console.log("To:", recipientPhone);
    console.log("Message:", smsContent);
    console.log("====================================");
    
    return { 
      success: true, 
      message: "SMS logged to console (Twilio not configured)" 
    };
  }
}

export async function sendRestorationQuoteSMS(
  quote: QuoteRequest,
  recipientPhone: string
): Promise<{ success: boolean; message: string }> {
  const smsContent = generateRestorationQuoteSMS(quote);
  
  if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER) {
    try {
      // Twilio implementation
      const twilio = require("twilio");
      const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
      
      // Format phone number if needed (add +1 for US numbers)
      const formattedPhone = recipientPhone.startsWith("+") 
        ? recipientPhone 
        : `+1${recipientPhone.replace(/\D/g, "")}`;
      
      await client.messages.create({
        body: smsContent,
        from: TWILIO_PHONE_NUMBER,
        to: formattedPhone
      });
      
      return { success: true, message: "SMS sent successfully via Twilio" };
    } catch (error: any) {
      console.error("Twilio error:", error);
      return { success: false, message: `Failed to send SMS: ${error.message}` };
    }
  } else {
    // Fallback to console logging for development
    console.log("=== RESTORATION QUOTE SMS ===");
    console.log("To:", recipientPhone);
    console.log("Message:", smsContent);
    console.log("==============================");
    
    return { 
      success: true, 
      message: "SMS logged to console (Twilio not configured)" 
    };
  }
}