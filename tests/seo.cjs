const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const {boot}=require('./helpers.cjs');let checks=0;const eq=(a,b)=>{assert.deepEqual(a,b);checks++},ok=v=>{assert(v);checks++};
const base='https://tiagof02.github.io/the-cups/';
for(const lang of ['EN','PT','DE']){
 const state=new Map(),a=boot({getItem:k=>state.get(k)||null,setItem:(k,v)=>state.set(k,v)});
 a.click(`.lang[data-lang="${lang}"]`);const d=a.window.CupsTranslations[lang];
 eq(a.document.title,"The Cup's – Your Cup. Your Time.");
 eq(a.q('link[rel="canonical"]').getAttribute('href'),base);
 eq(a.q('meta[name="description"]').getAttribute('content'),d['seo.description']);
 eq(a.q('meta[property="og:description"]').getAttribute('content'),d['seo.description']);
 eq(a.q('meta[property="og:image:alt"]').getAttribute('content'),d['hero.alt']);
 eq(a.q('.hero-art img').getAttribute('alt'),d['hero.alt']);
 ok(a.q('#our-story').nextElementSibling.id==='takeaway-coffee-laranjeiras-lisbon');
 ok(a.q('#find-us').nextElementSibling.id==='breakfast-near-me');
 for(const link of a.qa('a[href^="#"]'))ok(a.document.getElementById(link.getAttribute('href').slice(1)));
 eq(a.qa('#faq .faq-item').length,6);ok(!a.q('#faq').textContent.includes('Católica-Lisbon SBE'));
 ok(!/university|universit|hochschul|digital marketing/i.test(a.q('footer').textContent));
 ok(!/university|universit|hochschul/i.test(d['account.demo']+d['payment.demo']+d['faq.demoNote']));
 eq(a.window.CupsProducts.find(p=>p.id==='espresso').price,1.2);
 eq(a.window.CupsProducts.find(p=>p.id==='breakfast').price,2.3);
 eq(a.window.CupsProducts.find(p=>p.id==='lunch').price,8.5);
 for(const [id,value] of [['espresso',1.2],['breakfast',2.3]]){
  const card=a.q(`.product-card[data-product-id="${id}"]`);
  eq(card.querySelector('.product-price').textContent,a.window.CupsApp.money(value));
  eq(Number(card.dataset.price),value);eq(Number(card.querySelector('.add-product').dataset.price),value);
 }
 a.click('.add-product[data-product-id="espresso"]');a.click('.add-product[data-product-id="espresso"]');a.click('.add-product[data-product-id="breakfast"]');
 eq(a.window.CupsGrowth.quote(a.window.CupsApp.cart).total,4.7);
 eq(a.q('#total').textContent,a.window.CupsApp.money(4.7));a.click('#pay-button');
 eq(a.q('#checkout-total').textContent,a.window.CupsApp.money(4.7));
 ok(a.window.CupsGrowth.answer('espresso','menu',lang).includes(a.window.CupsApp.money(1.2)));
}
const a=boot();const schema=JSON.parse(a.q('script[type="application/ld+json"]').textContent);
eq(schema['@type'],'CafeOrCoffeeShop');eq(schema.url,base);eq(schema.telephone,'+351920588166');
eq(schema.address.streetAddress,'R. das Laranjeiras 47C');ok(!schema.aggregateRating);ok(!schema.review);
const sitemap=fs.readFileSync(path.join(__dirname,'../sitemap.xml'),'utf8');
eq([...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1]),[base]);
const robots=fs.readFileSync(path.join(__dirname,'../robots.txt'),'utf8');ok(robots.includes('User-agent: *'));ok(robots.includes('Allow: /'));ok(robots.includes('Sitemap: '+base+'sitemap.xml'));ok(!robots.includes('Disallow: /'));
console.log(`${checks} SEO/pricing assertions passed: current and legacy anchors, metadata translations, structured data, six FAQs, product prices, cart/checkout totals, chatbot prices and crawler files.`);
