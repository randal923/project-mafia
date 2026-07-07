"use client";

import {
  useEffect,
  useRef,
  type DialogHTMLAttributes,
  type SyntheticEvent
} from "react";
import { StoryPanel } from "../StoryPanel/StoryPanel";

type DecisionTone = "primary" | "secondary" | "danger";

type DecisionOption = {
  description: string;
  disabled?: boolean;
  id: string;
  label: string;
  onSelect?: () => void;
  tone?: DecisionTone;
};

type DecisionModalProps = Omit<
  DialogHTMLAttributes<HTMLDialogElement>,
  "children" | "open"
> & {
  eyebrow?: string;
  intro: string;
  onDismiss?: () => void;
  open: boolean;
  options: readonly [DecisionOption, DecisionOption];
  title: string;
};

const optionToneClasses: Record<DecisionTone, string> = {
  danger:
    "border-danger-strong text-ink enabled:hover:bg-danger/20 enabled:hover:text-ink",
  primary:
    "border-brass text-ink enabled:hover:border-brass-bright enabled:hover:bg-brass/10",
  secondary:
    "border-line text-muted enabled:hover:border-brass enabled:hover:text-ink"
};

export function DecisionModal({
  className,
  eyebrow = "Decision required",
  intro,
  onClose,
  onDismiss,
  open,
  options,
  title,
  ...props
}: DecisionModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    if (open && !dialog.open) {
      dialog.showModal();
      return;
    }

    if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  const handleClose = (event: SyntheticEvent<HTMLDialogElement>) => {
    onClose?.(event);
    onDismiss?.();
  };

  const classNames = [
    "fixed inset-0 m-auto max-h-[calc(100vh-2rem)] w-11/12 max-w-3xl overflow-y-auto rounded-panel border border-line bg-surface-raised p-0 text-ink shadow-panel backdrop:bg-black/80 backdrop:backdrop-blur-sm",
    className
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <dialog
      aria-label={title}
      className={classNames}
      onClose={handleClose}
      ref={dialogRef}
      {...props}
    >
      <div className="border-b border-line p-6">
        <p className="m-0 font-display text-2xl uppercase leading-none tracking-normal text-brass">
          {eyebrow}
        </p>
        <h2 className="mt-3 mb-0 font-display text-5xl uppercase leading-none tracking-normal text-title md:text-6xl">
          {title}
        </h2>
      </div>
      <div className="px-6 py-8 md:py-10">
        <StoryPanel story={intro} />
      </div>
      <div className="px-6 pb-6">
        <div className="mb-5 flex items-center gap-3" aria-hidden="true">
          <span className="h-px flex-1 bg-line" />
          <span className="h-3 w-3 rotate-45 border border-line" />
          <span className="h-px flex-1 bg-line" />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {options.map((option) => (
            <button
              className={`min-h-28 cursor-pointer rounded-control border bg-black/30 p-3 text-left transition-[background-color,border-color,color] duration-150 focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-brass-bright disabled:cursor-not-allowed disabled:opacity-50 ${optionToneClasses[option.tone ?? "secondary"]}`}
              disabled={option.disabled}
              key={option.id}
              onClick={option.onSelect}
              type="button"
            >
              <span className="block font-display text-2xl uppercase leading-none tracking-normal">
                {option.label}
              </span>
              <span className="mt-2 block text-sm leading-relaxed text-muted">
                {option.description}
              </span>
            </button>
          ))}
        </div>
      </div>
    </dialog>
  );
}
