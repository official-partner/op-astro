/**
 * The page's smooth scroll (op.config.json "smoothScroll": src/components/system/SmoothScroll.astro starts Lenis). A
 * script that needs it waits for it here, never on a global:
 *
 *   onLenis((lenis) => lenis.on("scroll", () => …));
 *
 * A site that adds GSAP's ScrollTrigger hands Lenis's frames to GSAP's ticker once, where it registers the plugin:
 *
 *   gsap.registerPlugin(ScrollTrigger);
 *   scrollTriggerWithLenis(gsap, ScrollTrigger);
 *
 * (GSAP loaded from a CDN, as `window.gsap` and `window.ScrollTrigger`, is found on its own.)
 */
import type Lenis from "lenis";

interface Ticker {
  add(callback: (time: number) => void): void;
  remove(callback: (time: number) => void): void;
  lagSmoothing(threshold: number): void;
}
interface Gsap {
  ticker: Ticker;
}
interface ScrollTriggerLike {
  update(): void;
}

let current: Lenis | null = null;
let gsapPair: [Gsap, ScrollTriggerLike] | null = null;
let handTo: ((pair: [Gsap, ScrollTriggerLike]) => void) | null = null;
const waiting = new Set<(lenis: Lenis) => void>();

/** The page's Lenis while the smooth scroll runs, else null. */
export const pageLenis = (): Lenis | null => current;

/** Runs `use` with the page's Lenis, now when it runs, and each time it starts again (the reduced-motion setting
 * turned off). Returns a function that stops waiting. */
export function onLenis(use: (lenis: Lenis) => void): () => void {
  waiting.add(use);
  if (current) use(current);
  return () => waiting.delete(use);
}

/** Lenis's frames on GSAP's ticker, and ScrollTrigger told at each of its scrolls (Lenis's docs, GSAP ScrollTrigger). */
export function scrollTriggerWithLenis(
  gsap: Gsap,
  ScrollTrigger: ScrollTriggerLike,
): void {
  gsapPair = [gsap, ScrollTrigger];
  if (handTo) handTo(gsapPair);
}

/** Drives `lenis` (SmoothScroll.astro): its frames, Astro's page changes, OP System's « Voir » (`op:glide`). Returns
 * the function that stops it. */
export function syncLenis(lenis: Lenis): () => void {
  current = lenis;
  let frame = 0;
  let ticker: ((time: number) => void) | null = null;
  let gsap: Gsap | null = null;

  const loop = (time: number) => {
    lenis.raf(time);
    frame = requestAnimationFrame(loop);
  };
  frame = requestAnimationFrame(loop);

  handTo = ([g, ScrollTrigger]) => {
    if (gsap) return;
    cancelAnimationFrame(frame);
    gsap = g;
    lenis.on("scroll", () => ScrollTrigger.update());
    ticker = (time) => lenis.raf(time * 1000);
    g.ticker.add(ticker);
    g.ticker.lagSmoothing(0);
  };
  const found = globalThis as unknown as {
    gsap?: Gsap;
    ScrollTrigger?: ScrollTriggerLike;
  };
  if (gsapPair) handTo(gsapPair);
  else if (found.gsap?.ticker && found.ScrollTrigger)
    handTo([found.gsap, found.ScrollTrigger]);

  /* Astro's router: no glide while the page changes; the new page measured, from where the router put it */
  const leaving = () => lenis.stop();
  const arrived = () => {
    lenis.resize();
    lenis.start();
  };

  /* OP System's « Voir » (the review's bridge, op:glide): the page glides most of a screen down at the site's
     intensity, or back to the top from the foot */
  const glide = (event: Event) => {
    event.preventDefault();
    const end = document.documentElement.scrollHeight - innerHeight;
    const y = window.scrollY;
    lenis.scrollTo(y < end - 4 ? Math.min(end, y + innerHeight * 0.8) : 0);
  };

  document.addEventListener("astro:before-preparation", leaving);
  document.addEventListener("astro:after-swap", arrived);
  document.addEventListener("op:glide", glide);
  waiting.forEach((use) => use(lenis));

  return () => {
    document.removeEventListener("astro:before-preparation", leaving);
    document.removeEventListener("astro:after-swap", arrived);
    document.removeEventListener("op:glide", glide);
    cancelAnimationFrame(frame);
    if (gsap && ticker) gsap.ticker.remove(ticker);
    handTo = null;
    lenis.destroy();
    current = null;
  };
}
