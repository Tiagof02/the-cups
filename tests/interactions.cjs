const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const {webcrypto}=require('crypto');
const {parseHTML}=require('linkedom');
const root=require('path').join(__dirname,'..')+'/';const cache=new Map();let checks=0;
const storage={getItem:k=>cache.get(k)||null,setItem:(k,v)=>cache.set(k,String(v)),removeItem:k=>cache.delete(k)};
function boot(customStorage=storage,initialTime='2026-10-07T09:30:00Z'){
 let nowISO=initialTime;
 const{window,document}=parseHTML(fs.readFileSync(root+'index.html','utf8'));
 // DOM-only test adapter: browser-native dialog, focus, select and form methods.
 Object.defineProperty(window.HTMLSelectElement.prototype,'value',{configurable:true,get(){return Array.from(this.options).find(o=>o.selected)?.value??this.options[0]?.value??''},set(v){for(const o of this.options)o.removeAttribute('selected');const match=Array.from(this.options).find(o=>o.value===v);if(match)match.setAttribute('selected','');}});
 window.HTMLElement.prototype.focus=function(){document._focus=this};
 window.HTMLElement.prototype.scrollIntoView=function(){};
 for(const dialog of document.querySelectorAll('dialog')){
 dialog.showModal=function(){this.open=true;this.setAttribute('open','')};
 dialog.close=function(){this.open=false;this.removeAttribute('open');this.dispatchEvent(new window.Event('close'))};}
 document.querySelector('#newsletter-form').reset=function(){this.querySelector('input').value=''};
 const sandbox={window,document,localStorage:customStorage,TextEncoder,Uint8Array,Map,Date:class extends Date {constructor(...args){super(...(args.length?args:[nowISO]))}},Math,Number,Object,JSON,Intl,console,setTimeout,clearTimeout};
 Object.defineProperty(window,'crypto',{value:webcrypto,configurable:true});
 vm.createContext(sandbox);
 for(const file of ['i18n.js','products.js','account-store.js','pickup-times.js','app.js'])vm.runInContext(fs.readFileSync(root+file,'utf8'),sandbox,{filename:file});
 const q=s=>document.querySelector(s),qa=s=>Array.from(document.querySelectorAll(s));
 const click=s=>{const el=q(s);assert(el,s);el.click()};
 const val=(name,value)=>{q(`[name="${name}"]`).value=value};
 const submit=id=>q(id).dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));
 return{window,document,q,qa,click,val,submit,sandbox,setNow:iso=>{nowISO=iso;window.dispatchEvent(new window.Event('focus'));}};
}
function chooseTime(a,id){
 a.click('#slot-toggle');a.q('#pickup-time-select').value=id;
 a.q('#pickup-time-select').dispatchEvent(new a.window.Event('change',{bubbles:true}));
}
function pay(a,method='mbway'){
 a.click('#pay-button');a.click(`[data-payment-method="${method}"]`);
 if(['card','mbway'].includes(method))a.click('[data-fill-demo]');
 a.submit('#demo-payment-form');ok(a.q('.payment-success'));a.click('[data-close-payment]');
}
const eq=(a,b,label)=>{assert.deepEqual(a,b,label);checks++};
const ok=(value,label)=>{assert(value,label);checks++};
async function until(fn){const start=Date.now();while(!fn()){if(Date.now()-start>5000)throw new Error('async test timeout');await new Promise(r=>setTimeout(r,10));}}
const text=(app,sel)=>app.q(sel).textContent;
function createValues(a,email='ana@example.test'){
 for(const [k,v] of Object.entries({firstName:'Ana',lastName:'Silva',email,password:'demoPass123!',drink:'coffee',food:'pastries',location:'laranjeiras',time:'11:15',age:'25–34'}))a.val(k,v);
 a.q('[name="diet"][value="vegetarian"]').checked=true;
}
(async()=>{
 let a=boot();
 eq(a.qa('.product-card').length,13);
 const langs=a.window.CupsTranslations;
 for(const l of ['PT','DE'])eq(Object.keys(langs[l]),Object.keys(langs.EN));
 for(const l of ['EN','PT','DE'])for(const[k,v]of Object.entries(langs[l])){ok(v.length>0,k);eq((v.match(/\{\w+\}/g)||[]).sort(),(langs.EN[k].match(/\{\w+\}/g)||[]).sort(),k);}
 // Every annotated text/aria/placeholder key is supplied in all locales.
 for(const el of a.qa('[data-i18n],[data-i18n-aria],[data-i18n-placeholder]'))for(const attr of ['data-i18n','data-i18n-aria','data-i18n-placeholder'])if(el.hasAttribute(attr))ok(langs.EN[el.getAttribute(attr)],el.getAttribute(attr));
 a.click('.lang[data-lang="PT"]');eq(a.document.documentElement.lang,'pt-PT');eq(text(a,'h1'),langs.PT['hero.title']);
 a.click('[aria-label="Adicionar café espresso"]');eq(text(a,'#cart-count'),'1');ok(text(a,'#payment-feedback').includes('café espresso'));
 a.click('.lang[data-lang="DE"]');eq(text(a,'#cart-count'),'1');eq(text(a,'#payment-feedback'),'Espresso hinzugefügt.');
 a.click('.tab[data-category="lunch"]');eq(a.qa('.product-card:not(.hidden-product)').length,3);eq(text(a,'#menu-group-title'),langs.DE['category.lunch']);
 chooseTime(a,'2026-10-07T11:30');ok(text(a,'#slot-feedback').includes('11:30'));
 a.click('[data-open-account="create"]');ok(a.q('dialog').open);ok(!a.q('[name="marketing"]').checked);
 a.submit('#create-account-form');eq(text(a,'#account-message'),langs.DE['account.requiredFields']);
 createValues(a);
 a.click('#account-dialog .lang[data-lang="PT"]');eq(a.q('[name="firstName"]').value,'Ana');eq(a.q('[name="drink"]').value,'coffee');
 a.val('password','short');a.submit('#create-account-form');eq(text(a,'#account-message'),langs.PT['account.invalidPassword']);
 a.val('password','demoPass123!');a.submit('#create-account-form');await until(()=>a.q('#profile-form'));
 eq(a.window.CupsStore.user.firstName,'Ana');eq(a.window.CupsStore.user.preferences.marketing,false);
 eq(a.window.CupsStore.user.preferences.diet[0],'vegetarian');eq(a.window.CupsStore.user.preferences.time,'11:15');
 ok(!cache.get('thecups.demo.v2').includes('demoPass123!'));eq(a.window.CupsStore.user.passwordHash.length,64);ok(text(a,'#profile-greeting').includes('Ana'));
 a.val('firstName','Anabela');a.q('[name="marketing"]').checked=true;a.submit('#profile-form');eq(a.window.CupsStore.user.firstName,'Anabela');eq(a.window.CupsStore.user.preferences.marketing,true);
 a.click('[data-close-account]');a.click('[data-favorite="cappuccino"]');eq(a.window.CupsStore.user.favorites.join(','),'cappuccino');
 a.click('[data-favorite="cappuccino"]');eq(a.window.CupsStore.user.favorites.length,0);a.click('[data-favorite="cappuccino"]');
 a.click('.tab[data-category="drinks"]');a.click('.add-product[data-product-id="cappuccino"]');
 pay(a);eq(a.window.CupsStore.user.orders.length,1);eq(a.window.CupsStore.user.stamps,1);eq(text(a,'#cart-count'),'0');
 a.click('#pay-button');eq(a.window.CupsStore.user.orders.length,1);
 // Actual new DOM and execution context with the same storage simulates reload.
 a=boot();eq(a.window.CupsStore.user.firstName,'Anabela');eq(a.document.documentElement.lang,'pt-PT');eq(a.window.CupsStore.user.favorites.join(','),'cappuccino');eq(a.window.CupsStore.user.orders.length,1);ok(!a.q('#personal-area').hidden);
 a.click('[data-open-account="profile"]');ok(text(a,'#profile-history').includes('cappuccino'));eq(a.q('[name="marketing"]').checked,true);
 a.click('#account-dialog .lang[data-lang="DE"]');eq(text(a,'#profile-history h4').slice(0,10),'Bestellung');eq(a.q('[name="firstName"]').value,'Anabela');
 a.click('#profile-history [data-order-again]');eq(text(a,'#cart-count'),'2');ok(!a.q('dialog').open);
 a.click('[data-logout]');eq(a.window.CupsStore.user,null);eq(text(a,'#cart-count'),'0');ok(a.q('#personal-area').hidden);
 a=boot();eq(a.window.CupsStore.user,null);
 a.click('[data-open-account="login"]');a.val('email','ANA@EXAMPLE.TEST');a.val('password','wrongPassword');a.submit('#login-form');await until(()=>text(a,'#account-message')===langs.DE['account.credentials']);
 a.val('password','demoPass123!');a.submit('#login-form');await until(()=>a.q('#profile-form'));eq(a.window.CupsStore.user.firstName,'Anabela');
 a.click('[data-logout]');a.click('[data-open-account="create"]');createValues(a);a.submit('#create-account-form');await until(()=>text(a,'#account-message')===langs.DE['account.duplicate']);
 a.val('email','bea@example.test');a.val('firstName','Bea');a.submit('#create-account-form');await until(()=>a.q('#profile-form'));eq(a.window.CupsStore.user.orders.length,0);eq(a.window.CupsStore.user.favorites.length,0);eq(a.window.CupsStore.user.stamps,0);
 a.click('[data-close-account]');a.click('.tab[data-category="pastries"]');a.click('.add-product[data-product-id="nata"]');pay(a);eq(a.window.CupsStore.user.orders.length,1);eq(a.window.CupsStore.user.stamps,0);
 // Reward boundary: each completed drink order adds one stamp, including bundles.
 for(let i=0;i<7;i++){a.click('.add-product[data-product-id="espresso"]');pay(a)}
 eq(a.window.CupsStore.user.stamps,7);eq(a.qa('#loyalty-stamps .bg-\\[\\#FF5A36\\]').length,7);ok(text(a,'#loyalty-customer').includes('1 Demo-Belohnungen'));
 a.click('[data-open-account="profile"]');a.val('firstName','<img src=x onerror=alert(1)>');a.submit('#profile-form');eq(a.qa('#profile-greeting img').length,0);ok(text(a,'#profile-greeting').includes('<img'));
 a.click('[data-logout]');a.click('[data-favorite="croissant"]');ok(a.q('dialog').open);a.val('email','ana@example.test');a.val('password','demoPass123!');a.submit('#login-form');await until(()=>a.q('#profile-form'));ok(a.window.CupsStore.user.favorites.includes('croissant'));
 a.click('[data-close-account]');a.click('[data-logout]');a.click('.add-product[data-product-id="club"]');pay(a);ok(text(a,'#payment-feedback').includes('Demo-Bestellung'));eq(a.window.CupsStore.state.accounts[0].orders.length,1);
 for(const lang of ['EN','PT','DE']){a.click(`.lang[data-lang="${lang}"]`);a.click('.vote-button');ok(text(a,'#vote-feedback').includes(a.window.CupsTranslations[lang]['special.matcha']));a.click('.faq-item > button');eq(a.q('.faq-item > button').getAttribute('aria-expanded'),a.q('.faq-item').classList.contains('open')?'true':'false');}
 a.q('#newsletter-email').value='bad';a.submit('#newsletter-form');eq(text(a,'#newsletter-feedback'),langs.DE['newsletter.error']);a.q('#newsletter-email').value='test@example.test';a.submit('#newsletter-form');eq(text(a,'#newsletter-feedback'),langs.DE['newsletter.saved']);
 // Storage write failures do not create a pretend saved account/order.
 const failing={...storage,setItem(){throw new Error('QuotaExceededError')}};
 let b=boot(failing);b.click('[data-open-account="create"]');createValues(b,'failure@example.test');b.submit('#create-account-form');await until(()=>text(b,'#account-message')===langs.DE['account.storageError']);eq(b.window.CupsStore.user,null);
 const corrupt=boot({getItem(){return 'not json'},setItem(){}});ok(text(corrupt,'#site-notice').includes('Saved demo data'));corrupt.click('[data-open-account="login"]');ok(text(corrupt,'#account-message').includes('Saved demo data'));
 // Stage 3: all required fields, optional preferences and payment lifecycle.
 cache.clear();a=boot();
 a.click('[data-open-account="create"]');
 for(const lang of ['EN','PT','DE']){
   a.click(`#account-dialog .lang[data-lang="${lang}"]`);a.submit('#create-account-form');
   eq(text(a,'#account-message'),langs[lang]['account.requiredFields']);
   eq(a.qa('#create-account-form [aria-invalid="true"]').length,4);eq(a.window.CupsStore.state.accounts.length,0);
   eq(a.qa('#create-account-form select[required]').length,0);ok(!a.q('[name="time"]').hasAttribute('required'));
 }
 a.val('firstName','   ');a.val('lastName','Demo');a.val('email','optional@example.test');a.val('password','examplePass123');a.submit('#create-account-form');eq(a.window.CupsStore.state.accounts.length,0);eq(a.q('[name="firstName"]').getAttribute('aria-invalid'),'true');
 a.val('firstName','Optional');a.submit('#create-account-form');await until(()=>a.q('#profile-form'));
 eq(a.window.CupsStore.user.preferences.time,'noPreference');eq(a.window.CupsStore.user.preferences.drink,'noPreference');eq(a.window.CupsStore.user.preferences.food,'noPreference');eq(a.window.CupsStore.user.preferences.location,'');eq(a.window.CupsStore.user.preferences.marketing,false);
 a.click('[data-close-account]');
 ok(a.q('#slot-options').hidden);a.click('#slot-toggle');ok(!a.q('#slot-options').hidden);eq(a.q('#slot-toggle').getAttribute('aria-expanded'),'true');
 const chosen=Array.from(a.q('#pickup-time-select').options).filter(o=>!o.disabled)[10].value;
 a.q('#pickup-time-select').value=chosen;a.q('#pickup-time-select').dispatchEvent(new a.window.Event('change',{bubbles:true}));
 ok(a.q('#slot-options').hidden);ok(text(a,'#slot-feedback').includes(chosen.slice(11)));
 const slots=a.window.CupsPickup.available(new Date('2026-10-07T05:00:00Z'));
 eq(slots[0].time,'08:00');eq(slots[1].time,'08:15');eq(slots[slots.length-1].time,'23:45');
 eq(a.window.CupsPickup.available(new Date('2026-10-10T05:00:00Z'))[0].time,'08:30');
 const late=a.window.CupsPickup.available(new Date('2026-10-07T23:10:00Z'));eq(late[0].time,'08:00');eq(late[0].date,'2026-10-08');
 for(const slot of slots)eq(Number(slot.time.slice(3))%15,0);
 a.click('.add-product[data-product-id="espresso"]');a.click('#pay-button');ok(a.q('#payment-dialog').open);eq(a.window.CupsStore.user.orders.length,0);
 a.click('[data-payment-method="card"]');a.submit('#demo-payment-form');eq(a.qa('#payment-dialog [aria-invalid="true"]').length,3);eq(a.window.CupsStore.user.orders.length,0);
 a.click('[data-fill-demo]');
 for(const lang of ['EN','PT','DE']){
   a.click(`#payment-dialog .lang[data-lang="${lang}"]`);eq(text(a,'#payment-title'),langs[lang]['payment.title']);eq(a.q('#demo-card').value,'4242 4242 4242 4242');ok(text(a,'#checkout-pickup').includes(chosen.slice(11)));
 }
 a.q('#demo-cvv').value='999';a.submit('#demo-payment-form');eq(a.window.CupsStore.user.orders.length,0);eq(text(a,'#checkout-message'),langs.DE['payment.invalidDemo']);
 a.click('[data-fill-demo]');a.submit('#demo-payment-form');eq(a.window.CupsStore.user.orders.length,1);eq(a.window.CupsStore.user.orders[0].paymentMethod,'card');eq(a.window.CupsStore.user.orders[0].time,chosen.slice(11));eq(a.window.CupsStore.user.stamps,1);eq(a.qa('[data-payment-sensitive]').length,0);
 ok(!cache.get('thecups.demo.v2').includes('4242'));ok(!cache.get('thecups.demo.v2').includes('900000000'));
 a.click('[data-close-payment]');
 a.click('.add-product[data-product-id="nata"]');a.click('#pay-button');a.click('[data-fill-demo]');a.click('[data-close-payment]');eq(a.window.CupsStore.user.orders.length,1);eq(text(a,'#cart-count'),'1');eq(a.qa('[data-payment-sensitive]').length,0);
 pay(a,'mbway');eq(a.window.CupsStore.user.orders.length,2);eq(a.window.CupsStore.user.orders[0].paymentMethod,'mbway');eq(a.window.CupsStore.user.stamps,1);
 a.click('[data-favorite="nata"]');a=boot();eq(a.window.CupsStore.user.orders.length,2);ok(a.window.CupsStore.user.favorites.includes('nata'));eq(a.window.CupsStore.user.stamps,1);
 a.click('[data-open-account="profile"]');a.click('#profile-history [data-order-again]');eq(text(a,'#cart-count'),'1');
 a.click('[data-logout]');
 for(const method of ['card','mbway','apple','google']){
   a.click('.add-product[data-product-id="espresso"]');pay(a,method);eq(a.window.CupsStore.user,null);eq(a.window.CupsStore.state.accounts[0].orders.length,2);eq(text(a,'#cart-count'),'0');
 }
 // Same-day correction: full schedule, disabled past times, one time everywhere.
 cache.clear();a=boot(storage,'2026-10-07T16:48:00Z'); // 17:48 Lisbon
 const full=a.window.CupsPickup.schedule(new Date('2026-10-07T16:48:00Z'));
 eq(full.length,66);eq(full[0].time,'00:00');eq(full[1].time,'00:15');eq(full[2].time,'08:00');eq(full[65].time,'23:45');
 ok(full.every(x=>x.date==='2026-10-07'));ok(full.find(x=>x.time==='08:00').disabled);ok(full.find(x=>x.time==='18:00').disabled);ok(!full.find(x=>x.time==='18:15').disabled);
 eq(text(a,'.quick-slot-time'),'18:15');eq(a.qa('#quick-slots .quick-slot:not([hidden])').length,3);eq(a.qa('.hero-art-note').length,0);
 eq(a.q('.hero-art img').getAttribute('src'),'assets/brand/hero-cup.png');
 eq(a.q('.hero-art img').getAttribute('width'),'1283');eq(a.q('.hero-art img').getAttribute('height'),'1226');
 for(const lang of ['EN','PT','DE']){
   a.click(`.lang[data-lang="${lang}"]`);a.click('#slot-toggle');
   eq(a.q('#pickup-time-select').options.length,66);
   const options=Array.from(a.q('#pickup-time-select').options);
   ok(options.every(o=>/^\d{2}:\d{2}$/.test(o.textContent)));ok(options.find(o=>o.textContent==='08:00').disabled);
   a.q('#pickup-time-select').value='2026-10-07T08:00';a.q('#pickup-time-select').dispatchEvent(new a.window.Event('change',{bubbles:true}));ok(text(a,'#slot-feedback').includes('18:15'));
   chooseTime(a,'2026-10-07T19:00');eq(a.qa('.quick-slot[aria-pressed="true"]').length,0);eq(a.q('#pickup-time-select').value,'2026-10-07T19:00');ok(text(a,'#slot-feedback').includes('19:00'));ok(text(a,'#next-pickup').includes('19:00'));
   a.click('.add-product[data-product-id="espresso"]');a.click('#pay-button');ok(text(a,'#checkout-pickup').includes('19:00'));ok(!text(a,'#checkout-pickup').includes('2026'));a.click('[data-close-payment]');
   chooseTime(a,'2026-10-07T18:15');eq(text(a,'.quick-slot-label'),langs[lang]['pickup.next']);eq(a.q('.quick-slot').getAttribute('aria-pressed'),'true');
 }
 // Quick-access choices stay the earliest three, independent of chosen later time.
 eq(a.qa('.quick-slot-time').map(b=>b.textContent).join(','),'18:15,18:30,18:45');
 ok(a.q('#slot-options').hidden);eq(a.q('#slot-toggle').getAttribute('aria-expanded'),'false');
 for(const lang of ['EN','PT','DE']){
   a.click(`.lang[data-lang="${lang}"]`);eq(text(a,'#slot-toggle span'),langs[lang]['pickup.moreTimes']);
   for(const index of [1,2,0]){
     a.click(`[data-quick-index="${index}"]`);
     const time=['18:15','18:30','18:45'][index];
     eq(a.qa('.quick-slot[aria-pressed="true"]').length,1);eq(a.q(`[data-quick-index="${index}"]`).getAttribute('aria-pressed'),'true');
     eq(a.q('#pickup-time-select').value,'2026-10-07T'+time);ok(text(a,'#cart-pickup').includes(time));ok(text(a,'#slot-feedback').includes(time));ok(text(a,'#next-pickup').includes(time));
     ok(a.q('#slot-options').hidden);a.click('#pay-button');ok(text(a,'#checkout-pickup').includes(time));a.click('[data-close-payment]');
   }
   chooseTime(a,'2026-10-07T20:00');eq(a.qa('.quick-slot[aria-pressed="true"]').length,0);ok(text(a,'#cart-pickup').includes('20:00'));
   eq(a.qa('.quick-slot-time').map(b=>b.textContent).join(','),'18:15,18:30,18:45');
   a.click('[data-quick-index="0"]');
 }
 // The clock advances: selected expired slot is replaced consistently.
 a.setNow('2026-10-07T17:01:00Z');eq(text(a,'.quick-slot-time'),'18:30');ok(text(a,'#slot-feedback').includes('18:30'));
 a.click('#pay-button');a.click('[data-payment-method="apple"]');
 a.setNow('2026-10-07T22:31:00Z'); // 23:31 Lisbon: 15-minute preparation leaves no slot today.
 eq(a.window.CupsPickup.available(new Date('2026-10-07T22:31:00Z')).length,0);
 eq(text(a,'#slot-feedback'),langs.DE['pickup.none']);ok(a.q('#quick-slots').hidden);ok(a.q('#pay-button').disabled);ok(a.q('#demo-pay-submit').disabled);eq(a.q('#pickup-time-select').options.length,66);
 ok(Array.from(a.q('#pickup-time-select').options).every(o=>o.disabled));a.submit('#demo-payment-form');ok(!a.q('.payment-success'));eq(text(a,'#checkout-message'),langs.DE['pickup.none']);
 a.click('[data-close-payment]');
 // A new local day can only offer that current day; no upcoming day ever appears.
 a.setNow('2026-10-07T23:00:00Z');eq(text(a,'.quick-slot-time'),'00:15');ok(!a.q('#pay-button').disabled);
 ok(Array.from(a.q('#pickup-time-select').options).every(o=>o.value.startsWith('2026-10-08T')));
 chooseTime(a,'2026-10-07T19:00');eq(text(a,'.quick-slot-time'),'00:15');
 // End-of-day boundaries never manufacture tomorrow's second/third slot.
 a.setNow('2026-10-08T22:14:00Z');eq(a.qa('.quick-slot:not([hidden])').length,2);eq(a.qa('.quick-slot:not([hidden]) .quick-slot-time').map(b=>b.textContent).join(','),'23:30,23:45');
 a.setNow('2026-10-08T22:29:00Z');eq(a.qa('.quick-slot:not([hidden])').length,1);eq(text(a,'.quick-slot-time'),'23:45');
 a.setNow('2026-10-08T22:31:00Z');eq(a.qa('.quick-slot:not([hidden])').length,0);ok(a.q('#pay-button').disabled);
 const weekend=a.window.CupsPickup.schedule(new Date('2026-10-10T16:00:00Z'));
 eq(weekend[2].time,'08:30');ok(weekend.every(x=>x.date==='2026-10-10'));
 for(const iso of ['2026-10-25T00:30:00Z','2026-10-25T01:30:00Z']){
   const dst=a.window.CupsPickup.schedule(new Date(iso));ok(dst.every(x=>x.date==='2026-10-25'));eq(dst.find(x=>!x.disabled).time,'08:30');
 }
 console.log(`${checks} assertions passed: translations, validation, account creation/login/logout, profile editing, favorites, reload persistence, account isolation, cart, required/optional fields, pickup intervals/dropdown, four simulated payment methods, guest/logged-in checkout, payment-data disposal, demo orders, reorder, loyalty, FAQ, newsletter and storage failures.`);
 process.exit(0);
})().catch(e=>{console.error(e);process.exit(1)});
