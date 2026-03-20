const OpenAI = require("openai");
const { TICKET_CATEGORIES, TICKET_PRIORITIES } = require("../utils/constants");

function resolveProvider() {
  const apiKey = process.env.OPENAI_API_KEY || "";
  const baseURL = process.env.OPENAI_BASE_URL || "";

  if (baseURL.includes("generativelanguage.googleapis.com") || apiKey.startsWith("AIza")) {
    return "gemini";
  }

  if (baseURL.includes("api.groq.com") || apiKey.startsWith("gsk_")) {
    return "groq";
  }

  if (baseURL.includes("api.x.ai") || apiKey.startsWith("xai-")) {
    return "xai";
  }

  return "openai";
}

function createAiClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const provider = resolveProvider();

  const defaultBaseUrls = {
    gemini: "https://generativelanguage.googleapis.com/v1beta/openai/",
    groq: "https://api.groq.com/openai/v1",
    xai: "https://api.x.ai/v1",
    openai: "",
  };

  const baseURL = process.env.OPENAI_BASE_URL || defaultBaseUrls[provider];

  return new OpenAI({
    apiKey,
    ...(baseURL ? { baseURL } : {}),
  });
}

function resolveModelName() {
  const configuredModel = process.env.OPENAI_MODEL;
  if (configuredModel) {
    return configuredModel;
  }

  const provider = resolveProvider();
  if (provider === "gemini") {
    return "gemini-2.0-flash";
  }

  if (provider === "groq") {
    return "llama-3.1-8b-instant";
  }

  if (provider === "xai") {
    return "grok-2-latest";
  }

  return "gpt-4o-mini";
}

function isGoogleAiMode() {
  return resolveProvider() === "gemini";
}

function usesChatCompletionsMode() {
  const provider = resolveProvider();
  return provider === "gemini" || provider === "groq" || provider === "xai";
}

async function requestModelText(prompt, temperature) {
  const model = resolveModelName();

  if (isGoogleAiMode()) {
    const fallbackModels = [model, "gemini-2.0-flash", "gemini-1.5-flash"];
    const uniqueModels = [...new Set(fallbackModels)];
    let lastError = null;

    for (const candidateModel of uniqueModels) {
      try {
        const completion = await client.chat.completions.create({
          model: candidateModel,
          messages: [{ role: "user", content: prompt }],
          temperature,
        });

        return completion.choices?.[0]?.message?.content || "";
      } catch (error) {
        lastError = error;

        // 404s are often model/endpoint compatibility mismatches, so try fallback models.
        if (error?.status === 404) {
          continue;
        }

        throw error;
      }
    }

    throw lastError || new Error("AI request failed");
  }

  if (usesChatCompletionsMode()) {
    const completion = await client.chat.completions.create({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature,
    });

    return completion.choices?.[0]?.message?.content || "";
  }

  const completion = await client.responses.create({
    model,
    input: prompt,
    temperature,
  });

  return completion.output_text || "";
}

const client = createAiClient();

function extractJson(text) {
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
    throw new Error("No JSON object in AI response");
  }

  const jsonSlice = text.slice(firstBrace, lastBrace + 1);
  return JSON.parse(jsonSlice);
}

function normalizeCategory(value) {
  return TICKET_CATEGORIES.includes(value) ? value : "General Inquiry";
}

function normalizePriority(value) {
  return TICKET_PRIORITIES.includes(value) ? value : "Medium";
}

function sanitizeDraftResponse(value) {
  if (!value) {
    return null;
  }

  const MAX_CHARS = 420;
  const compact = value
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  if (compact.length <= MAX_CHARS) {
    return compact;
  }

  const slice = compact.slice(0, MAX_CHARS + 1);
  const boundaryCandidates = [
    slice.lastIndexOf(". "),
    slice.lastIndexOf("! "),
    slice.lastIndexOf("? "),
    slice.lastIndexOf("\n"),
  ];

  const boundary = Math.max(...boundaryCandidates);
  const cutoff = boundary > 200 ? boundary + 1 : MAX_CHARS;

  return `${slice.slice(0, cutoff).trim()}...`;
}

