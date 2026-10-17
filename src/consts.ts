/** Site name. Appended to every page title and used as `og:site_name`. */
export const SITE_NAME = "Nouveau site";
/** Fallback meta description for pages that don't set their own. */
export const SITE_DESCRIPTION = "La description du site, en une ou deux phrases.";
/** Canonical origin. Resolves canonical URLs, social images, and the sitemap. The client's domain once the site is live. */
export const SITE_URL = "https://example.com";
/** BCP 47 locale tag: the pages' `lang`, and how dates and numbers are written. */
export const SITE_LOCALE = "fr-CA";
/** Routes excluded from search and the sitemap. Surrounding slashes are ignored. */
export const NOINDEX_ROUTES: string[] = ["/404", "/example-components"];
