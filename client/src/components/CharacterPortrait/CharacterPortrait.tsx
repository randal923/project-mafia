import Image from "next/image";
import { displayText, typography } from "../../design-system/typography";
import { cx } from "../../lib/cx";
import { Diamond } from "../Diamond/Diamond";

type CharacterPortraitFit = "aspect" | "fill";

type CharacterPortraitProps = {
  className?: string;
  fit?: CharacterPortraitFit;
  image?: {
    alt: string;
    src: string;
  };
  name: string;
  title?: string;
};

function getMonogram(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function CharacterPortrait({
  className,
  fit = "aspect",
  image,
  name,
  title,
}: CharacterPortraitProps) {
  const classNames = cx(
    "w-full overflow-hidden rounded-panel border border-line bg-surface shadow-panel",
    fit === "fill" && "flex h-full flex-col",
    className,
  );
  const portraitAreaClassNames = cx(
    "relative flex items-center justify-center bg-black/40",
    fit === "aspect" ? "aspect-4/5" : "min-h-0 flex-1",
  );

  return (
    <figure
      aria-label={`Portrait of ${name}`}
      className={cx("m-0", classNames)}
    >
      <div className={portraitAreaClassNames}>
        {image ? (
          <Image
            alt={image.alt}
            className="h-full w-full object-cover"
            fill
            sizes="(min-width: 1024px) 24rem, 100vw"
            src={image.src}
          />
        ) : (
          <div className="flex flex-col items-center gap-4">
            <Diamond className="border-brass" size="large" />
            <p className={`m-0 ${displayText} text-7xl text-faint`}>
              {getMonogram(name)}
            </p>
            <p className={`m-0 ${typography.metadata}`}>No mugshot on file</p>
          </div>
        )}
      </div>
      <figcaption className="border-t border-line px-4 py-3">
        <p className={`m-0 ${displayText} text-2xl text-title`}>{name}</p>
        {title ? (
          <p className={`mt-1 mb-0 ${typography.metadata}`}>{title}</p>
        ) : null}
      </figcaption>
    </figure>
  );
}
