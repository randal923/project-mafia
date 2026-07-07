import type { ReactNode } from "react";
import { Frame } from "../Frame/Frame";

type ToastTone = "success" | "failure" | "info" | "warning";

type ToastProps = {
  action?: ReactNode;
  message: string;
  onDismiss?: () => void;
  title: string;
  tone?: ToastTone;
};

const toneClasses: Record<ToastTone, string> = {
  failure: "text-danger-strong",
  info: "text-teal",
  success: "text-profit",
  warning: "text-brass-bright"
};

const toneBorderColors: Record<
  ToastTone,
  "brassBright" | "danger" | "profit" | "teal"
> = {
  failure: "danger",
  info: "teal",
  success: "profit",
  warning: "brassBright"
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
    <Frame
      className={`w-full max-w-md shadow-panel ${toneClasses[tone]}`}
      element="section"
      headerDismissLabel="Dismiss notification"
      headerLabel={toneLabels[tone]}
      headerTitle={title}
      onHeaderDismiss={onDismiss}
      role={toneRoles[tone]}
      topBorderColor={toneBorderColors[tone]}
      withHeader
    >
      <p className="m-0 text-base leading-relaxed text-muted">{message}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </Frame>
  );
}