async function classifyTicket(description) {
  if (!client) {
    return {
      category: "General Inquiry",
      priority: "Medium",
      aiAvailable: false,
    };
  }

  const prompt = `You are a support AI for BookLeaf Publishing.
Classify the query into one of:
- Royalty & Payments
- ISBN & Metadata Issues
- Printing & Quality
- Distribution & Availability
- Book Status & Production Updates
- General Inquiry

Also assign priority:
- Critical / High / Medium / Low

Return JSON:
{ category: "", priority: "" }

Query: ${description}`;

  try {
    const outputText = (await requestModelText(prompt, 0.2)) || "{}";
    const parsed = extractJson(outputText);

    return {
      category: normalizeCategory(parsed.category),
      priority: normalizePriority(parsed.priority),
      aiAvailable: true,
    };
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[aiService] classifyTicket failed", {
        status: error?.status,
        message: error?.message,
      });
    }

    return {
      category: "General Inquiry",
      priority: "Medium",
      aiAvailable: false,
    };
  }
}

async function generateDraftResponse(description, bookData) {
  if (!client) {
    return { draft: null, aiAvailable: false };
  }

  const prompt = `You are a BookLeaf support agent.

Write a concise admin-ready response the team can send with minimal edits.

Format rules (strict):
- 3 short paragraphs only
- 70-90 words total
- No greeting, no sign-off, no placeholders
- Keep language direct and professional

Content rules:
- Paragraph 1: acknowledge the issue and summarize the core concern in one sentence
- Paragraph 2: explain what action is being taken and include a clear timeline
- Paragraph 3: state the next update/expected follow-up and invite the author to share missing details

Knowledge:
- Royalties paid quarterly within 45 days
- ISBN issues are high priority
- Printing issues -> free reprint
- Distribution issues -> 24-48 hrs fix

User Query:
${description}

Book Data:
${JSON.stringify(bookData || {}, null, 2)}

Return only the final response text.`;

  try {
    const outputText = await requestModelText(prompt, 0.2);

    return {
      draft: sanitizeDraftResponse(outputText),
      aiAvailable: true,
    };
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[aiService] generateDraftResponse failed", {
        status: error?.status,
        message: error?.message,
      });
    }

    return { draft: null, aiAvailable: false };
  }
}

async function refineAiSuggestion(originalSuggestion, question, context = []) {
  if (!client) {
    return { refinedSuggestion: originalSuggestion, reply: "AI service unavailable", aiAvailable: false };
  }

  const conversationHistory = context
    .map((msg) => `${msg.role === "user" ? "Admin" : "AI"}: ${msg.content}`)
    .join("\n");

  const prompt = `You are a helpful AI assistant refining support responses for BookLeaf.

Original Suggestion:
"${originalSuggestion}"

${conversationHistory ? `Conversation so far:\n${conversationHistory}\n` : ""}

Admin's latest request: "${question}"

Your task:
1. Refine the original suggestion based on the admin's request
2. Provide a concise 1-2 sentence reply explaining the refinement

Return ONLY this JSON (no extra text):
{
  "refinedSuggestion": "The refined response text here",
  "reply": "Brief explanation of what I changed"
}`;

  try {
    const outputText = await requestModelText(prompt, 0.3);
    const parsed = extractJson(outputText);

    return {
      refinedSuggestion: parsed.refinedSuggestion || originalSuggestion,
      reply: parsed.reply || "Suggestion refined",
      aiAvailable: true,
    };
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[aiService] refineAiSuggestion failed", {
        status: error?.status,
        message: error?.message,
      });
    }

    return {
      refinedSuggestion: originalSuggestion,
      reply: "Unable to refine at the moment",
      aiAvailable: false,
    };
  }
}

module.exports = {
  classifyTicket,
  generateDraftResponse,
  refineAiSuggestion,
};
