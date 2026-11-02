export const siteName = 'IPTV Schweiz / Suisse 8K';
export const previewOrigin = 'https://iptv-schweiz-8k.pages.dev';
export const phone = '212631479723';
export const terms = [1, 2, 3, 6, 7, 12, 24];
export const screens = [1, 2, 3, 4, 5, 6];
export const locales = { de: 'de-CH', fr: 'fr-CH' };
export const regionalSites = [
  ['IPTV Canada 8K', 'https://iptv-canada-8k.com'],
  ['IPTV USA 8K', 'https://iptv-usa-8k.com/'],
  ['IPTV Belgique 8K', 'https://iptv-belgique-8k.com/'],
  ['IPTV Ireland Subscription', 'https://iptv-ireland-subscription.com/'],
  ['IPTV Suomi', 'https://iptv-suomi-iptv.fi/'],
  ['Nordic IPTV Elite', 'https://www.nordiciptv-elite.com/iptv-nordic-2026/'],
  ['IPTV Australia 8K', 'https://iptv-australia-8k.pages.dev/'],
  ['IPTV Deutschland 8K', 'https://iptv-deutschland-8k.pages.dev/']
];

export const routes = {
  home: ['', ''], plans: ['abo', 'abonnements'], trial: ['testen', 'essai'],
  devices: ['geraete', 'appareils'], channels: ['sender', 'chaines'],
  replay: ['replay', 'replay'], regions: ['sprachregionen', 'regions-linguistiques'],
  screens: ['mehrere-geraete', 'multi-ecrans'], costs: ['ratgeber/kosten', 'guides/prix'],
  setup: ['ratgeber/einrichtung', 'guides/installation'], faq: ['fragen', 'questions'],
  contact: ['kontakt', 'contact'], privacy: ['datenschutz', 'confidentialite'],
  conditions: ['konditionen', 'conditions']
};

export function path(id, lang) {
  if (!Object.hasOwn(routes, id) || !Object.hasOwn(locales, lang)) throw new Error('Unknown route');
  const slug = routes[id][lang === 'de' ? 0 : 1];
  return '/' + lang + '/' + (slug ? slug + '/' : '');
}

export function quoteUrl(lang, months, count) {
  if (!terms.includes(months) || ![...screens, '7+'].includes(count)) throw new Error('Invalid plan');
  const message = lang === 'de'
    ? `Grüezi, IPTV Schweiz 8K: ${months} ${months === 1 ? 'Monat' : 'Monate'}, ${count} ${count === 1 ? 'Stream' : 'Streams'}. Preis in CHF?`
    : `Bonjour, IPTV Suisse 8K : ${months} mois, ${count} ${count === 1 ? 'écran' : 'écrans'}. Prix en CHF ?`;
  return 'https://wa.me/' + phone + '?text=' + encodeURIComponent(message);
}

export function supportUrl(lang) {
  const message = lang === 'de' ? 'Grüezi, ich habe eine Frage zu IPTV Schweiz 8K.' : 'Bonjour, une question sur IPTV Suisse 8K.';
  return 'https://wa.me/' + phone + '?text=' + encodeURIComponent(message);
}

export function widgetUrl(lang) {
  const url = new URL('https://control.emeraldiptv.irish/widget');
  url.searchParams.set('site', 'switzerland');
  url.searchParams.set('lang', lang === 'fr' ? 'fr' : 'de');
  return url.href;
}

export function config(env = process.env) {
  const url = new URL(env.PUBLIC_SITE_URL || previewOrigin);
  if (url.protocol !== 'https:' || url.pathname !== '/' || url.search || url.hash || url.username || url.password) throw new Error('PUBLIC_SITE_URL must be an HTTPS origin.');
  const indexable = env.PUBLIC_INDEXABLE === 'true';
  if (indexable && /(^|\.)(pages\.dev|workers\.dev|chatgpt\.site|localhost|example|test|invalid)$/.test(url.hostname)) {
    throw new Error('An owned production domain is required before enabling indexing.');
  }
  return { origin: url.origin, indexable };
}
