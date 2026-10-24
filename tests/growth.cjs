/* DOM behavior tests; no rendered-layout verification is implied. */
const assert=require('assert/strict'),fs=require('fs'),path=require('path');
const {boot,createValues,pay,until}=require('./helpers.cjs');
let checks=0;
const ok=(v,m)=>{assert(v,m);checks++},eq=(a,b,m)=>{assert.deepEqual(a,b,m);checks++};
function storage(seed={}){const data=new Map(Object.entries(seed).map(([k,v])=>[k,typeof v==='string'?v:JSON.stringify(v)]));return {data,getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,String(v)),removeItem:k=>data.delete(k)};}
const VISITOR='thecups.visitor.v1',auto=a=>a.timers.find(t=>t.ms===12000).fn();
const submitChat=async(a,q)=>{a.q('#chat-input').value=q;a.submit('#chat-form');await until(()=>!a.q('#chat-send').disabled);return a.qa('#chat-log .assistant').at(-1).textContent;};
const claim=a=>{a.click('[data-growth-offer]');a.click('#visit-action');};
(async()=>{
 let state=storage(),a=boot(state),d=a.window.CupsTranslations;
 eq(a.qa('.product-card:not(.hidden-product)').map(e=>e.dataset.productId).sort().join(','),'croissant,espresso,nata');
 eq(a.qa('.tab')[0].dataset.category,'quick');eq(a.window.CupsProducts.length,13);
 ok(a.q('.header-nav a[href="#our-story"]'));ok(a.q('#mobile-nav-panel a[href="#our-story"]'));
 eq(a.q('.mobile-order').getAttribute('href'),'#menu');eq(a.q('.header-order').getAttribute('href'),'#menu');
 for(const lang of ['EN','PT','DE']){
  a.click(`.lang[data-lang="${lang}"]`);eq(a.q('#story-title').textContent,d[lang]['growth.storyTitle']);eq(a.q('#quick-copy').textContent,d[lang]['growth.quickCopy']);
  for(const category of ['drinks','breakfast','lunch','pastries','bundles','quick']){a.click(`[data-category="${category}"]`);eq(a.qa('.product-card:not(.hidden-product)').length,category==='quick'?3:a.window.CupsProducts.filter(p=>p.categories.includes(category)).length);}
 }
 ok(!a.q('#visit-dialog').open);auto(a);ok(a.q('#visit-dialog').open);eq(a.q('#visit-title').textContent,d.DE['growth.nataTitle']);
 a.click('.lang[data-lang="PT"]');ok(a.q('#visit-dialog').open);eq(a.q('#visit-title').textContent,d.PT['growth.nataTitle']);
 a.click('[data-close-visit]');ok(!a.q('#visit-dialog').open);auto(a);ok(!a.q('#visit-dialog').open);
 let b=boot(state,undefined,{sessionCache:a.sessionCache});auto(b);ok(!b.q('#visit-dialog').open);
 claim(b);ok(!b.q('#visit-dialog').open);ok(b.q('#nata-cart-note').textContent.includes(d.PT['growth.addNata']));
 b.click('[data-product-id="espresso"].add-product');eq(b.window.CupsGrowth.quote(b.window.CupsApp.cart).discount,0);
 for(let i=0;i<2;i++)b.click('[data-product-id="nata"].add-product');
 eq(b.window.CupsGrowth.quote(b.window.CupsApp.cart).discount,1.2);eq(b.window.CupsGrowth.quote(b.window.CupsApp.cart).total,1.95);eq(b.q('#total').textContent,b.window.CupsApp.money(1.95));
 b.click('[data-remove-product="nata"]');ok(b.q('#nata-discount-row').hidden);eq(b.window.CupsGrowth.quote(b.window.CupsApp.cart).total,.75);
 b.click('[data-product-id="nata"].add-product');b.click('#pay-button');eq(b.q('#checkout-total').textContent,b.window.CupsApp.money(.75));ok(!b.q('#checkout-discount').hidden);b.click('[data-close-payment]');
 b=boot(state);ok(!b.q('#nata-cart-note').hidden);b.click('[data-product-id="nata"].add-product');pay(b,'google');ok(JSON.parse(state.getItem(VISITOR)).redeemed);ok(b.q('#nata-offer-button').hidden);
 b=boot(state);b.click('[data-product-id="nata"].add-product');eq(b.window.CupsGrowth.quote(b.window.CupsApp.cart).discount,0);auto(b);ok(!b.q('#visit-dialog').open);
 state=storage();a=boot(state);a.click('[data-product-id="nata"].add-product');eq(a.window.CupsGrowth.quote(a.window.CupsApp.cart).total,1.2);pay(a,'apple');ok(a.q('#nata-offer-button').hidden);
 state=storage();a=boot(state);a.click('[data-open-account="create"]');createValues(a,'growth@example.test');a.submit('#create-account-form');await until(()=>a.q('#profile-form'));a.click('[data-close-account]');
 claim(a);a.click('[data-product-id="espresso"].add-product');a.click('[data-product-id="nata"].add-product');pay(a,'card');eq(a.window.CupsStore.user.orders[0].total,.75);eq(a.window.CupsStore.user.orders[0].discount,1.2);eq(a.window.CupsStore.user.orders[0].promotion,'first-nata');eq(a.window.CupsStore.user.stamps,1);
 a.click('[data-open-account="profile"]');ok(a.q('#profile-history').textContent.includes(a.window.CupsApp.money(.75)));ok(a.q('#profile-history').textContent.includes(d.EN['growth.discount']));a.click('[data-close-account]');
 a=boot(state,'2026-10-08T09:30:00Z');auto(a);ok(a.q('#visit-dialog').open);ok(a.q('#visit-title').textContent.includes('Ana'));eq(a.q('#visit-action').textContent,d.EN['personal.again']);
 a.click('#visit-action');eq(a.q('#cart-count').textContent,'2');eq(a.window.CupsGrowth.quote(a.window.CupsApp.cart).discount,0);eq(a.window.CupsGrowth.quote(a.window.CupsApp.cart).total,1.95);
 const ss=a.sessionCache;a=boot(state,'2026-10-08T09:35:00Z',{sessionCache:ss});auto(a);ok(!a.q('#visit-dialog').open);a.click('.lang[data-lang="DE"]');ok(!a.q('#visit-dialog').open);
 state=storage({[VISITOR]:{lastSeen:new Date('2026-10-05T08:00:00Z').getTime()}});a=boot(state);auto(a);eq(a.q('#visit-action').textContent,d.EN['growth.browse']);a.click('#visit-action');eq(a.q('#cart-count').textContent,'0');
 state=storage();a=boot(state);a.click('[data-open-account="create"]');auto(a);ok(!a.q('#visit-dialog').open);a.click('[data-close-account]');a.timers.find(t=>t.ms===3000).fn();eq(a.qa('dialog[open]').length,1);a.click('[data-close-visit]');
 a.click('#chat-launcher');auto(a);eq(a.qa('dialog[open]').length,1);eq(a.q('#chat-mode').textContent,d.EN['growth.chatMode']);
 let reply=await submitChat(a,'How much is espresso?');ok(reply.includes('0.75'));ok(reply.toLowerCase().includes('espresso'));
 reply=await submitChat(a,'Quais são os alergénios?');eq(reply,d.PT['growth.chatIngredients']);
 reply=await submitChat(a,'Wie funktioniert die Abholung?');ok(reply.includes('Lissabonner'));ok(reply.includes('10:45'));
 reply=await submitChat(a,'Hola, ¿cuál es el horario?');ok(reply.includes('Lunes'));reply=await submitChat(a,'Bonjour, quels paiements?');ok(reply.includes('simulés'));
 reply=await submitChat(a,'Do you sell pizza?');eq(reply,d.EN['growth.chatUnknown']);
 a.click('.lang[data-lang="PT"]');eq(a.q('#chat-mode').textContent,d.PT['growth.chatMode']);ok(a.qa('#chat-log .user').length>=6);a.click('#chat-close');ok(!a.q('#chat-dialog').open);a.click('#chat-launcher');ok(a.q('#chat-dialog').open);a.click('#chat-close');
 a.window.CupsProducts[0].price=.85;ok(a.window.CupsGrowth.answer('espresso price').includes('0.85'));a.window.CupsProducts[0].price=.75;
 const knowledge=JSON.stringify(a.window.CupsGrowth.publicKnowledge());ok(!knowledge.includes('passwordHash'));ok(!knowledge.includes('sessionId'));ok(knowledge.includes('sameDayOnly'));
 state=storage();a=boot(state);ok(a.q('#community-join').hidden);ok(!a.q('#community-coming').hidden);ok(a.q('#verified-reviews').hidden);ok(!a.q('[data-i18n="reviews.one"]'));
 a.window.CupsConfig.whatsappCommunityUrl='javascript:alert(1)';a.window.CupsGrowth.refresh();ok(a.q('#community-join').hidden);a.window.CupsConfig.whatsappCommunityUrl='https://example.com/invite';a.window.CupsGrowth.refresh();ok(a.q('#community-join').hidden);
 a.window.CupsConfig.whatsappCommunityUrl='https://chat.whatsapp.com/TEST_FIXTURE';a.window.CupsGrowth.refresh();ok(!a.q('#community-join').hidden);eq(a.q('#community-join').getAttribute('href'),'https://chat.whatsapp.com/TEST_FIXTURE');ok(a.q('a[href="https://wa.me/351920588166"]'));
 a.window.CupsConfig.reviews=[{name:'Test attribution',text:'<img src=x onerror=alert(1)>',verifiedAt:'2026-10-15',sourceUrl:'https://example.com/test',rating:4,translations:{PT:'Excerto de teste'}}];a.window.CupsGrowth.refresh();ok(!a.q('#verified-reviews').hidden);eq(a.qa('#verified-reviews img').length,0);ok(a.q('#verified-reviews').textContent.includes('<img'));a.click('.lang[data-lang="PT"]');ok(a.q('#verified-reviews').textContent.includes('Excerto de teste'));
 let calls=[];a=boot(storage(),undefined,{config:{chatEndpoint:'https://example.com/chat'},fetch:async(url,opts)=>{calls.push({url,opts});return{ok:true,json:async()=>({reply:'Verified test response'})};}});eq(calls.length,0);a.click('#chat-launcher');reply=await submitChat(a,'Menu prices');eq(reply,'Verified test response');eq(calls.length,1);eq(calls[0].opts.credentials,'omit');ok(!calls[0].opts.headers.Authorization);ok(!calls[0].opts.body.includes('passwordHash'));
 a=boot(storage(),undefined,{config:{chatEndpoint:'https://example.com/chat'},fetch:async()=>{throw Error('offline')}});a.click('#chat-launcher');reply=await submitChat(a,'How do I pay?');ok(reply.includes(d.EN['growth.fallback']));ok(reply.includes('MB WAY'));
 const broken={getItem:()=>null,setItem:()=>{throw Error('quota')}};a=boot(broken);a.click('[data-growth-offer]');a.click('#visit-action');ok(a.q('#visit-dialog').open);eq(a.q('#visit-feedback').textContent,d.EN['account.storageError']);
 a=boot(storage());const ids=a.qa('[id]').map(e=>e.id);eq(new Set(ids).size,ids.length);
 for(const node of a.qa('script[src],link[rel="stylesheet"],img[src]')){const ref=node.getAttribute('src')||node.getAttribute('href');ok(!ref.startsWith('/'));ok(fs.existsSync(path.join(__dirname,'..',ref)),ref);}
 for(const el of a.qa('a[href^="#"]'))ok(a.q(el.getAttribute('href')),el.getAttribute('href'));
 // Requested follow-up: order/grouping, continuous numbers and all FAQ languages.
 a=boot(storage());
 const mainChildren=Array.from(a.q('main').children),ticker=mainChildren.findIndex(e=>e.hasAttribute('data-i18n')&&e.getAttribute('data-i18n')==='hero.ticker');
 eq(mainChildren[ticker+1].id,'our-story');ok(mainChildren[ticker+2].querySelector('[data-i18n="steps.title"]'));
 ok(a.q('#community #whatsapp-community'));ok(a.q('#community .community-neighborhood'));ok(!a.q('#testimonials #whatsapp-community'));
 for(const lang of ['EN','PT','DE']){
   a.click(`.lang[data-lang="${lang}"]`);
   eq(a.qa('[data-section-label]').map(e=>e.textContent.slice(0,2)).join(','),'01,02,03,04,05,06,07,08,09,10');
   eq(a.q('#reviews-title').textContent,a.window.CupsTranslations[lang]['growth.testimonialsTitle']);ok(!a.q('#reviews-empty').hidden);
 }
 a.click('.lang[data-lang="EN"]');
 const questions={
   EN:{hours:'What are your opening hours?',payment:'How do I pay?',order:'How do I place an order?',ingredients:'What allergens are there?',menu:'What are the prices?',pickup:'Can I pick up tomorrow?'},
   PT:{hours:'A que horas abrem e fecham?',payment:'Quais são as formas de pagamento?',order:'Como faço uma encomenda?',ingredients:'Quais são os alergénios?',menu:'Quanto custa o espresso?',pickup:'Posso recolher amanhã?'},
   DE:{hours:'Wann habt ihr geöffnet?',payment:'Wie kann ich bezahlen?',order:'Wie kann ich bestellen?',ingredients:'Welche Allergene gibt es?',menu:'Was kostet ein Espresso?',pickup:'Kann ich morgen abholen?'},
   ES:{hours:'¿A qué hora abren y cierran?',payment:'¿Cómo hago el pago?',order:'¿Cómo hago un pedido?',ingredients:'¿Cuáles son los alérgenos?',menu:'¿Cuánto cuesta el espresso?',pickup:'¿Cómo funciona la recogida?'},
   FR:{hours:'À quelle heure ouvrez-vous ?',payment:'Quels paiements acceptez-vous ?',order:'Comment commander ?',ingredients:'Quels sont les allergènes ?',menu:'Combien coûte un espresso ?',pickup:'Comment fonctionne le retrait ?'}
 };
 for(const [lang,topics] of Object.entries(questions))for(const [topic,q] of Object.entries(topics)){
   const actual=a.window.CupsGrowth.answer(q),expected=a.window.CupsGrowth.answer(q,topic,lang);
   eq(actual,expected,lang+' '+topic+': '+q);
 }
 a.click('#chat-launcher');
 for(const lang of ['EN','PT','DE','ES','FR']){
   a.q('#chat-language').value=lang;
   const result=await submitChat(a,'How do I pay?');eq(result,a.window.CupsGrowth.answer('How do I pay?','payment',lang),'Explicit response language '+lang);
 }
 a.q('#chat-language').value='PT';a.click('[data-chat-topic="hours"]');await until(()=>!a.q('#chat-send').disabled);ok(a.qa('#chat-log .assistant').at(-1).textContent.includes('Seg–Sex'));
 a.click('#chat-close');a.click('#chat-launcher');eq(a.q('#chat-language').value,'PT');a.click('#chat-close');
 console.log(`${checks} new-feature assertions passed: Quick Picks, pop-up timing/frequency, demo discount, guest/account eligibility, history/reorder, multilingual FAQ/proxy fallback, safe review/link configuration and static asset integrity.`);process.exit(0);
})().catch(e=>{console.error(e);process.exit(1)});
