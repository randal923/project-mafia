import { isRecord, parseJsonObject } from "./parsers";
import type { JsonObject, LLMRequest } from "./types";

export class AIProviderService {
  static async generateJson(request: LLMRequest): Promise<JsonObject> {
    const rawText = await AIProviderService.callLLM(request);
    const parsedJson = parseJsonObject(rawText);

    if (!parsedJson) {
      throw new Error("AI provider returned invalid JSON.");
    }

    return parsedJson;
  }

  private static async callLLM({
    systemPrompt,
    userPrompt,
  }: LLMRequest): Promise<string> {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not configured.");
    }

    const model =
      process.env.OPENAI_MODEL ?? process.env.AI_MODEL ?? "gpt-4o-mini";
    const endpoint =
      process.env.OPENAI_API_URL ??
      "https://api.openai.com/v1/chat/completions";
    const response = await fetch(endpoint, {
      body: JSON.stringify({
        messages: [
          {
            content: systemPrompt,
            role: "system",
          },
          {
            content: userPrompt,
            role: "user",
          },
        ],
        model,
        response_format: {
          type: "json_object",
        },
        temperature: 0.85,
      }),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    });

    if (!response.ok) {
      const errorPayload = await response.text().catch(() => "");
      throw new Error(
        errorPayload || `AI provider returned ${response.status}.`,
      );
    }

    const payload = (await response.json()) as unknown;
    const text = extractTextFromLLMResponse(payload);

    if (!text) {
      throw new Error("AI provider returned an empty response.");
    }

    return text;
  }
}

function extractTextFromLLMResponse(value: unknown): string | null {
  if (!isRecord(value)) {
    return null;
  }

  if (typeof value.output_text === "string") {
    return value.output_text;
  }

  if (Array.isArray(value.choices)) {
    for (const choice of value.choices) {
      if (!isRecord(choice) || !isRecord(choice.message)) {
        continue;
      }

      if (typeof choice.message.content === "string") {
        return choice.message.content;
      }
    }
  }

  if (Array.isArray(value.output)) {
    for (const outputItem of value.output) {
      if (!isRecord(outputItem) || !Array.isArray(outputItem.content)) {
        continue;
      }

      for (const contentItem of outputItem.content) {
        if (!isRecord(contentItem)) {
          continue;
        }

        if (typeof contentItem.text === "string") {
          return contentItem.text;
        }
      }
    }
  }

  return null;
}
