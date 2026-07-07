export function BackdropOverlay() {
  return (
    <div aria-hidden="true" className="absolute inset-0">
      <div className="absolute inset-0 bg-menu-veil" />
      <div className="absolute inset-0 bg-menu-glow" />
    </div>
  );
}
