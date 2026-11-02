import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, stat, rm } from 'node:fs/promises';
import { resolve, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { buildSite } from './build.mjs';
import { routes, locales, path, previewOrigin, regionalSites, config, terms, screens } from '../src/site.mjs';
import { onRequest } from '../functions/_middleware.js';

const project = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(project, 'dist');
const decode = s => s.replaceAll('&amp;', '&').replaceAll('&quot;', '"').replaceAll('&lt;', '<').replaceAll('&gt;', '>');
const tags = (html, tag) => [...html.matchAll(new RegExp('<'+tag+'\\b[^>]*>','g'))].map(m => m[0]);
const attr = (tag, name) => decode(tag.match(new RegExp('(?:^|\\s)'+name+'="([^"]*)"'))?.[1] || '');
const canonical = html => attr(tags(html,'link').find(t => attr(t,'rel')==='canonical') || '', 'href');
const metadata = (html, name) => attr(tags(html,'meta').find(t=> attr(t,'name')===name || attr(t,'property')===name) || '', 'content');
const isFile = async p => (await stat(p)).isFile();
const localized = await Promise.all(Object.keys(locales).flatMap(lang => Object.keys(routes).map(async id => ({
  lang,id,href:path(id,lang),html:await readFile(resolve(dist,'.'+path(id,lang),'index.html'),'utf8')
}))));
const ctx = config();

test('all 29 navigable URLs have unique titles and one H1; paired locale pages link both ways', async()=>{
  const root = await readFile(resolve(dist,'index.html'),'utf8');
  assert.ok(root.includes('hreflang="x-default" href="'+ctx.origin+'/"'));
  assert.equal(canonical(root),ctx.origin+'/');
  assert.equal(localized.length,28);
  const titles=new Set(), descriptions=new Set();
  for(const {lang,id,href,html} of localized) {
    assert.ok(html.includes('<html lang="'+locales[lang]+'">'));
    assert.equal(tags(html,'h1').length,1,href);
    const title=decode(html.match(/<title>(.*?)<\/title>/s)[1]);
    const description=metadata(html,'description');
    assert.ok(title.length >= 20 && description.length >= 70,href);
    assert.ok(!titles.has(title) && !descriptions.has(description),href);
    titles.add(title); descriptions.add(description);
    assert.equal(canonical(html),ctx.origin+href,href);
    assert.equal(metadata(html,'og:url'),ctx.origin+href,href);
    assert.equal(metadata(html,'og:title'),title,href);
    for(const target of ['de','fr']) {
      assert.ok(html.includes('hreflang="'+locales[target]+'" href="'+ctx.origin+path(id,target)+'"'),href);
    }
    const other=lang==='de'?'fr':'de';
    assert.ok(tags(html,'a').some(a=>attr(a,'href')===path(id,other)&&attr(a,'hreflang')===locales[other]),href);
    const graph=JSON.parse(html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)[1])['@graph'];
    assert.ok(graph.some(node=>node.url===ctx.origin+href && node.inLanguage===locales[lang]),href);
  }
});

test('every internal navigation target, image and fragment in the published output resolves',async()=>{
  const root=await readFile(resolve(dist,'index.html'),'utf8');
  const unique=new Set();
  for(const {html,href} of [{html:root,href:'/'},...localized]) {
    const refs=[...tags(html,'a').map(t=>attr(t,'href')),...tags(html,'img').map(t=>attr(t,'src')),...tags(html,'script').map(t=>attr(t,'src')),...tags(html,'link').filter(t=>['stylesheet','icon'].includes(attr(t,'rel'))).map(t=>attr(t,'href'))].filter(Boolean);
    for(const ref of refs) {
      const u=new URL(ref,ctx.origin+href);
      if(u.origin!==ctx.origin) continue;
      const key=u.pathname+u.hash;
      if(unique.has(key))continue;
      unique.add(key);
      const file=resolve(dist,'.'+u.pathname, ...(extname(u.pathname)?[]:['index.html']));
      assert.ok(await isFile(file),href+': '+ref);
      if(u.hash) assert.ok((await readFile(file,'utf8')).includes('id="'+decodeURIComponent(u.hash.slice(1))+'"'),href+': '+ref);
    }
  }
});

test('each language exposes 42 working scoped CHF quote combinations, plus a custom request',()=>{
  for(const lang of ['de','fr']) {
    const html=localized.find(p=>p.id==='plans'&&p.lang===lang).html;
    const encoded=html.match(/data-offers="([^"]+)"/)[1];
    const quotes=JSON.parse(decode(encoded));
    const distinct=new Set();
    for(const months of terms) for(const count of screens) {
      const u=new URL(quotes[months][count]);
      assert.equal(u.origin,'https://wa.me');
      assert.equal(u.pathname,'/212631479723');
      const msg=u.searchParams.get('text');
      assert.ok(msg.includes('CHF')&&msg.includes(String(months))&&msg.includes(String(count))&&msg.length<=95);
      distinct.add(msg);
    }
    assert.equal(distinct.size,42);
    assert.ok(html.includes('7%2B') || html.includes('7%20%C3%A9crans'), 'custom screens missing');
    assert.ok(html.includes('<noscript>') && html.includes('<table>'), 'non-JavaScript quote path missing');
  }
});

