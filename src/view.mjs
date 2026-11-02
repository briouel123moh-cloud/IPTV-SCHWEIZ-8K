import { de, deFaq } from './de.mjs';
import { fr, frFaq } from './fr.mjs';
import { ui } from './ui.mjs';
import { locales, path, regionalSites, screens, siteName, supportUrl, terms, quoteUrl, widgetUrl } from './site.mjs';
import { artwork } from './images.mjs';

export const content = { de, fr };
const questions = { de: deFaq, fr: frFaq };

export function escape(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

const join = (items) => items.join('');
const link = (url, text, attributes = '') => `<a href="${escape(url)}" ${attributes}>${escape(text)}</a>`;
const eyebrow = (text) => `<p class="eyebrow">${escape(text)}</p>`;
const brand = (lang) => `<a class="brand" href="${path('home', lang)}"><img src="/favicon.svg" width="36" height="36" alt="" aria-hidden="true"><span>IPTV <strong>${ui[lang].mark}</strong><small>8K</small></span></a>`;

function alternateTags(id, origin) {
  const links = Object.entries(locales).map(([lang, name]) =>
    `<link rel="alternate" hreflang="${name}" href="${origin}${path(id, lang)}">`);
  const defaultPage = id === 'home' ? '/' : path(id, 'de');
  links.push(`<link rel="alternate" hreflang="x-default" href="${origin}${defaultPage}">`);
  return join(links);
}

function related(id, lang) {
  const page = content[lang][id];
  return `<nav class="related" aria-label="${ui[lang].related}"><h2>${ui[lang].related}</h2><div>${join(page.related.map(key => link(path(key, lang), content[lang][key].nav + ' →')))}</div></nav>`;
}

function picture(image, priority = false) {
  const srcset = image.small ? `srcset="${escape(image.small)} 800w, ${escape(image.src)} ${image.width}w" sizes="(max-width: 760px) 100vw, 55vw"` : '';
  return `<img src="${escape(image.src)}" ${srcset} alt="${escape(image.alt)}" title="${escape(image.title)}" width="${image.width}" height="${image.height}" ${priority ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
}

function trialButton(lang) {
  return link(widgetUrl(lang), ui[lang].trialCta + ' ↗', 'class="button primary" data-open-trial');
}

function header(lang, id) {
  const t = ui[lang];
  const other = lang === 'fr' ? 'de' : 'fr';
  const navLinks = ['plans', 'trial', 'devices', 'channels', 'faq'].map(key =>
    link(path(key, lang), content[lang][key].nav, id === key ? 'aria-current="page"' : ''));
  return `<a href="#main" class="skip">${t.skip}</a>
  <header class="mast"><div class="wrap top">${brand(lang)}
    <nav class="navigation" aria-label="${t.nav}">${join(navLinks)}</nav>
    <div class="mast-actions"><a class="lang" href="${path(id, other)}" lang="${locales[other]}" hreflang="${locales[other]}" aria-label="${t.otherLang}">${ui[other].label}</a>
    <details class="mobile-nav"><summary>${t.menu}</summary><nav aria-label="${t.nav}">${join(navLinks)}</nav></details></div>
  </div></header><div class="promo"><div class="wrap"><span class="dot"></span><strong>${t.band}</strong> ${link(path('trial', lang), t.bandLink + ' →')}</div></div>`;
}

function footer(lang) {
  const t = ui[lang];
  const markets = regionalSites.map(([label, url]) => {
    const destination = url === 'https://iptv-canada-8k.com' ? url + (lang === 'fr' ? '/fr/' : '/en/') : url;
    return link(destination, label + ' ↗');
  });
  return `<footer><div class="wrap footer-body"><div class="footer-lead">${brand(lang)}<p>${t.footerIntro}</p>${link(supportUrl(lang), t.support + ' ↗', 'class="text-link"')}</div>
    <nav aria-label="${t.footerLinks}"><h2>${t.footerLinks}</h2>${join(['plans','trial','channels','regions','screens','costs','setup','faq'].map(id => link(path(id, lang), content[lang][id].nav)))}</nav>
    <nav aria-label="${t.legal}"><h2>${t.legal}</h2>${join(['contact','privacy','conditions'].map(id => link(path(id, lang), content[lang][id].nav)))}${link('/', 'Deutsch / Français')}</nav>
    <nav class="regions" aria-label="${t.regional}"><h2>${t.regional}</h2><p>${t.regionalIntro}</p><div>${join(markets)}</div></nav>
    <div class="footline"><span>© 2026 ${t.brand}</span><span>${t.footerNote}</span><a href="#main">${t.toTop} ↑</a></div></div></footer>`;
}

function dialog(lang) {
  const t = ui[lang];
  return `<dialog id="trial-dialog" aria-labelledby="dialog-title" data-widget="${escape(widgetUrl(lang))}"><div class="dialog-bar"><strong id="dialog-title">${t.widgetTitle}</strong><button type="button" data-close>${t.close} ×</button></div><div class="frame-wrap"><p role="status" data-widget-status>${t.widgetWait}</p><iframe data-frame title="${t.widgetTitle}" referrerpolicy="no-referrer" allow="clipboard-write"></iframe></div><div class="dialog-foot">${link(widgetUrl(lang), t.openDirect + ' ↗', 'data-direct target="_blank" rel="noopener noreferrer"')}${link(path('privacy', lang), t.privacy)}</div></dialog>`;
}

function planPicker(lang) {
  const t = ui[lang];
  const choices = screens.map(n => `<label><input type="radio" name="screen-count" value="${n}" ${n === 1 ? 'checked' : ''}><span>${n}</span></label>`);
  const cards = terms.map(n => `<article class="plan-card"><span class="plan-index">CH / ${String(n).padStart(2,'0')}</span><h3>${n} <small>${n === 1 ? t.month : t.months}</small></h3><p data-stream-note>1 ${t.stream}</p>${link(quoteUrl(lang, n, 1), t.askPrice + ' ↗', `class="quote" data-term="${n}" data-label-prefix="${t.quote} ${n} ${n === 1 ? t.month : t.months}" aria-label="${t.quote} ${n} ${n === 1 ? t.month : t.months}, 1 ${t.stream}"`)}</article>`);
  const baseMessages = Object.fromEntries(terms.map(months => [months, Object.fromEntries(screens.map(n => [n, quoteUrl(lang, months, n)]))]));
  const noScriptUrls = terms.map(n => `<tr><th scope="row">${n} ${n === 1 ? t.month : t.months}</th>${join(screens.map(s => `<td>${link(quoteUrl(lang,n,s), s + ' ↗', `aria-label="${n} ${t.months}, ${s} ${s === 1 ? t.stream : t.streams}"`)}</td>`))}</tr>`);
  const customMessage = lang === 'de' ? 'Grüezi, IPTV Schweiz 8K: 7+ Streams. Welche Laufzeiten und CHF-Preise sind möglich?' : 'Bonjour, IPTV Suisse 8K : 7 écrans ou plus. Quelles durées et quels prix en CHF ?';
  return `<section class="plan-section" id="abo" data-plan data-offers="${escape(JSON.stringify(baseMessages))}" data-singular="${t.stream}" data-plural="${t.streams}" data-selection-label="${t.selected}"><div class="wrap"><div class="section-intro">${eyebrow(t.planLabel)}<h2>${t.planHeading}</h2><p>${t.planIntro}</p></div>
    <fieldset class="screen-choice"><legend>${t.screenSelect}</legend>${join(choices)}</fieldset><p class="selection-note" aria-live="polite" data-selection>${t.selected}: 1 ${t.stream}</p><div class="plans">${join(cards)}</div>
    <div class="plan-foot"><p>${t.planNote}</p>${link('https://wa.me/212631479723?text=' + encodeURIComponent(customMessage), t.customAsk + ' ↗', 'class="text-link"')}</div>
    <noscript><details><summary>${t.allQuotes}</summary><div class="table-scroll"><table><thead><tr><th>${t.period}</th>${join(screens.map(n=>`<th>${n} ${n===1?t.stream:t.streams}</th>`))}</tr></thead><tbody>${join(noScriptUrls)}</tbody></table></div></details></noscript></div></section>`;
}

function trialPanel(lang) {
  const t = ui[lang];
  return `<section class="trial-panel"><div class="wrap trial-grid"><div>${eyebrow(t.articleLabel + ' / TEST')}<h2>${t.trialLead}</h2><p>${t.trialLang}</p><div class="actions">${trialButton(lang)}${link(supportUrl(lang), t.support + ' ↗', 'class="on-dark"')}</div></div><div class="steps"><ol>${join(t.trialPoints.map(x=>`<li>${escape(x)}</li>`))}</ol><p>${t.trialSize}</p></div></div></section>`;
}

function answers(lang, subset = false) {
  const t = ui[lang];
  const rows = subset ? questions[lang].filter((_, i) => [0, 3, 5, 7].includes(i)) : questions[lang];
  return `<section class="wrap faq-area"><div>${eyebrow(t.faqLabel)}<h2>${subset ? content[lang].faq.h1 : (lang === 'de' ? 'Test, Geräte und Abo' : 'Essai, appareils et abonnement')}</h2></div><div>${join(rows.map(([q,a])=>`<details><summary>${escape(q)}</summary><p>${escape(a)}</p></details>`))}${subset ? link(path('faq',lang), t.faqMore + ' →', 'class="text-link below"') : ''}</div></section>`;
}

function calculator(lang) {
  const t = ui[lang];
  return `<section class="calc"><h2>${t.calculator}</h2><p>${t.calculatorIntro}</p><form data-calc data-locale="${locales[lang]}" data-month-label="${t.perMonth}" data-stream-label="${t.perStream}">
    <label>${t.total}<input name="price" type="number" step="0.01" min="0.01" inputmode="decimal" required></label>
    <label>${t.extra}<input name="extra" type="number" step="0.01" min="0" value="0" inputmode="decimal" required></label>
    <label>${t.period}<select name="months">${join(terms.map(n=>`<option value="${n}">${n}</option>`))}</select></label>
    <label>${t.count}<select name="screens">${join(screens.map(n=>`<option value="${n}">${n}</option>`))}</select></label>
    <button type="submit" class="button primary" disabled>${t.calculate}</button><output aria-live="polite">${t.calcEmpty}</output>
    <noscript><p>${t.calcFallback}</p></noscript></form></section>`;
}

function featureLinks(lang, publicDir) {
  const t = ui[lang];
  return `<section class="wrap explore"><div class="section-intro">${eyebrow(t.findLabel)}<h2>${t.findTitle}</h2></div><div class="feature-grid">${join(t.categories.map(([key, n, title, body],i)=>{
    const art = artwork(i === 0 ? 'sports' : i === 1 ? 'cinema' : 'dashboard',lang,publicDir);
    return `<a class="feature" href="${path(key,lang)}"><div class="feature-image">${picture(art)}<span>${n} / CH</span></div><div><h3>${title} <span>↗</span></h3><p>${body}</p></div></a>`;
  }))}</div></section>`;
}

function homeBody(lang, publicDir) {
  const t = ui[lang], page = content[lang].home;
  const split = page.h1.indexOf('.');
  return `<main id="main"><section class="hero"><div class="wrap hero-grid"><div class="hero-copy">${eyebrow(t.eyebrow)}<h1><em>${escape(page.h1.slice(0,split+1))}</em> ${escape(page.h1.slice(split+1).trim())}</h1><p>${page.intro}</p><div class="actions">${trialButton(lang)}${link(path('plans',lang),t.plansCta + ' →','class="button ghost"')}</div><small>${t.heroNote}</small></div>
    <figure class="hero-art"><div class="art-bar"><span><i></i> ${t.brand}</span><span>CH / 08</span></div>${picture(artwork('dashboard', lang, publicDir), true)}<figcaption><b>${t.heroSubject}</b> ${t.heroCaption}</figcaption></figure></div></section>
    <dl class="facts wrap">${join(t.facts.map(([v,label])=>`<div><dt>${label}</dt><dd>${v}</dd></div>`))}</dl>
    ${featureLinks(lang,publicDir)}${planPicker(lang)}<section class="wrap story"><div class="section-intro">${eyebrow(t.useCase)}<h2>${lang === 'de' ? 'Von der Senderliste zum passenden Abo' : 'De la liste de chaînes à la bonne formule'}</h2></div><div class="three-up">${join(page.sections.map(([title,p],i)=>`<article><span class="num">0${i+1}</span><h3>${title}</h3><p>${p}</p></article>`))}</div></section>
    ${trialPanel(lang)}${answers(lang,true)}<div class="wrap">${related('home',lang)}</div></main>`;
}

function sources(lang) {
  const t = ui[lang];
  return `<div class="source-box"><h2>${t.sources}</h2><p>${t.sourcesCopy}</p><div>${join(t.sourceLinks.map(([label,url])=>link(url,label + ' ↗','target="_blank" rel="noopener noreferrer"')))}</div></div>`;
}

function articleBody(id, lang, publicDir) {
  const t=ui[lang], page=content[lang][id];
  const topAction = id === 'trial' ? trialButton(lang) : id === 'contact' ? link(supportUrl(lang), t.support+' ↗','class="button primary"') : '';
  const imageType = id === 'channels' ? 'sports' : id === 'regions' ? 'cinema' : null;
  return `<main id="main"><section class="page-top"><div class="wrap"><nav class="crumb" aria-label="${lang==='de'?'Brotkrumen':'Fil d’Ariane'}">${link(path('home',lang),t.home)}<span aria-hidden="true">/</span><span aria-current="page">${page.nav}</span></nav>${eyebrow(t.articleLabel)}<h1>${page.h1}</h1><p>${page.intro}</p>${topAction ? `<div class="actions">${topAction}</div>` : ''}</div></section>
    ${id === 'plans' ? planPicker(lang) : ''}${id === 'trial' ? trialPanel(lang) : ''}${id === 'faq' ? answers(lang) : ''}
    ${page.sections.length ? `<div class="wrap reading"><article class="prose">${imageType ? `<figure class="article-img">${picture(artwork(imageType,lang,publicDir))}<figcaption>${t.heroCaption}</figcaption></figure>` : ''}${join(page.sections.map(([h,p])=>`<section><h2>${escape(h)}</h2><p>${escape(p)}</p></section>`))}${id==='costs'?calculator(lang):''}${['regions','channels'].includes(id)?sources(lang):''}</article>
    <aside class="side">${eyebrow(t.sideLabel)}<h2>${t.sideTitle}</h2><p>${t.sideBody}</p>${trialButton(lang)}${link(path('plans',lang),t.plansCta+' →','class="text-link"')}</aside></div>` : ''}<div class="wrap">${related(id,lang)}</div></main>`;
}

function graph(id, lang, cfg) {
  const page = content[lang][id], href=cfg.origin+path(id,lang);
  const nodes = [
    { '@type':'Organization', '@id':cfg.origin+'/#org', name:siteName, url:cfg.origin+'/', logo:cfg.origin+'/favicon.svg', areaServed:{ '@type':'Country', name:'Switzerland' }, contactPoint:{ '@type':'ContactPoint', telephone:'+212631479723', contactType:'Customer support', url:cfg.origin+path('contact',lang) } },
    { '@type':'WebSite', '@id':cfg.origin+'/#site', name:siteName, url:cfg.origin+'/', inLanguage:['de-CH','fr-CH'], publisher:{ '@id':cfg.origin+'/#org' } },
    { '@type': id==='faq'?'FAQPage':id==='contact'?'ContactPage':'WebPage', '@id':href+'#page', url:href, name:page.title, description:page.description, inLanguage:locales[lang], isPartOf:{ '@id':cfg.origin+'/#site' }, ...(id==='faq'?{ mainEntity:questions[lang].map(([name,text])=>({ '@type':'Question',name,acceptedAnswer:{ '@type':'Answer',text } }))}:{}) }
  ];
  if(id!=='home') nodes.push({ '@type':'BreadcrumbList', itemListElement:[{ '@type':'ListItem', position:1, name:ui[lang].home, item:cfg.origin+path('home',lang) },{ '@type':'ListItem',position:2,name:page.nav,item:href }] });
  return {'@context':'https://schema.org','@graph':nodes};
}

function documentHead({ title, description, origin, canonical, lang, alternate, indexable, art, schema }) {
  const meta = (name,c) => `<meta property="${name}" content="${escape(c)}">`;
  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escape(title)}</title>
    <meta name="description" content="${escape(description)}"><meta name="robots" content="${indexable?'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1':'noindex,follow'}">
    <link rel="canonical" href="${escape(canonical)}">${alternate}<link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="/style.css">
    ${meta('og:type','website')}${meta('og:site_name',siteName)}${meta('og:locale',lang.replace('-','_'))}${meta('og:title',title)}${meta('og:description',description)}${meta('og:url',canonical)}${meta('og:image',origin+art.src)}${meta('og:image:alt',art.alt)}${meta('og:image:width',art.width)}${meta('og:image:height',art.height)}${meta('og:locale:alternate',lang === 'de-CH' ? 'fr_CH' : 'de_CH')}
    <meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escape(title)}"><meta name="twitter:description" content="${escape(description)}"><meta name="twitter:image" content="${escape(origin+art.src)}"><meta name="twitter:image:alt" content="${escape(art.alt)}">
    ${schema ? `<script type="application/ld+json">${JSON.stringify(schema).replaceAll('<','\\u003c')}</script>` : ''}<script src="/app.js" defer></script></head><body>`;
}

export function localizedPage(id, lang, cfg, publicDir) {
  const page = content[lang][id];
  const art=artwork(id==='channels'?'sports':id==='regions'?'cinema':'dashboard',lang,publicDir);
  return documentHead({ title:page.title, description:page.description, origin:cfg.origin, canonical:cfg.origin+path(id,lang), lang:locales[lang], alternate:alternateTags(id,cfg.origin), indexable:cfg.indexable, art, schema:graph(id,lang,cfg) }) +
    header(lang,id) + (id==='home'?homeBody(lang,publicDir):articleBody(id,lang,publicDir)) + footer(lang) + dialog(lang) + '</body></html>';
}

export function selector(cfg, publicDir) {
  const title='IPTV Schweiz / Suisse 8K | Deutsch oder Français';
  const description='IPTV für die Schweiz auf Deutsch. IPTV pour la Suisse en français. Wähle deine Sprache für Testzugang und CHF-Angebote. Choisissez votre langue pour commencer.';
  const art=artwork('dashboard','de',publicDir);
  return documentHead({ title, description, origin:cfg.origin, canonical:cfg.origin+'/', lang:'de-CH', alternate:alternateTags('home',cfg.origin), indexable:cfg.indexable, art, schema:{'@context':'https://schema.org','@type':'WebSite',url:cfg.origin+'/',name:siteName,inLanguage:['de-CH','fr-CH']} })+
    `<main class="language-landing" id="main"><div class="wrap"><div class="landing-mast">${brand('de')}<span>CH / DE + FR</span></div><div class="landing-grid"><div>${eyebrow('SCHWEIZ / SUISSE')}<h1>Dein Fernseh&shy;abend.<br><em lang="fr-CH">Votre soirée télé.</em></h1><p>IPTV auf Deutsch oder Französisch entdecken.<br><span lang="fr-CH">Découvrez l’IPTV en allemand ou en français.</span></p><div class="language-cards">${link('/de/','Deutsch →','lang="de-CH" hreflang="de-CH"')}${link('/fr/','Français →','lang="fr-CH" hreflang="fr-CH"')}</div><div class="landing-foot">CHF · 1–6 Streams / flux · 1–24 Monate / mois</div></div><figure class="hero-art"><div class="art-bar"><span><i></i> IPTV CH 8K</span><span>CH / 08</span></div>${picture(art,true)}<figcaption>Illustration · Sport / Cinéma / Live TV</figcaption></figure></div></div></main>`+
    footer('de')+'</body></html>';
}

export function notFound(cfg,publicDir) {
  return documentHead({title:'Seite nicht gefunden · Page introuvable | IPTV CH 8K',description:'Wähle eine Sprache. Choisissez une langue.',origin:cfg.origin,canonical:cfg.origin+'/404.html',lang:'de-CH',alternate:'',indexable:false,art:artwork('dashboard','de', publicDir)})+
    '<main class="wrap error"><span class="eyebrow">404 / CH</span><h1>Seite nicht gefunden</h1><p lang="fr-CH">Cette page est introuvable.</p><div class="language-cards"><a href="/de/">Deutsch →</a><a href="/fr/" lang="fr-CH">Français →</a></div></main></body></html>';
}
