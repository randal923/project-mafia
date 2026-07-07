type StoryPanelProps = {
  className?: string;
  story: string;
};

export function StoryPanel({ className, story }: StoryPanelProps) {
  const classNames = [
    "rounded-panel border border-line bg-black/25 p-5 md:p-6",
    className
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={classNames}>
      <p className="m-0 text-xl leading-relaxed text-title md:text-2xl">
        {story}
      </p>
    </div>
  );
}
