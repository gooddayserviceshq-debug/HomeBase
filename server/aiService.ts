import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface Part {
  name: string;
  description: string;
  estimatedCost: string;
  homeDepotSearchTerm: string;
  commonMistake?: string;
}

export interface Step {
  stepNumber: number;
  title: string;
  description: string;
  tip?: string;
}

export interface DiagnosisResult {
  problemTitle: string;
  problemDescription: string;
  severity: "minor" | "moderate" | "serious" | "emergency";
  landlordResponsible: boolean;
  landlordExplanation: string;
  diyDifficulty: "easy" | "moderate" | "hard" | "dont-diy";
  diyExplanation: string;
  partsNeeded: Part[];
  steps: Step[];
  whenToCallPro: string;
  safetyWarnings: string[];
  estimatedCost: { diy: string; professional: string };
  expertNote: string;
}

const SYSTEM_PROMPT = `You are HomeHero, an expert home diagnosis AI powered by decades of combined trade knowledge.
You analyze photos of home problems and provide honest, practical guidance.

You have the knowledge of:
- Master plumbers, electricians, HVAC technicians
- Structural engineers and general contractors
- Tile setters, painters, roofers, and landscapers

Your job is to:
1. Identify what's actually wrong (not vague)
2. Be honest about whether a landlord is legally responsible
3. Give real DIY guidance — don't be overly cautious, but be safe
4. List exact parts with real product names so the homeowner can buy them
5. Know when to say "call a pro immediately" (water near electrical, structural issues, gas)

Always respond with valid JSON matching the DiagnosisResult schema exactly.`;

export async function diagnoseHomeProblem(
  imageBase64: string,
  mimeType: string,
  problemDescription: string,
  playerRole: "renter" | "homeowner"
): Promise<DiagnosisResult> {
  const roleContext =
    playerRole === "renter"
      ? "The player is a RENTER. Pay special attention to whether this is landlord responsibility under typical housing codes."
      : "The player is a HOMEOWNER. Focus on DIY options and cost savings.";

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mimeType as
                | "image/jpeg"
                | "image/png"
                | "image/gif"
                | "image/webp",
              data: imageBase64,
            },
          },
          {
            type: "text",
            text: `${roleContext}

Player's description: "${problemDescription}"

Analyze this home problem and respond with ONLY a JSON object (no markdown, no explanation) matching this exact structure:
{
  "problemTitle": "short title",
  "problemDescription": "2-3 sentence plain-English explanation",
  "severity": "minor|moderate|serious|emergency",
  "landlordResponsible": true|false,
  "landlordExplanation": "explain landlord/tenant responsibility in 1-2 sentences",
  "diyDifficulty": "easy|moderate|hard|dont-diy",
  "diyExplanation": "honest assessment of DIY feasibility",
  "partsNeeded": [
    {
      "name": "exact product name",
      "description": "what it does and specs needed",
      "estimatedCost": "$X-Y",
      "homeDepotSearchTerm": "exact search term for Home Depot",
      "commonMistake": "optional: what people often buy wrong"
    }
  ],
  "steps": [
    {
      "stepNumber": 1,
      "title": "step title",
      "description": "clear instructions",
      "tip": "optional pro tip"
    }
  ],
  "whenToCallPro": "specific condition that should trigger calling a professional",
  "safetyWarnings": ["warning 1", "warning 2"],
  "estimatedCost": {
    "diy": "$X-Y including parts",
    "professional": "$X-Y typical quote"
  },
  "expertNote": "one sentence of master-level wisdom about this specific problem"
}`,
          },
        ],
      },
    ],
  });

  const raw = (message.content[0] as { type: string; text: string }).text;
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
  return JSON.parse(cleaned) as DiagnosisResult;
}
