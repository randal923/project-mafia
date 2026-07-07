import type {
  JobIntroStory,
  JobStoryBeat,
  JobStoryOutcome,
} from "../../models/job";
import { parseIntroStory, parseStoryBeat, parseStoryOutcome } from "./parsers";
import { AIProviderService } from "./provider";
import {
  createChoicePrompt,
  createGameMasterSystemPrompt,
  createIntroPrompt,
  createStoryBeatPrompt,
} from "./prompts";
import type { AIChoiceInput, AIIntroInput } from "./types";

export class AIService {
  static async createJobIntroStory({
    job,
    player,
  }: AIIntroInput): Promise<JobIntroStory> {
    const rawStory = await AIProviderService.generateJson({
      systemPrompt: createGameMasterSystemPrompt(),
      userPrompt: createIntroPrompt(player, job),
    });
    const story = parseIntroStory(rawStory, job);

    if (!story) {
      throw new Error("AI intro response was invalid.");
    }

    return story;
  }

  static async createJobStoryBeat({
    choice,
    choicePath,
    job,
    player,
    story,
  }: AIChoiceInput): Promise<JobStoryBeat> {
    const rawBeat = await AIProviderService.generateJson({
      systemPrompt: createGameMasterSystemPrompt(),
      userPrompt: createStoryBeatPrompt(player, job, story, choicePath, choice),
    });
    const beat = parseStoryBeat(rawBeat, job, choicePath.length);

    if (!beat) {
      throw new Error("AI story beat response was invalid.");
    }

    return beat;
  }

  static async resolveJobChoice({
    choice,
    choicePath,
    job,
    player,
    story,
  }: AIChoiceInput): Promise<JobStoryOutcome> {
    const rawOutcome = await AIProviderService.generateJson({
      systemPrompt: createGameMasterSystemPrompt(),
      userPrompt: createChoicePrompt(player, job, story, choicePath, choice),
    });
    const outcome = parseStoryOutcome(rawOutcome, job);

    if (!outcome) {
      throw new Error("AI outcome response was invalid.");
    }

    return outcome;
  }
}
