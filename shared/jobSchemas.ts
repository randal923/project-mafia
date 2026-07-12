import { z } from "zod";

export const acceptJobRequestSchema = z
  .object({
    /** Crew member ids to bring along; capacity is leadership-gated. */
    crewIds: z.array(z.string().min(1)).max(8).optional(),
    offerId: z.string().min(1, { error: "offerId is required." }),
  })
  .strict();

export type AcceptJobRequest = z.infer<typeof acceptJobRequestSchema>;

export const chooseRequestSchema = z
  .object({
    choiceId: z.string().min(1, { error: "choiceId is required." }),
  })
  .strict();

export type ChooseRequest = z.infer<typeof chooseRequestSchema>;

/**
 * LLM output contracts. The model only ever writes prose — every number,
 * check, and outcome tier comes from the engine.
 */
export const beatChoiceNarrativeSchema = z.object({
  intent: z.string().min(1).max(220),
  label: z.string().min(1).max(120),
  riskHint: z.string().min(1).max(180),
});

export const beatNarrativeSchema = z.object({
  choices: z.array(beatChoiceNarrativeSchema).length(2),
  scene: z.string().min(1).max(1400),
  stakes: z.string().min(1).max(320),
  title: z.string().min(1).max(90),
});

export type BeatNarrativeOutput = z.infer<typeof beatNarrativeSchema>;

export const outcomeNarrativeSchema = z.object({
  narration: z.string().min(1).max(1600),
  storySummary: z.string().min(1).max(320),
  title: z.string().min(1).max(90),
});

export type OutcomeNarrativeOutput = z.infer<typeof outcomeNarrativeSchema>;
