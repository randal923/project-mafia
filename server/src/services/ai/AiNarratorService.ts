import { ZodType } from "zod";
import {
  beatNarrativeSchema,
  outcomeNarrativeSchema,
} from "../../../../shared/jobSchemas";
import { FallbackNarratorService } from "./FallbackNarratorService";
import {
  BeatNarrationResult,
  MissionNarrator,
  NarrationInput,
  OutcomeNarrationInput,
  OutcomeNarrationResult,
} from "./MissionNarrator";
import { MissionPrompts } from "./MissionPrompts";
import { OpenAiProviderService } from "./OpenAiProviderService";

/**
 * LLM game master. Validates every reply against the shared zod contract,
 * retries once with the validation errors quoted, and hands the node to
 * the fallback narrator on a second failure — missions never block on AI.
 */
export class AiNarratorService implements MissionNarrator {
  private readonly fallback = new FallbackNarratorService();

  constructor(private readonly provider: OpenAiProviderService) {}

  async narrateBeat(input: NarrationInput): Promise<BeatNarrationResult> {
    try {
      const output = await this.generateValidated(
        MissionPrompts.beatPrompt(input),
        beatNarrativeSchema,
      );

      return {
        choices: output.choices,
        narrative: {
          body: output.scene,
          stakes: output.stakes,
          storySummary: null,
          title: output.title,
        },
        status: "ready",
      };
    } catch (err) {
      console.error(
        `AI beat narration failed for node ${input.node.id}:`,
        err,
      );
      return this.fallback.narrateBeat(input);
    }
  }

  async narrateOutcome(
    input: OutcomeNarrationInput,
  ): Promise<OutcomeNarrationResult> {
    try {
      const output = await this.generateValidated(
        MissionPrompts.outcomePrompt(input),
        outcomeNarrativeSchema,
      );

      return {
        narrative: {
          body: output.narration,
          stakes: null,
          storySummary: output.storySummary,
          title: output.title,
        },
        status: "ready",
      };
    } catch (err) {
      console.error(
        `AI outcome narration failed for node ${input.node.id}:`,
        err,
      );
      return this.fallback.narrateOutcome(input);
    }
  }

  private async generateValidated<T>(
    userPrompt: string,
    schema: ZodType<T>,
  ): Promise<T> {
    const systemPrompt = MissionPrompts.systemPrompt();
    let prompt = userPrompt;
    let lastIssues = "";

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const raw = await this.provider.generateJson({ systemPrompt, userPrompt: prompt });
      const parsed = schema.safeParse(raw);

      if (parsed.success) {
        return parsed.data;
      }

      lastIssues = JSON.stringify(parsed.error.issues);
      prompt = `${userPrompt}\n\nYour previous reply failed validation with these issues:\n${lastIssues}\nReturn corrected JSON only.`;
    }

    throw new Error(`LLM output failed validation twice: ${lastIssues}`);
  }
}
