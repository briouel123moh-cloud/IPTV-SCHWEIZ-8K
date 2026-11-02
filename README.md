# IPTV Schweiz / Suisse 8K

A bilingual Swiss static storefront with a language selector, 14 equivalent page types in German and French, and a bilingual 404. It builds with Node 22+ and has no runtime package dependencies.

## Build and publish

Run `npm run check` to generate `dist` and verify the site. Cloudflare Pages project `iptv-schweiz-8k` uses `npm run build`, output `dist` and the source-controlled settings in `wrangler.jsonc`. The public preview is `https://iptv-schweiz-8k.pages.dev/`. Preview HTML and outgoing headers specify noindex. Preview sitemaps have no indexable entries.

The production launch needs a confirmed owned domain, the indexable flag in Wrangler, matching trial-service origins and the operator's actual sales terms. After connecting the domain, run the checks with its HTTPS origin and `PUBLIC_INDEXABLE=true`, then verify the live redirects, robots.txt, embedded forms and sitemap. An indexable build produces 29 canonical sitemap entries with reciprocal locale references. The article alternatives stay on the equivalent language route. The homepage group also includes the root language selector as x-default.

## Visitor flows

- 7 durations (1, 2, 3, 6, 7, 12 and 24 months) × 1 to 6 simultaneous streams, plus a custom request for larger households. Quotes use CHF and WhatsApp `212631479723`. No price estimate is presented as a real offer.
- German and French use the shared service's `switzerland` profile with the matching `de` or `fr` widget language. Privacy paths are `/de/datenschutz/` and `/fr/confidentialite/`. The form loads on request, with a direct-link fallback. Individual test accesses can be renewed after 24 hours, up to seven times in 30 days across network sites.
- Cost pages calculate totals using the visitor's own quote. Language-region, local programme, replay and device guides explain what to test before choosing a subscription.
- A single regional menu links to all eight other approved non-Emerald markets. The shared activation origin is used exclusively for widget functionality. Belgium's separate hosting status is maintained by its site owner.
- The Pages middleware applies the Morocco exclusion to public storefront and API paths, using Cloudflare's country signal. Specific SEO files, image/font assets and ACME challenges stay accessible. Central trial limits are enforced by the shared service.

## Images

The dashboard, sports and cinema artwork belongs in `public/images/iptv-schweiz-8k-{dashboard,sports,cinema}.webp`. An 800px dashboard edition can be placed at `public/images/iptv-schweiz-8k-dashboard-800.webp`. The build reads WebP dimensions for HTML and Open Graph. German and French alt text, image titles and social descriptions are defined in `src/images.mjs`. The build requires valid branded WebPs and fails if an asset is incomplete.

## Search intent

The German and French routes cover equivalent visitor tasks rather than creating a separate page for every plan permutation. Primary purchase intents are IPTV Schweiz Abo / abonnement IPTV Suisse, IPTV Schweiz testen / essai IPTV Suisse, and mehrere Geräte / multi-écrans. Supporting guides address CHF cost comparison, local feed selection, replay, player setup and language-specific viewing. These are editorial intent targets; no paid search-volume or difficulty figures are asserted.