test('native German and French forms have direct fallbacks and privacy routes',()=>{
  for(const p of localized){
    const links=tags(p.html,'a').map(t=>attr(t,'href')).filter(h=>h.includes('control.emeraldiptv.irish'));
    assert.ok(links.length>=1,p.href);
    for(const link of links){
      const u=new URL(link);
      assert.equal(u.pathname,'/widget');
      assert.equal(u.searchParams.get('site'),'switzerland');
      assert.equal(u.searchParams.get('lang'),p.lang);
    }
    assert.ok(p.html.includes(path('privacy',p.lang)));
    assert.ok(p.html.includes('<dialog id="trial-dialog"'));
  }
});

test('regional menus contain all eight other markets, with Emerald limited to the technical widget endpoint',()=>{
  const hosts=regionalSites.map(([,u])=>new URL(u).host);
  for(const p of localized) {
    const external=tags(p.html,'a').map(t=>new URL(attr(t,'href'),ctx.origin+p.href)).filter(u=>u.origin!==ctx.origin);
    for(const host of hosts) assert.ok(external.some(u=>u.host===host),p.href+': '+host);
    assert.ok(!external.some(u=>['emeraldiptv.irish','www.emeraldiptv.irish','iptv-uk.cloud','www.iptv-uk.cloud'].includes(u.hostname)),p.href);
  }
});

test('preview disallows indexing and emits no canonical sitemap entries; owned-domain fixture emits all 29',async()=>{
  const sitemap=await readFile(resolve(dist,'sitemap.xml'),'utf8');
  assert.equal((sitemap.match(/<url>/g)||[]).length,ctx.indexable?29:0);
  for(const p of localized)assert.ok(metadata(p.html,'robots').startsWith(ctx.indexable?'index,follow':'noindex,follow'));
  const flags=await readFile(resolve(dist,'_headers'),'utf8');
  assert.ok(flags.includes('https://:preview.iptv-schweiz-8k.pages.dev/*\n  X-Robots-Tag: noindex, follow'));
  assert.throws(()=>config({PUBLIC_SITE_URL:previewOrigin,PUBLIC_INDEXABLE:'true'}));
  const working=await mkdtemp(resolve(tmpdir(),'ch-domain-check-'));
  try {
    const result=await buildSite(working,{PUBLIC_SITE_URL:'https://fixture-owned-ch.tld',PUBLIC_INDEXABLE:'true'});
    assert.equal(result.sitemapEntries,29);
    const xml=await readFile(resolve(working,'sitemap.xml'),'utf8');
    assert.equal((xml.match(/<url>/g)||[]).length,29);
    assert.equal((xml.match(/hreflang="x-default"/g)||[]).length,29);
    assert.ok(xml.includes('<image:image>') && !xml.includes('.pages.dev'));
    const robots=await readFile(resolve(working,'robots.txt'),'utf8');
    assert.ok(robots.includes('Sitemap: https://fixture-owned-ch.tld/sitemap-index.xml'));
  } finally { await rm(working,{recursive:true,force:true}); }
});

test('every informative image has an accessible description, title and social image description',()=>{
  for(const p of localized){
    assert.ok(metadata(p.html,'og:image:alt').length>15,p.href);
    for(const img of tags(p.html,'img').filter(t=>attr(t,'aria-hidden')!=='true')) {
      assert.ok(attr(img,'alt').length>15 && attr(img,'title').length>10,p.href);
      assert.ok(attr(img,'width') && attr(img,'height'),p.href);
    }
  }
});

test('the Morocco edge exclusion covers storefront and API while allowing only designated public resources',async()=>{
  const run=async(pathname,country,header,extraHeaders={})=>{
    const request=new Request('https://iptv-schweiz-8k.pages.dev'+pathname,{headers:{...(header?{'CF-IPCountry':header}:{}),...extraHeaders}});
    if(country!==undefined)Object.defineProperty(request,'cf',{value:{country}});
    return onRequest({request,next:()=>new Response('passed',{status:200})});
  };
  for(const p of ['/','/fr/essai/','/api/trial','/images/not-an-image','/.well-known/acme-challenge/not/a/token']){
    const res=await run(p,'MA','CH',{'X-Forwarded-For':'1.2.3.4',Cookie:'allow=1'});
    assert.equal(res.status,403,p);
    assert.equal(res.headers.get('cache-control'),'private, no-store');
  }
  for(const p of ['/robots.txt','/sitemap.xml','/sitemap-index.xml','/llms.txt','/.well-known/acme-challenge/aBc_123','/images/test.webp','/fonts/manrope-latin-wght-normal.woff2'])assert.equal((await run(p,'MA')).status,200,p);
  assert.equal((await run('/de/',undefined,'ma')).status,403);
  assert.equal((await run('/fr/','CH','MA')).status,200);
  assert.equal((await run('/fr/',undefined,undefined)).status,200);
});
