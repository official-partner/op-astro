/**
 * Runs a component's script on every page: at once on the page that loads it, then again after each client-side
 * navigation when page transitions are on (op.config.json `transitions`, Astro's `<ClientRouter />`), since a module
 * script runs only once per visit. `signal` aborts when the page is left: give it to listeners on `document`, `window`
 * or a media query, and stop timers and observers with it. Used by Nav, Footer, Form, Range, Accordion, Dropdown,
 * Marquee, Modal, Slider and Tabs.
 */
export function onPage(setup: (signal: AbortSignal) => void): void {
  let page: HTMLElement | null = null;
  let controller: AbortController | undefined;

  const run = () => {
    if (document.body === page) return;
    page = document.body;
    controller?.abort();
    controller = new AbortController();
    setup(controller.signal);
  };

  run();
  document.addEventListener("astro:page-load", run);
}
