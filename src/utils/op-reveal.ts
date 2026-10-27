/**
 * OP System's `op:reveal` (op-system README.md, The bridge, « An element in a tab or a slide »): when the review points
 * at an element (a comment, a link to it), the bridge dispatches `op:reveal` on that element (it bubbles, it can be
 * cancelled, detail `{ element }`). A row of slides that holds it brings the slide that holds it into the row's view,
 * as its own dots or arrows would, and calls `preventDefault()` to say it did: the bridge then scrolls the page alone
 * and outlines the element. A slide already in full view does not move. A site outside OP System never gets the event.
 *
 * `root` is the component's element the listener goes on (the slider), `track` the row that scrolls, its slides its
 * children (or, for a child laid out with `display: contents`, that child's children); `signal` the page's (onPage).
 */
export function revealSlides(
  root: HTMLElement,
  track: HTMLElement,
  signal?: AbortSignal,
): void {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");

  root.addEventListener(
    "op:reveal",
    (event) => {
      if (event.defaultPrevented) return;
      const element = (event as CustomEvent<{ element?: unknown }>).detail
        ?.element;
      if (
        !(element instanceof Element) ||
        element === track ||
        !track.contains(element)
      )
        return;
      const slides = [...track.children].flatMap((child) =>
        child.getClientRects().length ? [child] : [...child.children],
      );
      const slide = slides.find((item) => item.contains(element));
      const first = slides[0];
      if (!slide || !first) return;
      event.preventDefault();

      const box = slide.getBoundingClientRect();
      const view = track.getBoundingClientRect();
      const shown =
        box.left >= Math.max(view.left, 0) - 1 &&
        box.right <= Math.min(view.right, innerWidth) + 1;
      if (shown) return;
      const end = track.scrollWidth - track.clientWidth;
      const left = Math.max(
        0,
        Math.min(end, box.left - first.getBoundingClientRect().left),
      );
      track.scrollTo({ left, behavior: reduced.matches ? "auto" : "smooth" });
    },
    { signal },
  );
}
