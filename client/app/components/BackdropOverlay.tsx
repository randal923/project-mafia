export function BackdropOverlay() {
  return (
    <div aria-hidden="true" className="absolute inset-0">
      <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--obsidian)_0%,rgb(8_8_6_/_0.9)_28%,rgb(8_8_6_/_0.5)_60%,rgb(8_8_6_/_0.76)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_76%_28%,rgb(229_213_79_/_0.16),transparent_34%),radial-gradient(circle_at_18%_86%,rgb(116_31_24_/_0.3),transparent_30%)]" />
    </div>
  );
}
