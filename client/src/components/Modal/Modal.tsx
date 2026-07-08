"use client";

import {
  useEffect,
  useRef,
  type DialogHTMLAttributes,
  type MouseEvent,
  type SyntheticEvent
} from "react";
import { displayText, typography } from "../../design-system/typography";
import { cx } from "../../lib/cx";
import { Frame } from "../Frame/Frame";
import { OrnamentDivider } from "../OrnamentDivider/OrnamentDivider";

type ModalTone = "primary" | "secondary" | "danger";

type ModalOption = {
  description: string;
  disabled?: boolean;
  id: string;
  label: string;
  onSelect?: () => void;
  tone?: ModalTone;
};

type ModalProps = Omit<
  DialogHTMLAttributes<HTMLDialogElement>,
  "children" | "open"
> & {
  eyebrow?: string;
  intro: string;
  onDismiss?: () => void;
  open: boolean;
  options: readonly [ModalOption, ModalOption];
  title: string;
};

const optionToneClasses: Record<ModalTone, string> = {
  danger:
    "border-danger-strong text-ink enabled:hover:bg-danger/20 enabled:hover:text-ink",
  primary:
    "border-brass text-ink enabled:hover:border-brass-bright enabled:hover:bg-brass/10",
  secondary:
    "border-line text-muted enabled:hover:border-brass enabled:hover:text-ink"
};

export function Modal({
  className,
  eyebrow = "Decision required",
  intro,
  onClick,
  onClose,
  onDismiss,
  open,
  options,
  title,
  ...props
}: ModalProps) {
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

  const handleClick = (event: MouseEvent<HTMLDialogElement>) => {
    onClick?.(event);

    if (event.target === dialogRef.current) {
      dialogRef.current?.close();
    }
  };

  const classNames = cx(
    "fixed inset-0 m-auto max-h-[calc(100vh-2rem)] w-11/12 max-w-3xl overflow-y-auto rounded-panel border border-line bg-surface-raised p-0 text-ink shadow-panel backdrop:bg-black/80 backdrop:backdrop-blur-sm",
    className
  );

  return (
    <dialog
      aria-label={title}
      className={classNames}
      onClick={handleClick}
      onClose={handleClose}
      ref={dialogRef}
      {...props}
    >
      <div className="border-b border-line p-6">
        <p className={`m-0 ${typography.eyebrow}`}>{eyebrow}</p>
        <h2 className={`mt-3 mb-0 ${typography.dialogTitle}`}>{title}</h2>
      </div>
      <div className="px-6 py-8 md:py-10">
        <Frame>
          <p className="m-0 text-xl leading-relaxed text-title md:text-2xl">
            {intro}
          </p>
        </Frame>
      </div>
      <div className="px-6 pb-6">
        <OrnamentDivider className="mb-5" />
        <div className="grid gap-3 md:grid-cols-2">
          {options.map((option) => (
            <button
              className={`min-h-28 cursor-pointer rounded-control border bg-black/30 p-3 text-left transition-[background-color,border-color,color] duration-150 focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-brass-bright disabled:cursor-not-allowed disabled:opacity-50 ${optionToneClasses[option.tone ?? "secondary"]}`}
              disabled={option.disabled}
              key={option.id}
              onClick={option.onSelect}
              type="button"
            >
              <span className={`block ${displayText} text-2xl`}>
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
