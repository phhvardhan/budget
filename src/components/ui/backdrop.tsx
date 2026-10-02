/** Slow-drifting aurora + film grain behind everything. Pure CSS, so it costs nothing on the main thread. */
export function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ink">
      <div className="absolute -left-[20%] -top-[30%] h-[80vmax] w-[80vmax] animate-drift-a rounded-full bg-[radial-gradient(closest-side,rgb(106_136_240/0.16),transparent)] blur-3xl" />
      <div className="absolute -right-[25%] top-[10%] h-[70vmax] w-[70vmax] animate-drift-b rounded-full bg-[radial-gradient(closest-side,rgb(230_211_174/0.10),transparent)] blur-3xl" />
      <div className="absolute -bottom-[40%] left-[20%] h-[75vmax] w-[75vmax] animate-drift-c rounded-full bg-[radial-gradient(closest-side,rgb(208_106_154/0.09),transparent)] blur-3xl" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_0%,rgb(10_9_13/0.55)_70%,rgb(10_9_13/0.9)_100%)]" />
      <div
        className="absolute inset-0 opacity-[0.07] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}
