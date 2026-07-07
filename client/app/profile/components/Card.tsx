import type { DragEventHandler, ReactNode } from "react";

type CardElement = "aside" | "section";
type CardTitleLevel = 1 | 2;
type CardTitleSize = "medium" | "large";
type CardTitleTracking = "normal" | "wide";

type CardProps = {
  as?: CardElement;
  children: ReactNode;
  className?: string;
  eyebrow: string;
  headerDetail?: string;
  onDragOver?: DragEventHandler<HTMLElement>;
  onDrop?: DragEventHandler<HTMLElement>;
  title: string;
  titleLevel?: CardTitleLevel;
  titleSize?: CardTitleSize;
  titleTracking?: CardTitleTracking;
};

const titleSizeClassBySize: Record<CardTitleSize, string> = {
  large: "text-3xl",
  medium: "text-2xl",
};

const titleTrackingClassByTracking: Record<CardTitleTracking, string> = {
  normal: "tracking-[0.16em]",
  wide: "tracking-[0.2em]",
};

export function Card({
  as: Root = "section",
  children,
  className,
  eyebrow,
  headerDetail,
  onDragOver,
  onDrop,
  title,
  titleLevel = 2,
  titleSize = "large",
  titleTracking = "normal",
}: CardProps) {
  const Title = titleLevel === 1 ? "h1" : "h2";

  return (
    <Root
      className={`border border-line bg-charcoal/35 ${className ?? ""}`}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className="flex items-end justify-between border-b border-line px-3 py-2">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-ash">
            {eyebrow}
          </p>
          <Title
            className={`mt-0.5 uppercase text-ivory ${titleSizeClassBySize[titleSize]} ${titleTrackingClassByTracking[titleTracking]}`}
          >
            {title}
          </Title>
        </div>
        {headerDetail ? (
          <p className="text-xs uppercase tracking-[0.14em] text-sulfur">
            {headerDetail}
          </p>
        ) : null}
      </div>

      {children}
    </Root>
  );
}
