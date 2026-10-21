const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const {webcrypto}=require('crypto');
const {parseHTML}=require('linkedom');
const root=require('path').join(__dirname,'..')+'/';const cache=new Map();let checks=0;
const storage={getItem:k=>cache.get(k)||null,setItem:(k,v)=>cache.set(k,String(v)),removeItem:k=>cache.delete(k)};
function boot(customStorage=storage,initialTime='2026-10-07T09:30:00Z',options={}){
 let nowISO=initialTime;const timers=[];const sessionCache=options.sessionCache||new Map();const sessionStorage={getItem:k=>sessionCache.get(k)||null,setItem:(k,v)=>sessionCache.set(k,v)};const schedule=(fn,ms)=>{if(ms>=1000){timers.push({fn,ms});return timers.length;}return setTimeout(fn,ms);};
 const{window,document}=parseHTML(fs.readFileSync(root+'index.html','utf8'));
 // DOM-only test adapter: browser-native dialog, focus, select and form methods.
 Object.defineProperty(window.HTMLSelectElement.prototype,'value',{configurable:true,get(){return Array.from(this.options).find(o=>o.selected)?.value??this.options[0]?.value??''},set(v){for(const o of this.options)o.removeAttribute('selected');const match=Array.from(this.options).find(o=>o.value===v);if(match)match.setAttribute('selected','');}});
 window.HTMLElement.prototype.focus=function(){document._focus=this};
 window.HTMLElement.prototype.scrollIntoView=function(){};
 for(const dialog of document.querySelectorAll('dialog')){
 dialog.showModal=function(){this.open=true;this.setAttribute('open','')};
 dialog.close=function(){this.open=false;this.removeAttribute('open');this.dispatchEvent(new window.Event('close'))};}
 document.querySelector('#newsletter-form').reset=function(){this.querySelector('input').value=''};
 const sandbox={window,document,localStorage:customStorage,sessionStorage,fetch:options.fetch||(()=>{throw new Error('Unexpected network')}),TextEncoder,Uint8Array,Map,URL,AbortController,Date:class extends Date {constructor(...args){super(...(args.length?args:[nowISO]))}},Math,Number,Object,JSON,Intl,console,setTimeout:schedule,clearTimeout};
 Object.defineProperty(window,'crypto',{value:webcrypto,configurable:true});
 vm.createContext(sandbox);
 for(const file of ['i18n.js','products.js','account-store.js','pickup-times.js','site-config.js','growth-i18n.js','growth.js','app.js']){vm.runInContext(fs.readFileSync(root+file,'utf8'),sandbox,{filename:file});if(file==='site-config.js')Object.assign(window.CupsConfig,options.config||{});}
 const q=s=>document.querySelector(s),qa=s=>Array.from(document.querySelectorAll(s));
 const click=s=>{const el=q(s);assert(el,s);el.click()};
 const val=(name,value)=>{q(`[name="${name}"]`).value=value};
 const submit=id=>q(id).dispatchEvent(new window.Event('submit',{bubbles:true,cancelable:true}));
 return{window,document,q,qa,click,val,submit,sandbox,timers,sessionCache,setNow:iso=>{nowISO=iso;window.dispatchEvent(new window.Event('focus'));}};
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

module.exports={boot,createValues,pay,chooseTime,until,storage,cache};
