import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { config, routes, path, locales } from '../src/site.mjs';
import { localizedPage, selector, notFound, escape, content } from '../src/view.mjs';

const project = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = resolve(project,'public');
const reviewDate = '2026-11-02';

async function file(destination, name, body) {
  const target = resolve(destination, name);
  await mkdir(dirname(target), { recursive:true });
  await writeFile(target, body);
}

function sitemapEntry(origin, urlPath, id, html) {
  const alternate = Object.entries(locales).map(([lang, locale]) =>
    `<xhtml:link rel="alternate" hreflang="${locale}" href="${origin}${path(id,lang)}"/>`);
  alternate.push(`<xhtml:link rel="alternate" hreflang="x-default" href="${origin}${id === 'home' ? '/' : path(id,'de')}"/>`);
  const images = [...new Set([...html.matchAll(/<img src="(\/images\/[^"]+)"/g)].map(x => x[1]))];
  return `<url><loc>${origin}${urlPath}</loc><lastmod>${reviewDate}</lastmod>${alternate.join('')}${images.map(image=>`<image:image><image:loc>${origin}${escape(image)}</image:loc></image:image>`).join('')}</url>`;
}

export async function buildSite(destination = resolve(project, 'dist'), env = process.env) {
  const cfg = config(env);
  if (destination === resolve(project, 'dist')) await rm(destination,{recursive:true,force:true});
  await mkdir(destination,{recursive:true});
  await cp(publicDir, destination, {recursive:true});
  const entries = [];
  const landing = selector(cfg,publicDir);
  await file(destination,'index.html',landing);
  if (cfg.indexable) entries.push(sitemapEntry(cfg.origin,'/','home',landing));
  for (const lang of Object.keys(locales)) {
    for (const id of Object.keys(routes)) {
      const urlPath = path(id,lang);
      const html = localizedPage(id,lang,cfg,publicDir);
      await file(destination,urlPath.slice(1)+'index.html',html);
      if (cfg.indexable) entries.push(sitemapEntry(cfg.origin,urlPath,id,html));
    }
  }
  await file(destination,'404.html',notFound(cfg,publicDir));
  const declaration = '<?xml version="1.0" encoding="UTF-8"?>\n';
  const sitemap = declaration+'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">'+entries.join('\n')+'</urlset>\n';
  await file(destination,'sitemap.xml',sitemap);
  const index = cfg.indexable ? declaration+`<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>${cfg.origin}/sitemap.xml</loc></sitemap></sitemapindex>\n` : sitemap;
  await file(destination,'sitemap-index.xml',index);
  await file(destination,'robots.txt','User-agent: *\nAllow: /\n'+(cfg.indexable?'Sitemap: '+cfg.origin+'/sitemap-index.xml\n':'# Preview is noindex.\n'));
  const reference = ['# IPTV Schweiz / Suisse 8K','', '> Schweizer IPTV-Website auf Deutsch und Französisch. Durées, devis en CHF, écrans simultanés et essais à renouveler.',''];
  for (const [lang, label] of [['de','Deutsch'], ['fr','Français']]) {
    reference.push('## '+label);
    for (const id of ['home','plans','trial','devices','channels','regions','screens','replay','costs','faq','contact','privacy']) reference.push('- ['+content[lang][id].nav+']('+cfg.origin+path(id,lang)+')');
    reference.push('');
  }
  await file(destination,'llms.txt',reference.join('\n'));
  const headers = `/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: SAMEORIGIN
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Content-Security-Policy: default-src 'self'; base-uri 'none'; object-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' data:; frame-src https://control.emeraldiptv.irish; frame-ancestors 'self'; form-action 'self'
${cfg.indexable ? '' : '  X-Robots-Tag: noindex, follow\n'}
https://iptv-schweiz-8k.pages.dev/*
  X-Robots-Tag: noindex, follow
https://:preview.iptv-schweiz-8k.pages.dev/*
  X-Robots-Tag: noindex, follow
/images/*
  Cache-Control: public, max-age=86400
/fonts/*
  Cache-Control: public, max-age=604800
/robots.txt
  Content-Type: text/plain; charset=utf-8
/llms.txt
  Content-Type: text/plain; charset=utf-8
/sitemap.xml
  Content-Type: application/xml; charset=utf-8
/sitemap-index.xml
  Content-Type: application/xml; charset=utf-8
`;
  await file(destination,'_headers',headers);
  return { pages:1+Object.keys(routes).length*2, sitemapEntries:entries.length, origin:cfg.origin, indexable:cfg.indexable };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const result = await buildSite();
  console.log(JSON.stringify(result));
}
