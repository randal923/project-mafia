import { ZodType } from "zod";
import {
  beatNarrativeSchema,
  outcomeNarrativeSchema,
} from "../../../../shared/jobSchemas";
import { PlayerLanguage } from "../../../../shared/language";
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
 * LLM game master. Validates every reply against the shared zod contract
 * and retries once with the validation errors quoted.
 */
export class AiNarratorService implements MissionNarrator {
  constructor(private readonly provider: OpenAiProviderService) {}

  async narrateBeat(input: NarrationInput): Promise<BeatNarrationResult> {
    const output = await this.generateValidated(
      MissionPrompts.beatPrompt(input),
      beatNarrativeSchema,
      input.player.language ?? undefined,
    );

    return {
      choices: output.choices,
      narrative: {
        body: output.scene,
        stakes: output.stakes,
        storySummary: null,
        title: output.title,
      },
    };
  }

  async narrateOutcome(
    input: OutcomeNarrationInput,
  ): Promise<OutcomeNarrationResult> {
    const output = await this.generateValidated(
      MissionPrompts.outcomePrompt(input),
      outcomeNarrativeSchema,
      input.player.language ?? undefined,
    );

    return {
      narrative: {
        body: output.narration,
        stakes: null,
        storySummary: output.storySummary,
        title: output.title,
      },
    };
  }

  private async generateValidated<T>(
    userPrompt: string,
    schema: ZodType<T>,
    language?: PlayerLanguage,
  ): Promise<T> {
    const systemPrompt = MissionPrompts.systemPrompt(language);
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
