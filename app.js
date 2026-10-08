/* The Cup's stage 3. Static storefront, translated UI, local demo accounts.
   No analytics, payment, email or account data is sent to a server. */
(() => {
  'use strict';
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));
  const store = window.CupsStore;
  const products = window.CupsProducts;
  const productById = Object.fromEntries(products.map(p => [p.id,p]));
  const dictionaries = window.CupsTranslations;
  const localeCodes = {EN:'en-GB', PT:'pt-PT', DE:'de-DE'};
  let language = store.state.language;
  let dailySlots = window.CupsPickup.schedule();
  let availableSlots = dailySlots.filter(slot=>!slot.disabled);
  let selectedPickup = availableSlots[0]||null;
  let paymentMethod = 'mbway';
  let paymentOrder = null;
  let checkoutUserId = null;
  const paymentDialog = $('#payment-dialog');
  let selectedCategory = null; // Preserve the baseline's initial view of all products.
  let pendingFavorite = null;
  let dialogView = null;
  let previousFocus = null;
  let authBusy = false;
  let noticeTimer;
  const cart = new Map();
  const messages = new Map();
  const specials = {'strawberry matcha':'special.matcha','pistachio cold foam':'special.pistachio','chilli cheese toastie':'special.toastie'};
  const drinkOptions = ['coffee','juice','tea','other','noPreference'];
  const foodOptions = ['pastries','sandwiches','bowls','noPreference'];
  const dietOptions = ['vegetarian','vegan','dairyFree','glutenFree'];
  const timeOptions = ['noPreference',...window.CupsPickup.preferenceTimes];
  const ages = ['','18–24','25–34','35–44','45–54','55+'];
  const LOCATION = 'Laranjeiras · Rua das Laranjeiras 47C';
  const dialog = $('#account-dialog');
  const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const t = (key, params = {}) => {
    const values = {...params};
    if (values.productId) values.product = t(productById[values.productId]?.nameKey || 'product.espresso');
    if (values.specialId) values.special = t(specials[values.specialId]);
    return (dictionaries[language][key] ?? dictionaries.EN[key] ?? key).replace(/\{(\w+)\}/g, (all,k) => values[k] ?? all);
  };
  const money = value => new Intl.NumberFormat(localeCodes[language], {style:'currency',currency:'EUR'}).format(value);
  const productName = id => t(productById[id].nameKey);
  const span = key => `<span data-i18n="${key}">${escapeHTML(t(key))}</span>`;
  function element(tag, className, text) {
    const e=document.createElement(tag); if(className)e.className=className;
    if(text !== undefined)e.textContent=text; return e;
  }
  function actionButton(text, dataName, dataValue, className='pill') {
    const b=element('button',className,text); b.type='button'; b.dataset[dataName]=dataValue; return b;
  }
  function renderMessage(id) {
    const e=document.getElementById(id), message=messages.get(id); if(!e)return;
    e.textContent=message ? t(message.key,message.params) : '';
    if(id==='site-notice')e.hidden=!message;
  }
  function message(id,key,params={}) {
    if(key)messages.set(id,{key,params});else messages.delete(id);
    renderMessage(id);
  }
  function notice(key,params={}) {
    message('site-notice',key,params);clearTimeout(noticeTimer);
    noticeTimer=setTimeout(()=>message('site-notice',null),6000);
  }
  function errorMessage(error,target='account-message') {
    const key=Object.hasOwn(dictionaries.EN,error.message)?error.message:'account.storageError';
    message(target,key);
  }
  function translateStatic(root=document) {
    $$('[data-i18n]',root).forEach(e=>{
      let params={};try{params=JSON.parse(e.getAttribute('data-i18n-params')||'{}')}catch{}
      e.textContent=t(e.getAttribute('data-i18n'),params);
    });
    $$('[data-i18n-aria]',root).forEach(e=>e.setAttribute('aria-label',t(e.getAttribute('data-i18n-aria'))));
    $$('[data-i18n-placeholder]',root).forEach(e=>e.placeholder=t(e.getAttribute('data-i18n-placeholder')));
    $$('.lang',root).forEach(e=>{
      const active=e.dataset.lang===language;
      e.classList.toggle('active',active);e.setAttribute('aria-pressed',String(active));
    });
  }
  function setLanguage(next, persist=true) {
    if(!dictionaries[next])return;
    language=next;
    if(persist){try{store.commit(s=>s.language=next)}catch(e){notice(e.message)}}
    document.documentElement.lang=localeCodes[next];
    document.title=t('page.title');
    translateStatic();
    $('[id="language-feedback"]').textContent=t('language.active');
    $('#menu-group-title').textContent=t('category.'+(selectedCategory==='drinks'||!selectedCategory?'classics':selectedCategory));
    $$('[data-price-value]').forEach(e=>e.textContent=money(Number(e.dataset.priceValue)));
    $$('.add-product').forEach(b=>b.setAttribute('aria-label',t('aria.add',{product:productName(b.dataset.productId)})));
    renderSlots();syncPayment();
    updateCart();renderAccountSurfaces();
    for(const id of messages.keys())renderMessage(id);
  }
  function updateCart() {
    const list=$('#cart-items');$$('.cart-row',list).forEach(e=>e.remove());
    let count=0,total=0;
    cart.forEach((qty,id)=>{
      const p=productById[id];count+=qty;total+=p.price*qty;
      const row=element('div','cart-row flex items-center justify-between gap-3 py-3');
      const details=element('div');details.append(element('p','font-black lowercase',productName(id)),element('p','text-sm font-bold',money(p.price)));
      const controls=element('div','flex items-center gap-2');
      for(const change of [-1,1]) {
        const b=element('button','qty rounded-full border-2 border-[#1E1513] bg-[#F6EFE3] px-2',change===-1?'−':'+');
        b.type='button';b.dataset.id=id;b.dataset.change=String(change);
        b.setAttribute('aria-label',t(change===-1?'aria.decrease':'aria.increase',{product:productName(id)}));
        controls.append(b);if(change===-1)controls.append(element('span','font-black',qty));
      }
      const remove=actionButton(t('cart.remove'),'removeProduct',id,'remove ml-1 text-sm font-black underline');controls.append(remove);
      row.append(details,controls);list.append(row);
    });
    $('#cart-empty').hidden=count>0;$('#cart-count').textContent=count;
    $('#subtotal').textContent=money(total);$('#total').textContent=money(total);
    $$('[data-basket-quantity]').forEach(badge=>{
      const id=badge.dataset.basketQuantity,qty=cart.get(id)||0;
      badge.hidden=qty===0;badge.textContent=qty?t('cart.inBasket',{count:qty}):'';
      if(qty)badge.setAttribute('aria-label',t('aria.basketQuantity',{count:qty,product:productName(id)}));
      else badge.removeAttribute('aria-label');
    });
  }
  function addProduct(id,qty=1) {
    if(!productById[id])return;
    cart.set(id,(cart.get(id)||0)+qty);updateCart();
    message('payment-feedback','cart.added',{productId:id});
    message('suggestion-feedback','cart.inOrder',{productId:id});
  }
  function pickupLabel(slot=selectedPickup) { return slot?.time||t('pickup.none'); }
  function renderSlots() {
    const select=$('#pickup-time-select');
    const scrollTop=select.scrollTop;select.replaceChildren();
    dailySlots.forEach(slot=>{const o=element('option','',slot.time);o.value=slot.id;o.disabled=slot.disabled;select.append(o);});
    if(selectedPickup)select.value=selectedPickup.id;else select.selectedIndex=-1;
    select.scrollTop=scrollTop;
    const label=selectedPickup?.id===availableSlots[0]?.id?'pickup.next':'pickup.selected';
    $$('.quick-slot').forEach((button,index)=>{
      const slot=availableSlots[index];button.hidden=!slot;button.disabled=!slot;
      button.setAttribute('aria-pressed',String(!!slot&&slot.id===selectedPickup?.id));
      if(!slot){button.removeAttribute('data-quick-slot');button.removeAttribute('aria-label');return;}
      button.dataset.quickSlot=slot.id;
      $('.quick-slot-time',button).textContent=slot.time;
      $('.quick-slot-label',button).textContent=index===0?t('pickup.next'):'';
      button.setAttribute('aria-label',(index===0?t('pickup.next')+': ':'')+slot.time);
    });
    $('#quick-slots').hidden=!availableSlots.length;
    $('#cart-pickup').textContent=selectedPickup?t('pickup.selected')+': '+pickupLabel():t('pickup.none');
    $('#next-pickup').textContent=selectedPickup?t(label)+': '+pickupLabel():t('pickup.none');
    $('#slot-feedback').textContent=selectedPickup?t('slot.selected',{time:pickupLabel()}):t('pickup.none');
    $('#pay-button').disabled=!selectedPickup;
  }
  function refreshSlots() {
    dailySlots=window.CupsPickup.schedule();availableSlots=dailySlots.filter(slot=>!slot.disabled);
    const previous=selectedPickup?.id;
    selectedPickup=availableSlots.find(slot=>slot.id===previous)||availableSlots[0]||null;
    renderSlots();syncPayment();return previous===selectedPickup?.id;
  }
  function selectSlot(time) {
    // Recheck against the clock, including a midnight rollover or a stale open panel.
    refreshSlots();
    const slot=availableSlots.find(s=>s.id===time);if(!slot)return;
    selectedPickup=slot;renderSlots();syncPayment();
  }
  function toggleSlotOptions(open) {
    const toggle=$('#slot-toggle'),box=$('#slot-options');
    toggle.setAttribute('aria-expanded',String(open));box.hidden=!open;
    if(open){refreshSlots();$('#pickup-time-select').focus();}
  }
  function filterMenu(category) {
    selectedCategory=category;
    $$('.tab').forEach(b=>{b.classList.toggle('active',b.dataset.category===category);b.setAttribute('aria-selected',String(b.dataset.category===category));});
    $$('.product-card').forEach(c=>c.classList.toggle('hidden-product',!productById[c.dataset.productId].categories.includes(category)));
    $('#menu-group-title').textContent=t('category.'+(category==='drinks'?'classics':category));
  }
  function saveUser(change) {
    const id=store.user?.id;if(!id)throw new Error('account.sessionLost');
    store.commit(s=>{const user=s.accounts.find(a=>a.id===id);if(!user||s.sessionId!==id)throw new Error('account.sessionLost');change(user);});
  }
  function completeOrder() {
    if(!cart.size){message('checkout-message','cart.emptyError');return false;}
    if(!selectedPickup){message('checkout-message','pickup.none');return false;}
    const now=new Date();
    const order={number:now.getTime().toString(36).toUpperCase()+'-'+Math.floor(Math.random()*1000).toString().padStart(3,'0'),createdAt:now.toISOString(),time:selectedPickup.time,pickupDate:selectedPickup.date,paymentMethod,location:LOCATION,items:Array.from(cart,([id,qty])=>({id,qty,price:productById[id].price}))};
    if(store.user){
      try{saveUser(user=>{user.orders.unshift(order);user.orders=user.orders.slice(0,50);if(order.items.some(i=>productById[i.id].hasDrink))user.stamps+=1;});}
      catch(e){errorMessage(e,'checkout-message');return false;}
    }
    cart.clear();updateCart();renderAccountSurfaces();
    message('suggestion-feedback',null);
    message('payment-feedback','cart.confirmed',{number:order.number,time:pickupLabel()});
    return order;
  }
  function syncPayment() {
    if(!paymentDialog.open)return;
    if(paymentOrder){
      $('#payment-confirmed-copy').textContent=t('cart.confirmed',{number:paymentOrder.number,time:pickupLabel({date:paymentOrder.pickupDate,time:paymentOrder.time})});
      return;
    }
    $('#checkout-total').textContent=money(Array.from(cart,([id,qty])=>productById[id].price*qty).reduce((a,b)=>a+b,0));
    $('#checkout-pickup').textContent=t('order.pickup',{time:pickupLabel(),location:LOCATION});
    $$('[data-payment-method]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.paymentMethod===paymentMethod)));
    const submit=$('#demo-pay-submit');submit.disabled=!selectedPickup;submit.textContent=t('payment.confirm',{method:paymentMethod==='card'?t('payment.card'):({mbway:'MB WAY',apple:'Apple Pay',google:'Google Pay'})[paymentMethod]});
  }
  function renderPaymentFields() {
    const fields=$('#payment-fields');fields.replaceChildren();message('checkout-message',null);
    const input=(id,key,placeholder,max)=>`<div class="payment-field"><label for="${id}">${span(key)}</label><input id="${id}" type="text" inputmode="numeric" autocomplete="off" maxlength="${max}" placeholder="${placeholder}" aria-describedby="payment-test-help checkout-message" data-payment-sensitive></div>`;
    if(paymentMethod==='card')fields.innerHTML=input('demo-card','payment.number','4242 4242 4242 4242',23)+`<div class="payment-pair">${input('demo-expiry','payment.expiry','12/30',5)}${input('demo-cvv','payment.cvv','123',3)}</div><p id="payment-test-help" class="account-hint" data-i18n="payment.cardHelp">${escapeHTML(t('payment.cardHelp'))}</p>`;
    if(paymentMethod==='mbway')fields.innerHTML=input('demo-phone','payment.phone','+351 900 000 000',16)+`<p id="payment-test-help" class="account-hint" data-i18n="payment.phoneHelp">${escapeHTML(t('payment.phoneHelp'))}</p>`;
    if(['card','mbway'].includes(paymentMethod))fields.innerHTML+=`<button type="button" class="account-link" data-fill-demo data-i18n="payment.fill">${escapeHTML(t('payment.fill'))}</button>`;
    else fields.innerHTML=`<p class="payment-demo" data-i18n="payment.wallet">${escapeHTML(t('payment.wallet'))}</p>`;
  }
  function fillDemoPayment() {
    if(paymentMethod==='card'){$('#demo-card').value='4242 4242 4242 4242';$('#demo-expiry').value='12/30';$('#demo-cvv').value='123';}
    else if(paymentMethod==='mbway')$('#demo-phone').value='+351 900 000 000';
    $$('[aria-invalid]',paymentDialog).forEach(e=>e.removeAttribute('aria-invalid'));message('checkout-message',null);
  }
  function openPayment() {
    if(!cart.size){message('payment-feedback','cart.emptyError');return;}
    refreshSlots();if(!selectedPickup){message('payment-feedback','pickup.none');return;}
    paymentOrder=null;paymentMethod='mbway';checkoutUserId=store.user?.id||null;
    $('#payment-content').innerHTML=`<div class="account-top">${languagePicker()}<button type="button" class="account-close" data-close-payment data-i18n-aria="payment.close" aria-label="${escapeHTML(t('payment.close'))}">×</button></div><h2 id="payment-title" class="account-title" data-i18n="payment.title">${escapeHTML(t('payment.title'))}</h2><p class="payment-demo" data-i18n="payment.demo">${escapeHTML(t('payment.demo'))}</p><div class="payment-summary"><div>${span('cart.total')}<span id="checkout-total"></span></div><p id="checkout-pickup"></p></div><form id="demo-payment-form" novalidate autocomplete="off"><fieldset><legend class="font-bold" data-i18n="payment.method">${escapeHTML(t('payment.method'))}</legend><div class="payment-methods"><button type="button" class="payment-method" data-payment-method="mbway">MB WAY</button><button type="button" class="payment-method" data-payment-method="card">${span('payment.card')}<small>Visa / Mastercard</small></button><button type="button" class="payment-method" data-payment-method="apple">Apple Pay</button><button type="button" class="payment-method" data-payment-method="google">Google Pay</button></div></fieldset><div id="payment-fields" class="payment-fields"></div><p id="checkout-message" class="account-message" role="alert"></p><button id="demo-pay-submit" type="submit" class="pill payment-submit"></button></form>`;
    renderPaymentFields();paymentDialog.showModal();syncPayment();$('.account-close',paymentDialog).focus();
  }
  function submitPayment() {
    if(paymentOrder)return;
    // Only these public dummy fixtures are accepted. Input values never enter an order,
    // localStorage, a network request, analytics or a log, and are cleared on close.
    message('checkout-message',null);
    const invalid=[];
    if(paymentMethod==='card'){
      if(!['4242424242424242','5555555555554444'].includes($('#demo-card').value.replace(/\s/g,'')))invalid.push($('#demo-card'));
      if($('#demo-expiry').value.trim()!=='12/30')invalid.push($('#demo-expiry'));
      if($('#demo-cvv').value!=='123')invalid.push($('#demo-cvv'));
    }else if(paymentMethod==='mbway'){
      if(!['351900000000','900000000'].includes($('#demo-phone').value.replace(/[+\s]/g,'')))invalid.push($('#demo-phone'));
    }else if(!['apple','google'].includes(paymentMethod))return;
    if(invalid.length){invalid.forEach(e=>e.setAttribute('aria-invalid','true'));invalid[0].focus();message('checkout-message','payment.invalidDemo');return;}
    store.refresh();
    if(store.error){message('checkout-message',store.error);return;}
    if((store.user?.id||null)!==checkoutUserId){message('checkout-message','account.sessionLost');return;}
    if(!refreshSlots()){message('checkout-message',selectedPickup?'payment.slotChanged':'pickup.none');return;}
    if(!selectedPickup){message('checkout-message','pickup.none');return;}
    const order=completeOrder();if(!order)return;
    paymentOrder=order;
    $$('[data-payment-sensitive]',paymentDialog).forEach(e=>e.value='');
    $('#payment-content').innerHTML=`<div class="account-top">${languagePicker()}<button type="button" class="account-close" data-close-payment data-i18n-aria="payment.close" aria-label="${escapeHTML(t('payment.close'))}">×</button></div><div class="payment-success"><div class="payment-success-mark" aria-hidden="true">✓</div><h2 id="payment-title" class="account-title" data-i18n="payment.success">${escapeHTML(t('payment.success'))}</h2><p id="payment-confirmed-copy" role="status"></p><p data-i18n="payment.noCharge">${escapeHTML(t('payment.noCharge'))}</p><button type="button" class="pill payment-submit" data-close-payment data-i18n="payment.done">${escapeHTML(t('payment.done'))}</button></div>`;
    syncPayment();$('#payment-title').setAttribute('tabindex','-1');$('#payment-title').focus();
  }
  paymentDialog.addEventListener('close',()=>{
    $$('[data-payment-sensitive]',paymentDialog).forEach(e=>e.value='');
    $('#payment-content').replaceChildren();paymentOrder=null;messages.delete('checkout-message');$('#pay-button').focus();
  });
  function orderAgain(number) {
    const order=store.user?.orders.find(o=>o.number===number);if(!order)return;
    for(const item of order.items)if(productById[item.id])cart.set(item.id,(cart.get(item.id)||0)+item.qty);
    updateCart();message('payment-feedback','cart.reordered');
    if(dialog.open)dialog.close();
    $('#pickup').scrollIntoView({behavior:'smooth',block:'start'});
  }
  function toggleFavorite(id) {
    if(!productById[id])return;
    if(!store.user){pendingFavorite=id;openAccount('login');message('account-message','favorite.login');return;}
    let added;
    try{saveUser(user=>{added=!user.favorites.includes(id);user.favorites=added?[...user.favorites,id]:user.favorites.filter(p=>p!==id);});}
    catch(e){notice(e.message);return;}
    renderAccountSurfaces();notice(added?'favorite.saved':'favorite.removed',{productId:id});
  }
  function favoritesInto(container,user) {
    container.replaceChildren();
    const favorites=user.favorites.filter(id=>productById[id]);
    if(!favorites.length){container.append(element('p','',t('favorite.empty')));return;}
    favorites.forEach(id=>{
      const b=actionButton(productName(id)+' · '+money(productById[id].price)+' +','favoriteAdd',id,'favorite-chip');
      b.setAttribute('aria-label',t('aria.add',{product:productName(id)}));container.append(b);
    });
  }
  function renderAccountSurfaces() {
    const user=store.user;
    const header=$('#header-account');
    header.innerHTML=user?
      `<button type="button" class="account-link" data-open-account="profile" data-i18n="account.profile">${escapeHTML(t('account.profile'))}</button><button type="button" class="account-link" data-logout data-i18n="account.logout">${escapeHTML(t('account.logout'))}</button>`:
      `<button type="button" class="account-link" data-open-account="login" data-i18n="account.login">${escapeHTML(t('account.login'))}</button><button type="button" class="pill account-create" data-open-account="create" data-i18n="account.create">${escapeHTML(t('account.create'))}</button>`;
    $('#mobile-account-panel').innerHTML=header.innerHTML;
    $$('.favorite-button').forEach(b=>{
      const saved=!!user?.favorites.includes(b.dataset.favorite);b.setAttribute('aria-pressed',String(saved));b.textContent=saved?'♥':'♡';
      b.setAttribute('aria-label',t(saved?'aria.unfavorite':'aria.favorite',{product:productName(b.dataset.favorite)}));
    });
    $('#personal-area').hidden=!user;
    if(user){
      $('#personal-greeting').textContent=t('account.greeting',{name:user.firstName});
      favoritesInto($('#personal-favorites'),user);
      const last=$('#personal-last-order');last.replaceChildren();
      if(user.orders.length){last.append(element('p','font-bold',t('personal.last')),actionButton(t('personal.again'),'orderAgain',user.orders[0].number,'favorite-chip'));}
    } else {
      $('#personal-greeting').textContent='';$('#personal-favorites').replaceChildren();$('#personal-last-order').replaceChildren();
    }
    const count=user?(user.stamps%7 || (user.stamps?7:0)):3;
    $$('#loyalty-stamps > span').forEach((e,i)=>e.classList.toggle('bg-[#FF5A36]',i<count));
    $('#loyalty-stamps').setAttribute('aria-label',user?t('loyalty.progress',{count}):t('loyalty.guest'));
    const loyalty=$('#loyalty-customer');loyalty.hidden=!user;loyalty.replaceChildren();
    if(user)loyalty.append(element('p','font-bold',t('loyalty.total',{total:user.stamps,rewards:Math.floor(user.stamps/7)})),element('p','text-sm',t('loyalty.rule')));
    if(dialogView==='profile' && user)renderProfileExtras(user);
  }
  function option(value,key,label) {
    return `<option value="${escapeHTML(value)}"${key?` data-i18n="${key}"`:''}>${escapeHTML(key?t(key):label)}</option>`;
  }
  function field(name,key,type='text',required=true,autocomplete='') {
    return `<div class="account-field"><label for="account-${name}">${span(key)}${required?' *':''}</label><input id="account-${name}" name="${name}" type="${type}" ${required?'required':''} ${autocomplete?`autocomplete="${autocomplete}"`:''} ${type==='text'?'maxlength="60"':''} ${type==='email'?'maxlength="254"':''} ${type==='password'?'minlength="8" maxlength="128"':''}></div>`;
  }
  function select(name,key,options,required=false) {
    return `<div class="account-field"><label for="account-${name}">${span(key)}${required?' *':''}</label><select id="account-${name}" name="${name}" ${required?'required':''}>${options}</select></div>`;
  }
  function preferencesFields() {
    return select('age','field.age',option('','option.private')+ages.slice(1).map(v=>option(v,null,v)).join(''),false)+
      select('drink','field.drink',option('','option.choose')+drinkOptions.map(v=>option(v,'option.'+v)).join(''))+
      select('food','field.food',option('','option.choose')+foodOptions.map(v=>option(v,'option.'+v)).join(''))+
      `<fieldset class="account-wide"><legend data-i18n="field.diet">${escapeHTML(t('field.diet'))}</legend><div class="account-checks">${dietOptions.map(v=>`<label class="account-check"><input type="checkbox" name="diet" value="${v}">${span('option.'+v)}</label>`).join('')}</div><p class="account-hint" data-i18n="field.dietHelp">${escapeHTML(t('field.dietHelp'))}</p></fieldset>`+
      select('location','field.location',option('','option.noPreference')+option('laranjeiras',null,LOCATION))+
      select('time','field.time',timeOptions.map(v=>option(v,v==='noPreference'?'option.noPreference':null,v)).join(''))+
      `<label class="account-check account-wide"><input type="checkbox" name="marketing">${span('field.marketing')}</label>`;
  }
  function languagePicker() {
    return `<div class="language-picker" data-i18n-aria="aria.language" aria-label="${escapeHTML(t('aria.language'))}">${['EN','PT','DE'].map(l=>`<button type="button" class="lang rounded-full px-2 py-1 text-xs font-bold ${language===l?'active':''}" data-lang="${l}" aria-pressed="${language===l}">${l}</button>`).join('')}</div>`;
  }
  function fillProfile(form,user) {
    for(const key of ['firstName','lastName'])$(`[name="${key}"]`,form).value=user[key];
    for(const key of ['age','drink','food','location','time'])$(`[name="${key}"]`,form).value=user.preferences[key]??'';
    $$('[name="diet"]',form).forEach(e=>e.checked=user.preferences.diet.includes(e.value));
    $('[name="marketing"]',form).checked=user.preferences.marketing;
  }
  function renderAccount(view) {
    const user=store.user;
    dialogView=user?'profile':(view==='create'?'create':'login');
    const isProfile=dialogView==='profile', isCreate=dialogView==='create';
    const titleKey=isProfile?'account.welcome':isCreate?'account.createTitle':'account.loginTitle';
    const content=$('#account-content');
    content.innerHTML=`<div class="account-top">${languagePicker()}<button type="button" class="account-close" data-close-account data-i18n-aria="account.close" aria-label="${escapeHTML(t('account.close'))}">×</button></div><h2 id="account-title" class="account-title" data-i18n="${titleKey}">${escapeHTML(t(titleKey))}</h2>`+
      (isProfile?'<p id="profile-greeting" class="account-intro font-bold"></p><p id="profile-email" class="account-email"></p>':`<p class="account-intro" data-i18n="${isCreate?'account.createCopy':'account.loginCopy'}">${escapeHTML(t(isCreate?'account.createCopy':'account.loginCopy'))}</p>`)+
      `<p class="account-demo" data-i18n="account.demo">${escapeHTML(t('account.demo'))}</p>`+
      (!isProfile?`<div class="account-tabs"><button type="button" class="pill ${!isCreate?'active':''}" data-open-account="login" data-i18n="account.login">${escapeHTML(t('account.login'))}</button><button type="button" class="pill ${isCreate?'active':''}" data-open-account="create" data-i18n="account.create">${escapeHTML(t('account.create'))}</button></div>`:
      `<section class="profile-block"><h3 data-i18n="profile.preferences">${escapeHTML(t('profile.preferences'))}</h3><dl id="profile-summary" class="profile-summary"></dl></section><section class="profile-block"><h3 data-i18n="profile.loyalty">${escapeHTML(t('profile.loyalty'))}</h3><div id="profile-loyalty"></div></section><section class="profile-block"><h3 data-i18n="profile.favorites">${escapeHTML(t('profile.favorites'))}</h3><div id="profile-favorites" class="favorite-list"></div></section><section class="profile-block"><h3 data-i18n="profile.history">${escapeHTML(t('profile.history'))}</h3><p class="account-hint" data-i18n="profile.historyNote">${escapeHTML(t('profile.historyNote'))}</p><div id="profile-history"></div></section><section class="profile-block"><h3 data-i18n="profile.details">${escapeHTML(t('profile.details'))}</h3></section>`)+
      `<form id="${isProfile?'profile-form':isCreate?'create-account-form':'login-form'}" class="account-form" novalidate aria-describedby="account-message"><p class="account-hint" data-i18n="account.required">${escapeHTML(t('account.required'))}</p><div class="account-grid">`+
      ((isCreate||isProfile)?field('firstName','field.firstName','text',true,'given-name')+field('lastName','field.lastName','text',true,'family-name'):'')+
      (!isProfile?field('email','field.email','email',true,'username')+field('password','field.password','password',true,isCreate?'new-password':'current-password'):'')+
      (isCreate?`<p class="account-wide account-hint" data-i18n="field.passwordHelp">${escapeHTML(t('field.passwordHelp'))}</p>`:'')+
      ((isCreate||isProfile)?preferencesFields():'')+
      `</div><div class="account-actions"><button type="submit" class="pill form-submit" data-i18n="${isProfile?'account.save':isCreate?'account.create':'account.login'}">${escapeHTML(t(isProfile?'account.save':isCreate?'account.create':'account.login'))}</button>${isProfile?`<button type="button" class="account-link" data-logout data-i18n="account.logout">${escapeHTML(t('account.logout'))}</button>`:''}</div><p id="account-message" class="account-message" role="status" aria-live="polite"></p></form>`;
    if(isProfile){fillProfile($('#profile-form'),user);renderProfileExtras(user);}
    if(store.error)message('account-message',store.error);else message('account-message',null);
    translateStatic(content);
  }
  function openAccount(view) {
    if(authBusy)return;
    if(!dialog.open)previousFocus=document.activeElement;
    renderAccount(view);
    if(!dialog.open)dialog.showModal();
    const input=$('input',dialog);if(input&&dialogView!=='profile')input.focus();else $('.account-close',dialog).focus();
  }
  function renderProfileExtras(user) {
    if(!$('#profile-summary'))return;
    $('#profile-greeting').textContent=t('account.greeting',{name:user.firstName});
    $('#profile-email').textContent=t('profile.emailNote',{email:user.email});
    const summary=$('#profile-summary');summary.replaceChildren();
    const optionText=value=>!value?t('option.noPreference'):dictionaries.EN['option.'+value]?t('option.'+value):value;
    for(const [key,value] of [
      ['field.age',user.preferences.age||t('option.private')],
      ['field.drink',optionText(user.preferences.drink)],
      ['field.food',optionText(user.preferences.food)],
      ['field.diet',user.preferences.diet.length?user.preferences.diet.map(optionText).join(', '):t('option.noPreference')],
      ['field.location',user.preferences.location?LOCATION:t('option.noPreference')],['field.time',optionText(user.preferences.time||'noPreference')],
      ['profile.marketing',t(user.preferences.marketing?'profile.optedIn':'profile.optedOut')]
    ]){const div=element('div');div.append(element('dt','',t(key)),element('dd','',value));summary.append(div);}
    const loyalty=$('#profile-loyalty');loyalty.replaceChildren();
    const count=user.stamps%7 || (user.stamps?7:0), stamps=element('div','account-stamps');
    stamps.setAttribute('role','img');stamps.setAttribute('aria-label',t('loyalty.progress',{count}));
    for(let i=0;i<7;i++)stamps.append(element('span',i<count?'filled':''));
    loyalty.append(stamps,element('p','font-bold',t('loyalty.total',{total:user.stamps,rewards:Math.floor(user.stamps/7)})),element('p','account-hint',t('loyalty.rule')));
    favoritesInto($('#profile-favorites'),user);
    const history=$('#profile-history');history.replaceChildren();
    if(!user.orders.length)history.append(element('p','',t('profile.emptyOrders')));
    user.orders.slice(0,10).forEach(order=>{
      const article=element('article','account-order');
      const date=new Intl.DateTimeFormat(localeCodes[language],{dateStyle:'medium'}).format(new Date(order.createdAt));
      article.append(element('h4','',t('order.summary',{number:order.number,date})),element('p','account-hint',t('order.demo')),element('p','',t('order.pickup',{time:order.pickupDate?pickupLabel({date:order.pickupDate,time:order.time}):order.time,location:order.location})));
      const list=element('ul');let total=0;
      order.items.forEach(item=>{total+=item.price*item.qty;if(productById[item.id])list.append(element('li','',`${item.qty} × ${productName(item.id)} · ${money(item.price*item.qty)}`));});
      article.append(list,element('p','font-bold',t('cart.total')+': '+money(total)),actionButton(t('personal.again'),'orderAgain',order.number));history.append(article);
    });
  }
  function value(form,name) { return $(`[name="${name}"]`,form)?.value?.trim()||''; }
  function invalid(form,name,key) {
    const input=$(`[name="${name}"]`,form);input?.setAttribute('aria-invalid','true');input?.setAttribute('aria-describedby','account-message');input?.focus();throw new Error(key);
  }
  function getPreferences(form) {
    const p={age:value(form,'age'),drink:value(form,'drink'),food:value(form,'food'),location:value(form,'location'),time:value(form,'time'),diet:$$('[name="diet"]',form).filter(e=>e.checked).map(e=>e.value),marketing:Boolean($('[name="marketing"]',form).checked)};
    p.drink=p.drink||'noPreference';p.food=p.food||'noPreference';p.time=p.time||'noPreference';
    if(!drinkOptions.includes(p.drink))invalid(form,'drink','account.invalidPreferences');
    if(!foodOptions.includes(p.food))invalid(form,'food','account.invalidPreferences');
    if(p.location&&p.location!=='laranjeiras')invalid(form,'location','account.invalidPreferences');
    if(!timeOptions.includes(p.time))invalid(form,'time','account.invalidPreferences');
    if(!ages.includes(p.age)||p.diet.some(v=>!dietOptions.includes(v)))throw new Error('account.invalidPreferences');
    return p;
  }
  function getNames(form) {
    const firstName=value(form,'firstName'),lastName=value(form,'lastName');
    if(!firstName||firstName.length>60)invalid(form,'firstName','account.invalidName');
    if(!lastName||lastName.length>60)invalid(form,'lastName','account.invalidName');
    return {firstName,lastName};
  }
  function getEmail(form) {
    const email=value(form,'email').toLowerCase();
    if(email.length>254||!/^\S+@[^\s@]+\.[^\s@]+$/.test(email))invalid(form,'email','newsletter.error');
    return email;
  }
  function afterAuthentication(key) {
    if(pendingFavorite){
      const id=pendingFavorite;pendingFavorite=null;
      try{saveUser(user=>{if(!user.favorites.includes(id))user.favorites.push(id);});}catch(e){notice(e.message);}
    }
    renderAccount('profile');renderAccountSurfaces();
    message('account-message',key,{name:store.user.firstName});
    $('#account-title').setAttribute('tabindex','-1');$('#account-title').focus();
  }
  async function submitAccount(form) {
    if(authBusy)return;
    message('account-message',null);$$('[aria-invalid]',form).forEach(e=>e.removeAttribute('aria-invalid'));
    const submit=$('[type="submit"]',form);const oldKey=submit.getAttribute('data-i18n');
    try{
      const missing=$$('[required]',form).filter(input=>!input.value.trim());
      if(missing.length){missing.forEach(input=>{input.setAttribute('aria-invalid','true');input.setAttribute('aria-describedby','account-message');});missing[0].focus();throw new Error('account.requiredFields');}
      if(form.id==='profile-form'){
        const names=getNames(form),preferences=getPreferences(form);
        saveUser(user=>{Object.assign(user,names);user.preferences=preferences;});
        renderAccountSurfaces();message('account-message','account.saved');return;
      }
      const email=getEmail(form),password=$('[name="password"]',form).value;
      let names,preferences;
      if(form.id==='create-account-form'){
        names=getNames(form);preferences=getPreferences(form);
        if(password.length<8||password.length>128)invalid(form,'password','account.invalidPassword');
      }
      authBusy=true;submit.disabled=true;submit.setAttribute('data-i18n','account.busy');submit.textContent=t('account.busy');
      if(form.id==='create-account-form'){
        if(store.read().accounts.some(a=>a.email===email))throw new Error('account.duplicate');
        const salt=store.salt(),passwordHash=await store.hash(password,salt);
        const account={id:store.salt(),email,...names,salt,passwordHash,preferences,favorites:[],orders:[],stamps:0};
        store.commit(s=>{if(s.accounts.some(a=>a.email===email))throw new Error('account.duplicate');s.accounts.push(account);s.sessionId=account.id;});
        $('[name="password"]',form).value='';afterAuthentication('account.created');
      } else {
        const account=store.read().accounts.find(a=>a.email===email);
        if(!account||password.length>128||await store.hash(password,account.salt)!==account.passwordHash)throw new Error('account.credentials');
        store.commit(s=>{if(!s.accounts.some(a=>a.id===account.id))throw new Error('account.credentials');s.sessionId=account.id;});
        $('[name="password"]',form).value='';afterAuthentication('account.loggedIn');
      }
    }catch(e){errorMessage(e);}
    finally{authBusy=false;submit.disabled=false;submit.setAttribute('data-i18n',oldKey);submit.textContent=t(oldKey);}
  }
  function logout() {
    if(authBusy)return;
    try{store.commit(s=>s.sessionId=null);}catch(e){errorMessage(e,dialog.open?'account-message':'site-notice');return;}
    pendingFavorite=null;cart.clear();updateCart();
    message('payment-feedback',null);message('suggestion-feedback',null);
    if(dialog.open)dialog.close();dialogView=null;
    $('#account-content').replaceChildren();renderAccountSurfaces();notice('account.loggedOut');
  }
  // Mobile-only disclosures use the existing navigation targets and account flows.
  const mobileHeader=$('.mobile-header');
  function closeMobilePanels(returnFocus=false) {
    for(const kind of ['nav','account']){
      const toggle=$('#mobile-'+kind+'-toggle'),panel=$('#mobile-'+kind+'-panel');
      const wasOpen=!panel.hidden;panel.hidden=true;toggle.setAttribute('aria-expanded','false');
      if(returnFocus&&wasOpen)toggle.focus();
    }
  }
  function toggleMobilePanel(kind) {
    const panel=$('#mobile-'+kind+'-panel'),opening=panel.hidden;
    closeMobilePanels();
    if(opening){panel.hidden=false;$('#mobile-'+kind+'-toggle').setAttribute('aria-expanded','true');$('a,button',panel)?.focus();}
  }
  document.addEventListener('click',e=>{
    if(!mobileHeader.contains(e.target))closeMobilePanels();
    const link=e.target.closest('.mobile-header a[href^="#"]');
    if(link){
      closeMobilePanels();
      // Let the anchor perform its normal hash/scroll navigation; move keyboard focus
      // to the destination instead of leaving it inside the now-hidden disclosure.
      const target=document.getElementById(link.getAttribute('href').slice(1));
      if(target){target.setAttribute('tabindex','-1');target.focus({preventScroll:true});}
    }
  });
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape'&&(!$('#mobile-nav-panel').hidden||!$('#mobile-account-panel').hidden)){
      e.preventDefault();closeMobilePanels(true);
    }
  });
  document.addEventListener('focusin',e=>{if(!mobileHeader.contains(e.target))closeMobilePanels();});
  window.addEventListener('resize',()=>{if(window.innerWidth>=768)closeMobilePanels();});
  document.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.id==='mobile-nav-toggle'){toggleMobilePanel('nav');return;}
    if(b.id==='mobile-account-toggle'){toggleMobilePanel('account');return;}
    if(b.dataset.lang){setLanguage(b.dataset.lang);return;}
    if(b.dataset.openAccount){const mobile=mobileHeader.contains(b);closeMobilePanels();openAccount(b.dataset.openAccount);if(mobile)previousFocus=$('#mobile-account-toggle');return;}
    if(b.hasAttribute('data-close-account')){if(!authBusy)dialog.close();return;}
    if(b.hasAttribute('data-logout')){const mobile=mobileHeader.contains(b);closeMobilePanels();logout();if(mobile)$('#mobile-account-toggle').focus();return;}
    if(b.dataset.favorite){toggleFavorite(b.dataset.favorite);return;}
    if(b.dataset.favoriteAdd){addProduct(b.dataset.favoriteAdd);if(dialog.open)message('account-message','cart.added',{productId:b.dataset.favoriteAdd});return;}
    if(b.dataset.orderAgain){orderAgain(b.dataset.orderAgain);return;}
    if(b.matches('.add-product,.suggestion')){addProduct(b.dataset.productId);return;}
    if(b.matches('.qty')){const qty=(cart.get(b.dataset.id)||0)+Number(b.dataset.change);qty>0?cart.set(b.dataset.id,qty):cart.delete(b.dataset.id);updateCart();return;}
    if(b.dataset.removeProduct){cart.delete(b.dataset.removeProduct);updateCart();return;}
    if(b.matches('.tab')){filterMenu(b.dataset.category);return;}
    if(b.id==='usual-button'){
      if(store.user?.orders.length)orderAgain(store.user.orders[0].number);
      else{addProduct('cappuccino');addProduct('nata');message('suggestion-feedback','cart.usual');}return;
    }
    if(b.id==='pay-button'){openPayment();return;}
    if(b.id==='slot-toggle'){toggleSlotOptions($('#slot-options').hidden);return;}
    if(b.dataset.quickSlot){selectSlot(b.dataset.quickSlot);toggleSlotOptions(false);return;}
    if(b.hasAttribute('data-close-payment')){paymentDialog.close();return;}
    if(b.dataset.paymentMethod){paymentMethod=b.dataset.paymentMethod;renderPaymentFields();syncPayment();return;}
    if(b.hasAttribute('data-fill-demo')){fillDemoPayment();return;}
    if(b.matches('.vote-button')){
      $$('.vote-button').forEach(el=>el.classList.remove('bg-[#FF5A36]'));b.classList.add('bg-[#FF5A36]');
      message('vote-feedback','vote.saved',{specialId:b.dataset.vote});return;
    }
    if(b.id==='coffee-break-button'){b.disabled=true;b.classList.add('opacity-60');message('coffee-feedback','coffee.saved');return;}
    if(b.matches('.faq-item > button')){
      const opened=b.parentElement.classList.toggle('open');b.setAttribute('aria-expanded',String(opened));
    }
  });
  document.addEventListener('change',e=>{if(e.target.id==='pickup-time-select'){selectSlot(e.target.value);toggleSlotOptions(false);$('#slot-toggle').focus();}});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#slot-options').hidden){toggleSlotOptions(false);$('#slot-toggle').focus();}});
  document.addEventListener('input',e=>{if(e.target.matches('[aria-invalid]')&&e.target.value.trim())e.target.removeAttribute('aria-invalid');});
  document.addEventListener('submit',e=>{
    if(e.target.id==='demo-payment-form'){e.preventDefault();submitPayment();}
    if(['login-form','create-account-form','profile-form'].includes(e.target.id)){e.preventDefault();submitAccount(e.target);}
    if(e.target.id==='newsletter-form'){
      e.preventDefault();const email=$('#newsletter-email').value.trim().toLowerCase();
      if(!/^\S+@[^\s@]+\.[^\s@]+$/.test(email)){message('newsletter-feedback','newsletter.error');return;}
      if(store.user && store.user.email===email){
        try{saveUser(user=>user.preferences.marketing=true);}catch(error){errorMessage(error,'newsletter-feedback');return;}
        renderAccountSurfaces();
      }
      message('newsletter-feedback','newsletter.saved');e.target.reset();
    }
  });
  dialog.addEventListener('cancel',e=>{if(authBusy)e.preventDefault();});
  dialog.addEventListener('close',()=>{
    dialogView=null;pendingFavorite=null;messages.delete('account-message');
    $$('input[type="password"]',dialog).forEach(input=>input.value='');
    const returnFocus=previousFocus?.isConnected?previousFocus:$('[data-open-account]');
    returnFocus?.focus();
  });
  window.addEventListener('storage',e=>{
    if(e.key!==store.KEY && e.key!==null)return;
    const previousId=store.user?.id;store.refresh();
    if(store.error){notice(store.error);return;}
    if(previousId!==store.user?.id){if(paymentDialog.open)paymentDialog.close();cart.clear();if(dialog.open)renderAccount(store.user?'profile':'login');}
    setLanguage(store.state.language,false);
  });
  setLanguage(language,false);
  if(store.error)notice(store.error);
  function refreshPickupClock(){
    if(!refreshSlots()&&paymentDialog.open&&!paymentOrder)message('checkout-message',selectedPickup?'payment.slotChanged':'pickup.none');
  }
  window.addEventListener('focus',refreshPickupClock);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshPickupClock();});
  function pickupTick(){refreshPickupClock();setTimeout(pickupTick,30000);}
  setTimeout(pickupTick,30000);
})();
