import type { ReactNode } from "react";
import { toneTextClasses } from "../../design-system/tones";
import { typography } from "../../design-system/typography";
import { Frame } from "../Frame/Frame";

type ToastTone = "success" | "failure" | "info" | "warning";

type ToastProps = {
  action?: ReactNode;
  message: string;
  onDismiss?: () => void;
  title: string;
  tone?: ToastTone;
};

const toneTokens: Record<
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
  const toneToken = toneTokens[tone];

  return (
    <Frame
      className={`w-full max-w-md shadow-panel ${toneTextClasses[toneToken]}`}
      element="section"
      headerDismissLabel="Dismiss notification"
      headerLabel={toneLabels[tone]}
      headerTitle={title}
      onHeaderDismiss={onDismiss}
      role={toneRoles[tone]}
      topBorderColor={toneToken}
      withHeader
    >
      <p className={`m-0 ${typography.paragraph}`}>{message}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </Frame>
  );
}
