import { NextResponse } from "next/server";
import type { Job, JobStoryChoice, JobStoryScene } from "../../../models/job";
import { maximumJobStoryChoiceDepth } from "../../../models/job";
import { AIService } from "../../../services/ai";
import { introPromptVersion } from "../../../services/ai/promptVersions";
import {
  isRecord,
  isStoryChoice,
  parseStoryChoice,
  parseStoryScene,
  readNumber,
  readString,
} from "../../../services/ai/parsers";
import { JobsService } from "../../../services/jobs";
import { getAuthenticatedPlayer } from "../../lib/getAuthenticatedPlayer";

export async function POST(request: Request) {
  try {
    const authenticatedPlayer = await getAuthenticatedPlayer(request);

    if (!authenticatedPlayer.ok) {
      return authenticatedPlayer.response;
    }

    const parsedBody = (await request.json().catch(() => ({}))) as unknown;

    if (!isRecord(parsedBody)) {
      return NextResponse.json(
        { error: "Story request body must be an object." },
        { status: 400 },
      );
    }

    const jobId = readString(parsedBody.jobId);
    const phase = readString(parsedBody.phase);

    if (!jobId || (phase !== "intro" && phase !== "choice")) {
      return NextResponse.json(
        { error: "Story request must include a valid job and phase." },
        { status: 400 },
      );
    }

    const jobs = JobsService.createJobsForPlayer(
      authenticatedPlayer.data.player,
    );
    const job = jobs.find((candidateJob) => candidateJob.id === jobId);

    if (!job) {
      return NextResponse.json(
        { error: "Requested job is no longer available." },
        { status: 404 },
      );
    }

    if (phase === "intro") {
      const story = await AIService.createJobIntroStory({
        job,
        player: authenticatedPlayer.data.player,
      });

      return NextResponse.json({ story });
    }

    const story = parseRequestStoryScene(parsedBody.story, job);
    const choice = parseStoryChoice(parsedBody.choice);
    const previousChoices = parseStoryChoicePath(parsedBody.choicePath);

    if (!story || !choice || !previousChoices) {
      return NextResponse.json(
        { error: "Story choice request is incomplete." },
        { status: 400 },
      );
    }

    if (previousChoices.length !== story.choiceDepth) {
      return NextResponse.json(
        { error: "Story choice path is out of sync." },
        { status: 400 },
      );
    }

    const choicePath = [...previousChoices, choice];

    if (choicePath.length > maximumJobStoryChoiceDepth) {
      return NextResponse.json(
        { error: "Story choice path is already complete." },
        { status: 400 },
      );
    }

    if (choicePath.length < maximumJobStoryChoiceDepth) {
      const beat = await AIService.createJobStoryBeat({
        choice,
        choicePath,
        job,
        player: authenticatedPlayer.data.player,
        story,
      });

      return NextResponse.json({
        resolution: {
          beat,
          type: "beat",
        },
      });
    }

    const outcome = await AIService.resolveJobChoice({
      choice,
      choicePath,
      job,
      player: authenticatedPlayer.data.player,
      story,
    });

    return NextResponse.json({
      resolution: {
        outcome,
        type: "outcome",
      },
    });
  } catch (error) {
    console.error("Job story API failed.", error);

    if (
      error instanceof Error &&
      error.message === "Firebase Admin credentials are not configured."
    ) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "Job story request failed." },
      { status: 500 },
    );
  }
}

function parseRequestStoryScene(
  value: unknown,
  job: Job,
): JobStoryScene | null {
  if (!isRecord(value)) {
    return null;
  }

  const choiceDepth = readNumber(value.choiceDepth, 0);
  const promptVersion = readString(value.promptVersion) ?? introPromptVersion;

  return parseStoryScene(value, job, promptVersion, choiceDepth);
}

function parseStoryChoicePath(value: unknown): JobStoryChoice[] | null {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    return null;
  }

  const choices = value.map(parseStoryChoice).filter(isStoryChoice);

  if (choices.length !== value.length) {
    return null;
  }

  return choices;
}
