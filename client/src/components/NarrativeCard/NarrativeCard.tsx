import type { ReactNode } from "react";
import { displayText, typography } from "../../design-system/typography";
import { Frame } from "../Frame/Frame";
import { OrnamentDivider } from "../OrnamentDivider/OrnamentDivider";
import { Tag } from "../Tag/Tag";

type NarrativePriority = "standard" | "urgent";

type NarrativeCardProps = {
  action?: ReactNode;
  children: ReactNode;
  district: string;
  kicker: string;
  priority?: NarrativePriority;
  timeLabel: string;
  title: string;
};

const priorityBorderColors: Record<NarrativePriority, "brass" | "danger"> = {
  standard: "brass",
  urgent: "danger"
};

export function NarrativeCard({
  action,
  children,
  district,
  kicker,
  priority = "standard",
  timeLabel,
  title
}: NarrativeCardProps) {
  return (
    <Frame
      className="min-h-88 text-brass"
      element="article"
      headerAside={<p className={`m-0 ${typography.metadata}`}>{timeLabel}</p>}
      headerTitle={kicker}
      padding="large"
      surface="raised"
      topBorderColor={priorityBorderColors[priority]}
      withHeader
    >
      <h2
        className={`mt-2 mb-5 ${displayText} text-4xl text-title md:text-5xl`}
      >
        {title}
      </h2>
      <OrnamentDivider className="mb-5" />
      <Tag label={district} />
      <div className={`mt-8 ${typography.narrativeBody}`}>{children}</div>
      {action ? <div className="mt-8 flex justify-end">{action}</div> : null}
    </Frame>
  );
}
