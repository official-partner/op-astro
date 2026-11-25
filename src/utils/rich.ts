/* A formatted text kept as one field, as OP System's Contenu writes it (its « Formatted text »): Markdown of a few
   kinds only, its paragraphs apart by an empty line; « ## » a title, « ### » a subtitle, « - » or « 1. » a list (an
   item's second line indented under it), « > » a quote, **bold**, *italic*, [words](address). Anything else stays as
   written, as words. A plain text of paragraphs is the same text: one written before the field was formatted shows
   as it did.

   This file is one of three readers of the same Markdown, with the app's own (op-system, src/js/content-panel.js,
   mdToHtml and htmlToMd): what the app writes, this reads back the same. Keep it as the starter has it; a change
   here is a change there. A backslash before any punctuation keeps it a character (CommonMark's rule: the app writes
   « \* » for a star typed in the words, « 2025\. » for a year that starts a line, « \< » for an angle bracket). */

const esc = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const unesc = (s: string): string =>
  s.replace(/&quot;/g, '"').replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&amp;/g, "&");

/* an address a link may go to: the site's own pages, the web, an email, a phone; never a script */
const safeHref = (href: string): string | null => {
  const h = href.trim();
  if (/^(\/(?!\/)|#|https?:\/\/|mailto:|tel:)/i.test(h)) return h;
  return null;
};

const MD_ESC = /\\([!-/:-@[-`{-~])/g;

/* the words of a block: its links, bold and italic */
const inline = (s: string, br = "<br>"): string => {
  const kept: string[] = [];
  const keep = (x: string) => `\u0000${kept.push(x) - 1}\u0000`;
  const back = (x: string) => x.replace(/\u0000(\d+)\u0000/g, (_m, i: string) => kept[Number(i)]);
  let out = esc(s.replace(MD_ESC, (_m, c: string) => keep(esc(c))));
  // a link's address is set aside: a mark in it (« /a_b_ ») is no italic
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, words: string, href: string) => {
    const safe = safeHref(unesc(back(href)));
    return safe ? `${keep(`<a href="${esc(safe)}">`)}${words}</a>` : m;
  });
  out = out.replace(/\*\*\*([^*]+)\*\*\*/g, "<strong><em>$1</em></strong>");
  out = out
    .replace(/\*\*((?:[^*]|\*(?!\*))+?)\*\*/g, "<strong>$1</strong>")
    .replace(/__([^_]+)__/g, "<strong>$1</strong>");
  out = out
    .replace(/(^|[^*])\*([^*]+)\*/g, "$1<em>$2</em>")
    .replace(/(^|[^\w_])_([^_]+)_(?!\w)/g, "$1<em>$2</em>");
  out = out.replace(/ {2,}\n|\\\n/g, br).replace(/\n/g, " ");
  return back(out);
};

/** A block's classes by its tag, as data-op-rich names them for OP System's Edit (« h2:text-style-h4 »). */
export type RichClasses = Partial<Record<"h2" | "h3" | "h4" | "p" | "blockquote" | "ul" | "ol", string>>;

/** data-op-rich's value for these classes: the same look for a block made on the page in Edit. */
export const richMarks = (classes: RichClasses): string =>
  Object.entries(classes).map(([tag, cls]) => `${tag}:${cls}`).join(" ");

/** The HTML of a formatted text: paragraphs, titles, lists, quotes, links, bold and italic; each block its class. */
export function richHtml(md: string | undefined, classes: RichClasses = {}): string {
  const text = String(md ?? "").replace(/\r\n?/g, "\n").trim();
  if (!text) return "";
  const open = (tag: keyof RichClasses) => (classes[tag] ? `<${tag} class="${esc(classes[tag] as string)}">` : `<${tag}>`);
  return text
    .split(/\n{2,}/)
    .map((block) => {
      const head = /^(#{2,4}) (.+)$/.exec(block);
      if (head && !block.includes("\n")) {
        const n = head[1].length;
        return `${open(`h${n}` as "h2" | "h3" | "h4")}${inline(head[2])}</h${n}>`;
      }
      let lines = block.split("\n");
      if (lines.every((l) => /^> ?/.test(l)))
        return `${open("blockquote")}<p>${inline(lines.map((l) => l.replace(/^> ?/, "")).join("\n"))}</p></blockquote>`;
      // an item's second line (a line break in it): indented under it
      if (/^([-*+]|\d+[.)]) /.test(lines[0]))
        lines = lines.reduce<string[]>((acc, l) => {
          if (/^ {2,3}\S/.test(l) && acc.length) acc[acc.length - 1] = `${acc[acc.length - 1].replace(/ +$/, "")}  \n${l.trim()}`;
          else acc.push(l);
          return acc;
        }, []);
      if (lines.every((l) => /^[-*+] /.test(l)))
        return `${open("ul")}${lines.map((l) => `<li>${inline(l.slice(2))}</li>`).join("")}</ul>`;
      if (lines.every((l) => /^\d+[.)] /.test(l)))
        return `${open("ol")}${lines.map((l) => `<li>${inline(l.replace(/^\d+[.)] /, ""))}</li>`).join("")}</ol>`;
      return `${open("p")}${inline(block)}</p>`;
    })
    .join("");
}

/** A formatted text as the small inline HTML a heading or a lead takes: bold, italic, links and line breaks, its
    paragraphs joined (such a text is one block on the page). */
export function inlineRich(md: string | undefined): string {
  const text = String(md ?? "").replace(/\r\n?/g, "\n").trim();
  if (!text) return "";
  return text.split(/\n{2,}/).map((block) => inline(block, "<br />")).join(" ");
}
