import { EnvConfig } from "../../config/env";

export type LlmRequest = {
  systemPrompt: string;
  userPrompt: string;
};

export class OpenAiProviderService {
  constructor(private readonly config: EnvConfig) {}

  /** Calls the model in JSON mode and returns the parsed object. */
  async generateJson(request: LlmRequest): Promise<unknown> {
    if (!this.config.openAiApiKey) {
      throw new Error("OPENAI_API_KEY is not configured.");
    }

    const response = await fetch(this.config.openAiApiUrl, {
      body: JSON.stringify({
        messages: [
          { content: request.systemPrompt, role: "system" },
          { content: request.userPrompt, role: "user" },
        ],
        model: this.config.openAiModel,
        response_format: { type: "json_object" },
      }),
      headers: {
        Authorization: `Bearer ${this.config.openAiApiKey}`,
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
    const text = this.extractText(payload);
    if (!text) {
      throw new Error("AI provider returned an empty response.");
    }

    return JSON.parse(text) as unknown;
  }

  private extractText(payload: unknown): string | null {
    if (typeof payload !== "object" || payload === null) {
      return null;
    }

    const record = payload as Record<string, unknown>;
    if (typeof record.output_text === "string") {
      return record.output_text;
    }

    const choices = record.choices;
    if (Array.isArray(choices) && choices.length > 0) {
      const message = (choices[0] as Record<string, unknown> | undefined)
        ?.message as Record<string, unknown> | undefined;
      if (typeof message?.content === "string") {
        return message.content;
      }
    }

    return null;
  }
}
