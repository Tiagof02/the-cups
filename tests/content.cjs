// Targeted regression coverage for supplied photos, navigation, FAQs and section order.
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const {boot}=require('./helpers.cjs');
let checks=0;const eq=(a,b,label)=>{assert.deepEqual(a,b,label);checks++};const ok=(v,label)=>{assert(v,label);checks++};
const a=boot();
const order=['takeaway-coffee-laranjeiras-lisbon','','menu','pickup','community','merch','loyalty','testimonials','breakfast-near-me','faq'];
eq(a.qa('[data-section-label]').map(e=>e.closest('section').id),order,'Actual numbered section order');
eq(a.qa('#merch img').length,3);
eq(a.qa('.vote-button,#coffee-break-button,#vote-feedback,#coffee-feedback,[data-i18n="footer.tagline"]').length,0);
eq(a.q('#share-feedback').getAttribute('href'),a.window.CupsConfig.googleReviewsUrl);
eq(a.q('#share-feedback').getAttribute('target'),'_blank');
ok(a.q('#share-feedback').getAttribute('rel').includes('noopener'));
ok(a.window.CupsConfig.googleReviewsUrl.includes('0xd1933007a8538b1:0x22338e7077c36a03'));

eq(a.qa('#merch button,#merch a,#merch [data-product-id],#merch [data-price],#merch input').length,0,'Merch is strictly display-only');
ok(!/[€$]/.test(a.q('#merch').textContent));
eq(a.qa('.product-card').length,13);
const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/content-manifest.json')));
eq(manifest.length,16);
for(const asset of manifest){const bytes=fs.readFileSync(path.join(__dirname,'..',asset.asset));ok(bytes.length>1000);eq(bytes.toString('ascii',0,4),'RIFF');eq(bytes.toString('ascii',8,12),'WEBP');}
const faqOrder=['1','6','4','7','8','3'];
eq(a.qa('#faq .faq-answer').map(e=>e.id.replace('faq-answer-','')),faqOrder);
for(const language of ['EN','PT','DE']){
 a.click(`.lang[data-lang="${language}"]`);const d=a.window.CupsTranslations[language];
 ok(d['hero.title'].includes('\n'));
 eq(a.q('[data-i18n="merch.availability"]').textContent,d['merch.availability']);
 ok(!/demo|demonstra/i.test(d['loyalty.total']+d['loyalty.rule']));
 eq(d['tag.fizz'],language==='DE'?'natürlich':'natural');
eq(d['hero.title'],'Your Cup.\nYour Time.');eq(d['growth.storyTitle'],'Your Cup. Your Time.');
 ok(!/might|pode ser|vielleicht/i.test(d['growth.nataTitle']));
 ok(d['growth.nataCopy'].includes('50'));ok(d['growth.nataTerms'].includes('50'));
 ok(a.window.CupsGrowth.answer('first nata','promo',language).includes('50'));
 for(const h of a.qa('main .display:not([data-i18n="hero.title"]):not([data-i18n="growth.storyTitle"])'))ok(!h.textContent.includes('.'),h.textContent);
 eq(a.qa('[data-section-label]').map(e=>e.textContent.slice(0,2)).join(','),'01,02,03,04,05,06,07,08,09,10');
 for(const nav of ['.header-nav','#mobile-nav-panel']){
  eq(a.qa(nav+' a').map(e=>e.getAttribute('href')),['#takeaway-coffee-laranjeiras-lisbon','#menu','#pickup','#merch','#loyalty','#breakfast-near-me','#faq']);
  eq(a.q(nav+' a[href="#faq"]').textContent,d['nav.faq']);
  eq(a.q(nav+' a[href="#merch"]').textContent,d['nav.merch']);
 }
 for(const h of a.qa('main h1:not([data-i18n="hero.title"]),main h2:not([data-i18n="growth.storyTitle"]),main h3'))ok(!/\.$/.test(h.textContent.trim()),h.textContent);
 for(const img of a.qa('[data-i18n-alt]'))eq(img.getAttribute('alt'),d[img.getAttribute('data-i18n-alt')]);
 for(const card of a.qa('.product-card')){
  eq(card.querySelectorAll('.menu-photo').length,1);const id=card.dataset.productId;
  eq(card.querySelector('img').getAttribute('src'),`assets/menu/${id}.webp`);
  ok(card.querySelector(`[data-favorite="${id}"]`));ok(card.querySelector(`.add-product[data-product-id="${id}"]`));
 }
 eq(new Set(a.qa('#faq .faq-item > button').map(e=>e.textContent)).size,6,'No duplicate questions');
 for(const id of faqOrder){
  const button=`#faq button[aria-controls="faq-answer-${id}"]`;
  a.click(button);eq(a.q(button).getAttribute('aria-expanded'),'true');ok(a.q(`#faq-answer-${id}`).parentElement.classList.contains('open'));
  eq(a.q(`#faq-answer-${id} p`).textContent,d[`faq.a${id}`]);ok(d[`faq.a${id}`].length>40);
  a.click(button);eq(a.q(button).getAttribute('aria-expanded'),'false');ok(!a.q(`#faq-answer-${id}`).parentElement.classList.contains('open'));
 }
}
// Keep paragraph punctuation outside headings; retain supplied policy details.
ok(a.window.CupsTranslations.EN['hero.subline'].endsWith('.'));
ok(a.window.CupsTranslations.EN['faq.a6'].includes('one or two stickers'));
ok(a.window.CupsTranslations.EN['faq.a6'].includes('Christmas'));
ok(a.window.CupsTranslations.EN['faq.a7'].includes('six eligible drinks'));
ok(a.window.CupsTranslations.EN['faq.a3'].includes('+351 920 588'));
ok(a.window.CupsTranslations.PT['faq.a8'].includes('00:30'));
ok(a.window.CupsTranslations.DE['faq.a8'].includes('00:30'));
console.log(`${checks} content assertions passed: image references, unchanged product controls, EN/PT/DE navigation, six translated accordions, display-only Merch, numbering and heading punctuation.`);
