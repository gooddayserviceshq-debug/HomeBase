import Anthropic from "@anthropic-ai/sdk";
import type { Express } from "express";

const GDS_SYSTEM_PROMPT = `You are the AI receptionist for Good Day Pressure Washing, a professional outdoor cleaning company in Murfreesboro, Tennessee. You help customers via Telegram.

## Services & Pricing
**Paver & Surface Restoration:**
- Basic: $0.25–$0.40/sq ft + $0.75/sq ft acrylic sealer
- Recommended: Basic + polymeric sand ($0.50/sq ft extra)
- Premium: Recommended + siloxane sealer ($1.25/sq ft)
- Condition surcharges: heavily soiled 1.25×, stained/damaged 1.5×

**Property Cleaning (min $975):**
- Driveway: $0.10–$0.15/sq ft
- Roof (soft wash): $0.20–$0.30/sq ft
- House siding: $0.08–$0.12/sq ft
- Gutters: $1.50–$2.00/linear ft
- Fence: $0.75–$1.25/linear ft

## Guidelines
- Be warm, concise (2–4 sentences), and professional
- For quotes direct them to the website quote tools
- Give ballpark pricing ranges but encourage the online quote tool for accuracy
- Do not invent services or prices not listed above
- If unsure, offer to connect them with the team`;

type ConversationMessage = { role: "user" | "assistant"; content: string };
const conversations = new Map<number, ConversationMessage[]>();

async function telegramPost(method: string, body: object) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function sendMessage(chatId: number, text: string) {
  return telegramPost("sendMessage", { chat_id: chatId, text });
}

async function sendTyping(chatId: number) {
  return telegramPost("sendChatAction", { chat_id: chatId, action: "typing" });
}

async function processMessage(chatId: number, userText: string) {
  const history = conversations.get(chatId) ?? [];
  history.push({ role: "user", content: userText });

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: GDS_SYSTEM_PROMPT,
    messages: history,
  });

  const reply =
    response.content[0]?.type === "text"
      ? response.content[0].text
      : "Sorry, I couldn't process that. Please try again.";

  history.push({ role: "assistant", content: reply });
  if (history.length > 20) history.splice(0, history.length - 20);
  conversations.set(chatId, history);

  await sendMessage(chatId, reply);
}

function verifyGatewayToken(req: any): boolean {
  const gatewayToken = process.env.OPENCLAW_GATEWAY_TOKEN;
  if (!gatewayToken) return true;
  const incoming =
    req.headers["x-openclaw-token"] ||
    req.headers["x-gateway-token"] ||
    req.headers["x-telegram-bot-api-secret-token"] ||
    req.query?.token;
  return incoming === gatewayToken;
}

export function registerTelegramRoutes(app: Express) {
  app.post("/api/telegram/webhook", async (req, res) => {
    if (!verifyGatewayToken(req)) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Acknowledge Telegram immediately — must respond within 5s
    res.sendStatus(200);

    const { message } = req.body;
    if (!message?.chat?.id || !message?.text) return;

    const chatId: number = message.chat.id;
    const text: string = message.text;

    if (text === "/start") {
      await sendMessage(
        chatId,
        "Hi! I'm the Good Day Services AI assistant 👋\n\nI can answer questions about our pressure washing and surface restoration services, pricing, and scheduling. How can I help you today?"
      );
      return;
    }

    if (text === "/help") {
      await sendMessage(
        chatId,
        "Here's what I can help with:\n\n• Service descriptions & pricing\n• Getting a quote estimate\n• Scheduling questions\n• Product information\n\nJust type your question and I'll do my best to help!"
      );
      return;
    }

    sendTyping(chatId).catch(() => {});

    processMessage(chatId, text).catch(async (err) => {
      console.error("[TelegramBot] Error:", err);
      await sendMessage(
        chatId,
        "Sorry, I ran into an issue. Please try again in a moment."
      );
    });
  });

  // Register bot webhook with Telegram (call once after deploy)
  app.post("/api/telegram/setup", async (req, res) => {
    const { webhookUrl } = req.body as { webhookUrl?: string };
    if (!webhookUrl) {
      return res.status(400).json({ error: "webhookUrl is required" });
    }
    const body: Record<string, string> = { url: webhookUrl };
    const gatewayToken = process.env.OPENCLAW_GATEWAY_TOKEN;
    if (gatewayToken) {
      body.secret_token = gatewayToken;
    }
    const result = await telegramPost("setWebhook", body);
    res.json(result);
  });

  app.get("/api/telegram/status", async (_req, res) => {
    const result = await telegramPost("getWebhookInfo", {});
    res.json(result);
  });
}
