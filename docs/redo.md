# A site redone: the current site's SEO and addresses

Read when the site replaces a current one: its titles, descriptions, addresses and verification metas are the client's content.

## The current site's SEO and addresses (a redo)
- An old SEO value is the client's content, kept word for word (read_export part seo, OP System's connector): a page's
  title as its layout's `seoTitle` (the whole title, the site's name not added), its description; an item's in its
  collection's fields, written in its schema like any other (content.config.ts takes no helper: Content, above),
  exactly `seoTitle: z.string().optional().describe("Titre pour Google")`, `seoDescription: z.string().optional()
  .describe("Description pour Google")`, `ogImage: image().optional().describe("Image de partage")` (the names
  Contenu shows under « Pour Google »), in a collection whose items have a page; its page gives them to its layout. A value plainly bad is told to the team as a decision,
  never rewritten silently.
- Every old address stays: one that changes gets a 301 in op.config.json `redirects` (`{ "/old": "/new" }`); the build
  writes them in `dist/_redirects` after `public/_redirects`, and warns on a redirect to no page. The current site's
  addresses (part seo, `addresses`) go in op.config.json `addresses`: the build warns on each that is neither a page
  nor redirected.
- The verification metas (Google Search Console and the like) go in op.config.json `verification`
  (`{ "google-site-verification": "…" }`): BaseHead writes them on every page.
- Done without asking, and listed: one h1 per page, the language declared, the sitemap and robots.txt (the starter's),
  the canonical address (BaseHead), the share tags from the fields, basic structured data (the person or the company,
  the site), the site out of search engines until its launch (`live: false`).
