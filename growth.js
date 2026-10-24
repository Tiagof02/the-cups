/* Marketing features layered onto the existing catalog, account and checkout.
   No password, account record, payment field or order history is sent to chat. */
(() => {
  'use strict';
  const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
  const config=window.CupsConfig, KEY='thecups.visitor.v1', SESSION='thecups.visit.v1';
  const t=(key,params)=>window.CupsApp?.t(key,params)||window.CupsTranslations.EN[key]||key;
  const money=n=>window.CupsApp?.money(n)||'€'+n.toFixed(2);
  const user=()=>window.CupsStore.user;
  const now=()=>new Date().getTime();
  let ready=false, visitKind=null, visitFocus=null, chatFocus=null, chatBusy=false;
  let returning=false, autoAttempted=false, cartVisible=false, timer=null;
  let history=[], chatController=null, generation=0, volatileSession={}, volatileVisitor={};
  const safeRead=(storage,key,fallback)=>{try{const v=JSON.parse(storage.getItem(key)||'{}');return v&&typeof v==='object'&&!Array.isArray(v)?v:fallback;}catch{return fallback;}};
  const visitor=()=>safeRead(localStorage,KEY,volatileVisitor);
  function session(){try{return safeRead(sessionStorage,SESSION,volatileSession);}catch{return volatileSession;}}
  function saveSession(patch){volatileSession={...session(),...patch};try{sessionStorage.setItem(SESSION,JSON.stringify(volatileSession));}catch{}}
  function saveVisitor(patch,required=false){const previous=visitor(),next={...previous,...patch};try{localStorage.setItem(KEY,JSON.stringify(next));volatileVisitor=next;return true;}catch{volatileVisitor=(required||patch.claimed)?previous:next;if(required)throw new Error('account.storageError');return false;}}
  function eligible(){const v=visitor();return config.firstNataEnabled&&!v.completed&&!v.redeemed&&!user()?.orders.length&&!window.CupsStore.error;}
  function claimed(){return eligible()&&visitor().claimed===true;}
  function quote(cart){
    const subtotalCents=Array.from(cart,([id,qty])=>Math.round(window.CupsProducts.find(p=>p.id===id).price*100)*qty).reduce((a,b)=>a+b,0);
    const discountCents=claimed()&&(cart.get('nata')||0)>0?Math.round(window.CupsProducts.find(p=>p.id==='nata').price*100):0;
    return {subtotal:subtotalCents/100,discount:discountCents/100,total:(subtotalCents-discountCents)/100};
  }
  function renderOffer(q){
    $('#nata-discount-row').hidden=!q.discount;$('#nata-discount').textContent='−'+money(q.discount);
    $('#nata-cart-note').hidden=!claimed();$('#nata-cart-note').textContent=t(q.discount?'growth.applied':'growth.addNata');
    $('#nata-offer-button').hidden=!eligible()||claimed();
  }
  function beforeComplete(order){
    // A guest redemption must be saved before showing a successful discounted order.
    if(!user())saveVisitor({completed:true,redeemed:!!order.discount||!!visitor().redeemed},!!order.discount);
  }
  function orderCompleted(order){saveVisitor({completed:true,redeemed:!!order.discount||!!visitor().redeemed,claimed:false});}
  function httpURL(value,host){try{const u=new URL(value);return u.protocol==='https:'&&(!host||host(u.hostname))?u.href:null;}catch{return null;}}
  function isGoogle(host){return /(^|\.)(google\.com|google\.pt|google\.de|goo\.gl|maps\.app\.goo\.gl)$/.test(host);}
  function renderReviews(){
    const reviews=(config.reviews||[]).filter(r=>r.verifiedAt&&r.name&&r.text&&httpURL(r.sourceUrl));
    const box=$('#verified-reviews');box.replaceChildren();box.hidden=!reviews.length;
    for(const r of reviews.slice(0,3)){
      const card=document.createElement('figure');card.className='review-card';
      if(Number.isInteger(r.rating)&&r.rating>=1&&r.rating<=5){const stars=document.createElement('p');stars.textContent='★'.repeat(r.rating)+'☆'.repeat(5-r.rating);stars.setAttribute('aria-label',r.rating+' / 5');card.append(stars);}
      const text=document.createElement('blockquote'),lang=window.CupsApp.language,translation=r.translations?.[lang];
      text.textContent=translation||r.text;if(!translation&&r.language)text.lang=r.language;
      const name=document.createElement('figcaption');name.textContent=r.name;
      const link=document.createElement('a');link.className='account-link';link.href=httpURL(r.sourceUrl);link.target='_blank';link.rel='noopener noreferrer';link.textContent=t('growth.reviewSource');
      card.append(text,name,link);
      if(translation){const note=document.createElement('small');note.textContent=t('growth.reviewTranslation');card.append(note);}
      box.append(card);
    }
    $('#reviews-title').textContent=t('growth.testimonialsTitle');
    $('#reviews-empty').hidden=!!reviews.length;
    $('#reviews-intro').textContent=t('growth.reviewsLead');
    const url=httpURL(config.googleReviewsUrl,isGoogle),link=$('#google-reviews-link');link.hidden=!url;
    if(url)link.href=url;else link.removeAttribute('href');
  }
  function renderCommunity(){
    const url=httpURL(config.whatsappCommunityUrl,h=>h==='chat.whatsapp.com');
    const link=$('#community-join');link.hidden=!url;$('#community-coming').hidden=!!url;
    if(url)link.href=url;else link.removeAttribute('href');
  }
  function renderVisit(){
    if(!visitKind)return;
    const u=user(),hasOrder=!!u?.orders.length,hasFavorites=!!u?.favorites.length;
    $('#visit-title').textContent=visitKind==='nata'?t('growth.nataTitle'):u?t('growth.welcomeName',{name:u.firstName}):t('growth.welcomeTitle');
    $('#visit-copy').textContent=t(visitKind==='nata'?'growth.nataCopy':hasOrder?'growth.welcomeCopy':'growth.welcomeGuest');
    $('#visit-terms').textContent=visitKind==='nata'?t('growth.nataTerms'):'';
    $('#visit-action').textContent=t(visitKind==='nata'?'growth.claim':hasOrder?'personal.again':hasFavorites?'growth.favorites':'growth.browse');
    const art=$('#visit-art');art.replaceChildren();art.hidden=visitKind!=='nata';
    if(visitKind==='nata'){
      const original=$('[data-product-id="nata"] .food-visual');
      if(original){const visual=original.cloneNode(true);visual.querySelectorAll('button').forEach(b=>b.remove());art.append(visual);}
    }
  }
  function blocked(){return !!document.activeElement?.matches?.('input,textarea,select,[contenteditable="true"]')||!!$('dialog[open]')||!$('#mobile-nav-panel').hidden||!$('#mobile-account-panel').hidden||document.hidden||cartVisible;}
  function showVisit(kind,manual=false){
    if((!manual&&blocked())||$('dialog[open]'))return false;
    if(kind==='nata'&&!eligible())return false;
    visitKind=kind;visitFocus=document.activeElement;$('#visit-feedback').textContent='';renderVisit();
    saveSession({popupShown:true});if(kind==='welcome')saveVisitor({welcomeAt:now()});
    $('#visit-dialog').showModal();$('[data-close-visit]').focus();updateLauncher();return true;
  }
  function closeVisit(dismissed=true){
    if(dismissed&&visitKind==='nata')saveVisitor({dismissedUntil:now()+config.offerDismissalMs});
    $('#visit-dialog').close();
  }
  function tryAutomatic(){
    if(autoAttempted||session().popupShown)return;
    if(blocked()){timer=setTimeout(tryAutomatic,3000);return;}
    autoAttempted=true;
    const v=visitor();
    if(returning){if(!v.welcomeAt||now()-v.welcomeAt>=config.welcomeCooldownMs)showVisit('welcome');}
    else if(eligible()&&!claimed()&&(!v.dismissedUntil||v.dismissedUntil<=now()))showVisit('nata');
  }
  function accountChanged(){
    if(!ready)return;
    if($('#visit-dialog').open){if(visitKind==='nata'&&!eligible())closeVisit(false);else renderVisit();}
    renderOffer(quote(window.CupsApp.cart));
  }
  const extra={
    ES:{unknown:'Puedo ayudar con preguntas frecuentes del café en español, inglés, portugués, alemán y francés. Para otras dudas, contacta con el café.',ingredients:'No tenemos una lista verificada de ingredientes o alérgenos. Confirma con el café antes de pedir si tienes alguna alergia o necesidad alimentaria.',custom:'El menú indica espresso simple/doble y opción de avena para el cappuccino. Esta demo no permite configurar productos; consulta cambios y suplementos con el café.',order:'Elige productos, una hora de recogida de hoy y un pago simulado. Recoge en Rua das Laranjeiras 47C con tu número de pedido. Este prototipo universitario no envía pedidos reales.',payment:'MB WAY, Visa/Mastercard, Apple Pay y Google Pay son simulados. No se cobra dinero. Usa solo los datos de prueba indicados.',account:'Puedes pedir como invitado. La cuenta demo guarda favoritos, pedidos y sellos solo en este navegador.',loyalty:'Un sello por pedido demo completado con bebida. El prototipo muestra una recompensa a los siete sellos, sin canje real.',promo:'Oferta limitada a los primeros 50 clientes que cumplan los requisitos. Oferta demo: un pastel de nata en tu primer pedido online. Reclama la oferta y añade un nata al carrito; su precio se descuenta antes del pago. No se necesita cuenta ni suscripción.',hours:'Rua das Laranjeiras 47C, Lisboa. Lunes–viernes 08:00–00:30; sábado–domingo 08:30–00:30. Metro: Laranjeiras.',pickup:'Recogida solo hoy, cada 15 minutos y con al menos 15 minutos de preparación. Hora de Lisboa. Próxima hora: {time}. Disponibilidad demo.',none:'no quedan horarios hoy'},
    FR:{unknown:'Je peux répondre aux questions fréquentes du café en français, anglais, portugais, allemand et espagnol. Contacte le café pour les autres questions.',ingredients:'Nous ne disposons pas de liste vérifiée des ingrédients ou allergènes. Vérifie auprès du café avant de commander en cas d’allergie ou de besoin alimentaire particulier.',custom:'Le menu indique espresso simple/double et option avoine pour le cappuccino. Cette démo ne permet pas de personnaliser les produits ; vérifie les options et suppléments auprès du café.',order:'Choisis des produits, un créneau aujourd’hui et un paiement simulé. Retire ta commande au Rua das Laranjeiras 47C avec son numéro. Ce prototype universitaire n’envoie aucune vraie commande.',payment:'MB WAY, Visa/Mastercard, Apple Pay et Google Pay sont simulés. Aucun débit. Utilise uniquement les données de test affichées.',account:'Tu peux commander sans compte. Le compte démo conserve favoris, commandes et tampons uniquement dans ce navigateur.',loyalty:'Un tampon par commande démo terminée avec une boisson. Le prototype affiche une récompense après sept tampons, sans échange réel.',promo:'Offre limitée aux 50 premiers clients éligibles. Offre démo : un pastel de nata pour ta première commande en ligne. Active l’offre et ajoute un nata au panier ; son prix est déduit avant le paiement. Aucun compte ni abonnement requis.',hours:'Rua das Laranjeiras 47C, Lisboa. Lundi–vendredi 08:00–00:30 ; samedi–dimanche 08:30–00:30. Métro : Laranjeiras.',pickup:'Retrait uniquement aujourd’hui, toutes les 15 minutes avec au moins 15 minutes de préparation. Heure de Lisbonne. Prochain créneau : {time}. Disponibilité démo.',none:'aucun créneau restant aujourd’hui'}
  };
  function detectLanguage(text){
    const value=normalize(text), scores={};
    const signals={
      EN:/\b(hello|hi|thanks|what|how|where|when|prices?|pickup|english|allergens?|hours|open|closed|pay|order|loyalty|rewards?|ingredients?|milk|coffee|please)\b/g,
      PT:/\b(ola|obrigad[oa]|quais|qual|quanto|custa|onde|horarios?|horas|recolha|portugues|alergenios?|como|encomendar|encomenda|pagamento|pagar|precos?|leite|fidelizacao|carimbos?|abrem|fecham|aberto|localizacao|recompensas?|morada|tenho|posso)\b/g,
      DE:/\b(hallo|danke|wie|wieviel|was|wo|wann|preise?|kostet|kosten|offnungszeiten|abholung|deutsch|allergene|bestellen|bestellung|bezahlen|zahlen|zahlung|speisekarte|getranke|zutaten|milch|kaffee|treuepunkte|geoffnet|geschlossen|uhr|ich|kann)\b/g,
      ES:/\b(hola|gracias|cuanto|cuesta|cuales|donde|horario|pago|recogida|espanol|alergenos|como|pedido|pedir|precios?|leche|recompensas|sellos|abren|cierran|direccion|puedo|quisiera|teneis)\b/g,
      FR:/\b(bonjour|salut|merci|quel|quelle|quels|quelles|combien|horaires?|commande|commander|paiements?|francais|allergenes|comment|ou|prix|lait|recompenses|fidelite|ouvert|fermez|ouvrez|heure|est|je|peux)\b/g
    };
    for(const [lang,pattern] of Object.entries(signals))scores[lang]=(value.match(pattern)||[]).length;
    const best=Math.max(...Object.values(scores)),fallback=window.CupsApp.language;
    if(!best||scores[fallback]===best)return fallback;
    return Object.keys(scores).find(lang=>scores[lang]===best)||fallback;
  }
  function replyLanguage(question,topic){
    const selected=$('#chat-language').value;
    return ['EN','PT','DE','ES','FR'].includes(selected)?selected:topic?window.CupsApp.language:detectLanguage(question);
  }
  const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  function classify(question){
    const s=normalize(question);
    if(/zutaten|allerg|alerg|ingredient|ingredien|gluten|vegan|lactos|nut.free|nuts|nuss|noix|erdnuss/.test(s))return 'ingredients';
    if(/custom|milk|leite|milch|lait|leche|oat|aveia|hafer|sugar|acucar|zucker|extra shot|personaliz|anpass/.test(s))return 'custom';
    if(/promo|offer|oferta|gratis|free nata|first.*nata|primeir.*nata|erst.*nata|nata.*gratis|premier.*nata|first.order|primeir.*encomenda|angebot|rabatt/.test(s))return 'promo';
    if(/recompens|punkte|loyal|reward|stamp|fidel|carimbo|sello|treue|stempel|recompensa|tampon/.test(s))return 'loyalty';
    if(/account|login|conta|konto|compte|cuenta|password|senha|palavra.passe|guest/.test(s))return 'account';
    if(/pay|paiement|paga|pago|zahlung|zahlen|bezahlen|payer|card|cartao|karte|mb.?way|visa/.test(s))return 'payment';
    if(/pickup|pick.up|recolh|recogida|abhol|creneau|retrait|slot|tomorrow|amanha|morgen/.test(s))return 'pickup';
    if(/abrem|fecham|abren|cierran|horas|heures?|ouvre|ferme|geoffnet|geschlossen|uhr|hours|open|close|location|address|where|onde|local|morada|direccion|horario|offnungs|adresse|wann|\bwo\b|horaires|donde|ou est/.test(s))return 'hours';
    if(/order|encomenda|bestell|pedido|pedir|commande|funciona/.test(s))return 'order';
    if(/speisekarte|getranke|kaffee|coffee|cafe|menu|price|preco|preis|prix|precio|cost|kostet|kosten|cuesta|custa|combien|quanto|cuanto/.test(s)||window.CupsProducts.some(p=>s.includes(normalize(p.id))))return 'menu';
    if(/^(hi|hello|ola|hallo|hola|bonjour|salut|thanks|thank you|obrigad[oa]|danke|gracias|merci)[!.? ]*$/.test(s))return 'greeting';
    return 'unknown';
  }
  const menuNames={
    ES:{espresso:'café espresso',cappuccino:'cappuccino',galao:'galão',iced:'café helado',green:'zumo natural «Ultimate Green»',tonic:'orange tonic',croissant:'croissant',nata:'pastel de nata',tosta:'tosta mista',club:'sándwich club',acai:'bol de açaí',breakfast:'combo desayuno: café + bollería',lunch:'combo almuerzo: sándwich + bebida'},
    FR:{espresso:'espresso',cappuccino:'cappuccino',galao:'galão',iced:'café glacé',green:'jus frais «Ultimate Green»',tonic:'orange tonic',croissant:'croissant',nata:'pastel de nata',tosta:'tosta mista',club:'club sandwich',acai:'bol d’açaí',breakfast:'formule petit-déjeuner : café + viennoiserie',lunch:'formule déjeuner : sandwich + boisson'}
  };
  function answer(question,topic,forcedLanguage){
    const lang=forcedLanguage||detectLanguage(question),kind=topic||classify(question),d=window.CupsTranslations[lang]||window.CupsTranslations.EN;
    const tx=key=>d[key]||window.CupsTranslations.EN[key];
    if(kind==='greeting')return lang==='ES'?'¡Hola! ¿En qué puedo ayudarte?':lang==='FR'?'Bonjour ! Comment puis-je t’aider ?':tx('growth.chatGreetingShort');
    if(kind==='menu'){
      const requested=window.CupsProducts.filter(p=>normalize(question).includes(normalize(p.id))||normalize(question).includes(normalize(tx(p.nameKey))));
      return (requested.length?requested:window.CupsProducts).map(p=>`${menuNames[lang]?.[p.id]||tx(p.nameKey)} · ${new Intl.NumberFormat({PT:'pt-PT',DE:'de-DE',ES:'es-ES',FR:'fr-FR'}[lang]||'en-GB',{style:'currency',currency:'EUR'}).format(p.price)}`).join('\n');
    }
    const next=window.CupsPickup.available()[0]?.time||(extra[lang]?.none||tx('pickup.none'));
    if(extra[lang])return (kind==='promo'&&!config.firstNataEnabled?(lang==='ES'?'No hay ofertas activas en esta demo.':'Aucune offre active dans cette démo.'):(extra[lang][kind]||extra[lang].unknown)).replace('{time}',next);
    if(kind==='hours')return `Rua das Laranjeiras 47C, Lisboa. ${tx('find.week')} · ${tx('find.weekend')}. ${tx('find.metro')}.`;
    if(kind==='promo')return config.firstNataEnabled?tx('growth.nataTerms'):tx('growth.noPromo');
    return tx('growth.chat'+({unknown:'Unknown',ingredients:'Ingredients',custom:'Custom',order:'Order',payment:'Payment',account:'Account',loyalty:'Loyalty',pickup:'Pickup'}[kind]||'Unknown')).replace('{time}',next);
  }
  const endpoint=()=>httpURL(config.chatEndpoint);
  function addBubble(role,text){const b=document.createElement('p');b.className='chat-bubble '+role;b.textContent=text;$('#chat-log').append(b);$('#chat-log').scrollTop=$('#chat-log').scrollHeight;return b;}
  function renderChat(){
    $('#chat-scope').textContent=t('growth.chatScope');
    $('#chat-mode').textContent=t(endpoint()?'growth.chatLive':'growth.chatMode');
    $('.chat-privacy').textContent=t(endpoint()?'growth.chatExternal':'growth.chatPrivacy');
    const suggestions=$('#chat-suggestions');suggestions.replaceChildren();
    for(const [topic,key] of [['menu','Menu'],['pickup','Pickup'],['hours','Hours'],['promo','Promo']]){
      const b=document.createElement('button');b.type='button';b.dataset.chatTopic=topic;b.textContent=t('growth.topic'+key);b.disabled=chatBusy;suggestions.append(b);
    }
    if(!history.length){$('#chat-log').replaceChildren();addBubble('assistant',t('growth.chatGreeting'));}
    $('#chat-status').textContent=chatBusy?t('growth.typing'):'';
  }
  function publicKnowledge(){
    // Explicit allowlist. Never serialize CupsStore, form values or the page DOM.
    return {business:"The Cup's",location:'Rua das Laranjeiras 47C, Lisboa',hours:{weekdays:'08:00–00:30',weekends:'08:30–00:30'},
      menu:window.CupsProducts.map(p=>({id:p.id,name:window.CupsTranslations.EN[p.nameKey],price:p.price,currency:'EUR'})),
      pickup:{sameDayOnly:true,timeZone:'Europe/Lisbon',intervalMinutes:15,preparationMinutes:15,next:window.CupsPickup.available()[0]?.time||null},
      payments:['MB WAY','Visa/Mastercard','Apple Pay','Google Pay'],demoOnly:true,allergens:'Not verified; ask café',
      promotions:config.firstNataEnabled?[window.CupsTranslations.EN['growth.nataTerms']]:[],loyalty:window.CupsTranslations.EN['growth.chatLoyalty']};
  }
  async function sendChat(question,topic){
    question=question.trim().slice(0,500);if(!question||chatBusy)return;
    const run=++generation;chatBusy=true;$('#chat-input').value='';$('#chat-send').disabled=true;
    addBubble('user',question);history.push({role:'user',content:question});renderChat();
    const lang=replyLanguage(question,topic);let reply;
    try{
      if(endpoint()){
        chatController=new AbortController();const timeout=setTimeout(()=>chatController?.abort(),10000);
        try{
          const response=await fetch(endpoint(),{method:'POST',headers:{'Content-Type':'application/json'},credentials:'omit',signal:chatController.signal,
            body:JSON.stringify({message:question,language:$('#chat-language').value==='auto'&&!topic?'auto':lang,history:history.slice(-8),knowledge:publicKnowledge()})});
          if(!response.ok)throw new Error('Unavailable');
          const body=await response.json();if(typeof body.reply!=='string'||!body.reply.trim()||body.reply.length>5000)throw new Error('Invalid reply');reply=body.reply;
        }finally{clearTimeout(timeout);}
      }else{await new Promise(r=>setTimeout(r,180));reply=answer(question,topic,lang);}
    }catch{reply=t('growth.fallback')+'\n'+answer(question,topic,lang);}
    if(run!==generation)return;
    addBubble('assistant',reply);history.push({role:'assistant',content:reply});history=history.slice(-12);
    chatBusy=false;chatController=null;$('#chat-send').disabled=false;renderChat();$('#chat-input').focus();
  }
  function openChat(){
    if($('dialog[open]'))return;
    chatFocus=document.activeElement;$('#chat-dialog').showModal();renderChat();$('#chat-input').focus();updateLauncher();
  }
  function updateLauncher(){
    if(!ready)return;
    $('#chat-launcher').hidden=!!$('dialog[open]')||cartVisible||!$('#mobile-nav-panel').hidden||!$('#mobile-account-panel').hidden;
  }
  function refresh(){if(!window.CupsApp)return;$$('[data-section-label]').forEach((el,i)=>{el.textContent=String(i+1).padStart(2,'0')+' / '+t(el.getAttribute('data-i18n')).replace(/^\d+\s*\/\s*/,'');});renderReviews();renderCommunity();renderVisit();renderChat();updateLauncher();}
  function init(){
    ready=true;const v=visitor(),ss=session(),stamp=now();
    returning=!!v.lastSeen&&stamp-v.lastSeen>=config.returnVisitGapMs;
    if(returning)saveSession({popupShown:false});
    else if(ss.startedAt)returning=!!ss.returning;
    saveSession({startedAt:ss.startedAt||stamp,returning});saveVisitor({lastSeen:stamp});
    // Keep an active visit distinct from a return; reloads/section jumps do not qualify.
    for(const event of ['pagehide','beforeunload'])window.addEventListener(event,()=>saveVisitor({lastSeen:now()}));
    document.addEventListener('visibilitychange',()=>{if(document.hidden)saveVisitor({lastSeen:now()});});
    window.addEventListener('storage',()=>{window.CupsApp.updateCart();window.CupsApp.syncPayment();accountChanged();});
    const visit=$('#visit-dialog');
    visit.addEventListener('cancel',()=>{if(visitKind==='nata')saveVisitor({dismissedUntil:now()+config.offerDismissalMs});});
    visit.addEventListener('close',()=>{visitKind=null;visitFocus?.focus?.();updateLauncher();});
    const chat=$('#chat-dialog');
    chat.addEventListener('close',()=>{generation++;chatController?.abort();chatBusy=false;$('#chat-send').disabled=false;renderChat();chatFocus?.focus?.();updateLauncher();});
    document.addEventListener('click',e=>{
      const b=e.target.closest('button');
      if(b?.matches('[data-growth-offer]'))showVisit('nata',true);
      if(b?.matches('[data-close-visit]'))closeVisit();
      if(b?.id==='visit-action'){
        if(visitKind==='nata'){
          if(!eligible()){$('#visit-feedback').textContent=t('growth.ineligible');return;}
          if(!saveVisitor({claimed:true})){$('#visit-feedback').textContent=t('account.storageError');return;}
          closeVisit(false);window.CupsApp.filterMenu('quick');window.CupsApp.updateCart();
          $('#menu').scrollIntoView({behavior:'smooth'});$('.add-product[data-product-id="nata"]').focus({preventScroll:true});
        }else{
          const u=user();closeVisit(false);
          if(u?.orders.length)window.CupsApp.orderAgain(u.orders[0].number);
          else{window.CupsApp.filterMenu('quick');$('#menu').scrollIntoView({behavior:'smooth'});const target=u?.favorites.length?$('#personal-favorites'):$('#menu');target.setAttribute('tabindex','-1');target.focus({preventScroll:true});}
        }
      }
      if(b?.id==='chat-launcher'||b?.matches('[data-open-chat]'))openChat();
      if(b?.id==='chat-close')chat.close();
      if(b?.dataset.chatTopic)sendChat(b.textContent,b.dataset.chatTopic);
      updateLauncher();
    });
    document.addEventListener('keydown',()=>setTimeout(updateLauncher,0));
    document.addEventListener('focusin',updateLauncher);
    $('#chat-form').addEventListener('submit',e=>{e.preventDefault();sendChat($('#chat-input').value);});
    if(window.IntersectionObserver)new window.IntersectionObserver(entries=>{cartVisible=entries[0].isIntersecting;updateLauncher();},{threshold:0}).observe($('#pickup aside'));
    if(window.MutationObserver)new window.MutationObserver(updateLauncher).observe(document.body,{subtree:true,attributes:true,attributeFilter:['open']});
    refresh();timer=setTimeout(tryAutomatic,config.popupDelayMs);
  }
  window.CupsGrowth={init,refresh,quote,renderOffer,beforeComplete,orderCompleted,accountChanged,answer,publicKnowledge};
})();
