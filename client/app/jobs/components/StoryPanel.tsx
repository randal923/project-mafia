import type {
  Job,
  JobStoryChoice,
  JobStoryOutcome,
  JobStoryScene,
} from "../../models/job";
import { OutcomePanel } from "./OutcomePanel";

type StoryPanelProps = {
  isStartingStory: boolean;
  job: Job;
  onResolveChoice: (choice: JobStoryChoice) => Promise<void>;
  outcome: JobStoryOutcome | null;
  resolvingChoiceId: string | null;
  story: JobStoryScene | null;
  storyError: string | null;
  storyPath: JobStoryScene[];
};

export function StoryPanel({
  isStartingStory,
  job,
  onResolveChoice,
  outcome,
  resolvingChoiceId,
  story,
  storyError,
  storyPath,
}: StoryPanelProps) {
  const previousScenes = storyPath.slice(0, -1);
  const nextDecisionNumber = story ? story.choiceDepth + 1 : 1;

  return (
    <article className="min-h-96 border border-line bg-charcoal/35 lg:col-span-2">
      <div className="border-b border-line px-4 py-3">
        <p className="text-xs uppercase tracking-widest text-ash">
          {job.storySeed.location}
        </p>
        <h1 className="mt-1 font-serif text-4xl font-bold uppercase tracking-widest text-ivory">
          {story?.title ?? "Docks Work"}
        </h1>
        {story ? (
          <p className="mt-2 text-xs uppercase tracking-widest text-ash">
            Choice {nextDecisionNumber}
          </p>
        ) : null}
      </div>

      <div className="space-y-5 p-4">
        {storyError ? (
          <p className="border border-blood bg-blood/20 px-4 py-3 text-sm text-ivory">
            {storyError}
          </p>
        ) : null}

        {!story ? (
          <div className="flex min-h-64 items-center justify-center">
            <p className="text-sm uppercase tracking-widest text-ash">
              {isStartingStory ? "Writing scene" : "Start a job"}
            </p>
          </div>
        ) : (
          <>
            {previousScenes.length > 0 ? (
              <div className="space-y-3">
                {previousScenes.map((pathScene) => (
                  <section
                    className="border-l border-line pl-3"
                    key={`${pathScene.choiceDepth}-${pathScene.title}`}
                  >
                    <p className="text-xs uppercase tracking-widest text-ash">
                      {pathScene.title}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-parchment">
                      {pathScene.scene}
                    </p>
                  </section>
                ))}
              </div>
            ) : null}

            <p className="text-base leading-7 text-ivory">{story.scene}</p>
            <p className="border-l-2 border-sulfur pl-4 text-sm leading-6 text-parchment">
              {story.stakes}
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              {story.choices.map((choice) => (
                <button
                  className="border border-line bg-smoke/70 p-4 text-left transition hover:border-line-strong disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={Boolean(resolvingChoiceId) || Boolean(outcome)}
                  key={choice.id}
                  onClick={() => {
                    void onResolveChoice(choice);
                  }}
                  type="button"
                >
                  <span className="block text-sm font-semibold uppercase tracking-widest text-sulfur">
                    {resolvingChoiceId === choice.id
                      ? "Resolving"
                      : choice.label}
                  </span>
                  <span className="mt-3 block text-sm leading-6 text-ivory">
                    {choice.intent}
                  </span>
                  <span className="mt-3 block text-xs uppercase tracking-widest text-ash">
                    {choice.riskHint}
                  </span>
                </button>
              ))}
            </div>

            {outcome ? <OutcomePanel outcome={outcome} /> : null}
          </>
        )}
      </div>
    </article>
  );
}
