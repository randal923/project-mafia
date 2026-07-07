import type { ReactNode } from "react";

type ToastTone = "success" | "failure" | "info" | "warning";

type ToastProps = {
  action?: ReactNode;
  message: string;
  onDismiss?: () => void;
  title: string;
  tone?: ToastTone;
};

const toneClasses: Record<ToastTone, string> = {
  failure: "border-danger-strong text-danger-strong",
  info: "border-teal text-teal",
  success: "border-profit text-profit",
  warning: "border-brass-bright text-brass-bright"
};

const toneLabels: Record<ToastTone, string> = {
  failure: "Failure",
  info: "Info",
  success: "Success",
  warning: "Warning"
};

const toneRoles: Record<ToastTone, "alert" | "status"> = {
  failure: "alert",
  info: "status",
  success: "status",
  warning: "status"
};

export function Toast({
  action,
  message,
  onDismiss,
  title,
  tone = "info"
}: ToastProps) {
  return (
    <section
      className={`w-full max-w-md rounded-panel border-l-2 border-y border-r border-line bg-surface-raised p-4 shadow-panel ${toneClasses[tone]}`}
      role={toneRoles[tone]}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="m-0 font-display text-xl uppercase leading-none tracking-normal text-current">
            {toneLabels[tone]}
          </p>
          <h2 className="mt-2 mb-0 font-display text-3xl uppercase leading-none tracking-normal text-title">
            {title}
          </h2>
        </div>
        {onDismiss ? (
          <button
            aria-label="Dismiss notification"
            className="min-h-8 min-w-8 cursor-pointer rounded-control border border-line bg-transparent font-display text-xl uppercase leading-none tracking-normal text-muted transition-[border-color,color] duration-150 hover:border-brass hover:text-ink focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-brass-bright"
            onClick={onDismiss}
            type="button"
          >
            X
          </button>
        ) : null}
      </div>
      <p className="mt-3 mb-0 text-base leading-relaxed text-muted">{message}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </section>
  );
}
