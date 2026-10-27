/**
 * The site's finishing touches, as op.config.json turns them on (Oct 27, 2026): the loading screen (`loader`), the
 * transition between pages (`transition`) and the smooth scroll (`smoothScroll`). Each is off (`false`, the default)
 * or one of its presets; `"custom"` is the site's own, made by Claude from the team's words
 * (src/components/system/LoaderCustom.astro, TransitionCustom.astro). Read by the layout and by OP System's
 * integration (integrations/op-system.mjs), which announces them in site.json `motion`.
 *
 * Older keys still read: `"loader": true` is the mark, `"transitions": true` the short slide.
 */
export const LOADER_PRESETS = ["mark", "counter", "curtain"] as const;
export const TRANSITION_PRESETS = ["fade", "slide", "curtain"] as const;
export const SCROLL_INTENSITIES = ["light", "medium", "strong"] as const;

export type LoaderPreset = (typeof LOADER_PRESETS)[number] | "custom";
export type TransitionPreset = (typeof TRANSITION_PRESETS)[number] | "custom";
export type ScrollIntensity = (typeof SCROLL_INTENSITIES)[number];

export interface Finishes {
  loader: LoaderPreset | null;
  transition: TransitionPreset | null;
  smoothScroll: { intensity: ScrollIntensity; touch: boolean } | null;
}

/** Lenis's `lerp` for each intensity: the share of the distance left that the page covers at each frame (1 is the
 * browser's own scroll). Light stays close to it; strong glides longest. */
export const SCROLL_LERP: Record<ScrollIntensity, number> = {
  light: 0.16,
  medium: 0.1,
  strong: 0.065,
};

const pick = <T extends string>(
  value: unknown,
  list: readonly string[],
  on: T,
): T | null => {
  if (value === true) return on;
  if (typeof value !== "string") return null;
  return list.includes(value) || value === "custom" ? (value as T) : null;
};

export function finishes(config: Record<string, unknown>): Finishes {
  const loader = pick<LoaderPreset>(config.loader, LOADER_PRESETS, "mark");
  const transition =
    pick<TransitionPreset>(config.transition, TRANSITION_PRESETS, "slide") ??
    (config.transitions === true ? "slide" : null);
  const intensity =
    config.smoothScroll === true
      ? "medium"
      : SCROLL_INTENSITIES.find((i) => i === config.smoothScroll);
  return {
    loader,
    transition,
    smoothScroll: intensity
      ? { intensity, touch: config.smoothScrollTouch === true }
      : null,
  };
}
