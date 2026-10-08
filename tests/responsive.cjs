// Source-level responsive checks. These do not replace rendered browser QA.
const fs=require('fs'),assert=require('assert/strict'),CSSOM=require('cssom');
const sheets=['styles.css','account.css','brand.css','mobile-cart.css'].map(name=>CSSOM.parse(fs.readFileSync(require('path').join(__dirname,'..',name),'utf8')));
function matchesMedia(text,width){
 if(/prefers-reduced-motion/.test(text))return false;
 const min=text.match(/min-width:\s*(\d+)px/),max=text.match(/max-width:\s*(\d+)px/);
 return(!min||width>=Number(min[1]))&&(!max||width<=Number(max[1]));
}
function get(selector,prop,width){
 let result;
 function visit(rules){for(const rule of rules){if(rule.media){if(matchesMedia(rule.media.mediaText,width))visit(rule.cssRules);}else if(rule.selectorText?.split(',').map(s=>s.trim()).includes(selector)&&rule.style[prop])result=rule.style[prop];}}
 sheets.forEach(s=>visit(s.cssRules));return result;
}
let checks=0;const eq=(a,b)=>{assert.equal(a,b);checks++};
for(const width of [320,375,390,430,560,768,1024,1366]){
 eq(get('.account-grid','grid-template-columns',width),width<=560?'minmax(0,1fr)':'repeat(2,minmax(0,1fr))');
 eq(get('.profile-summary','grid-template-columns',width),width<=560?'minmax(0,1fr)':'repeat(2,minmax(0,1fr))');
 eq(get('.header-controls','display',width),width<768?'contents':'flex');
 eq(get('.language-picker','display',width),'flex');
 eq(get('.favorite-list','flex-wrap',width),'wrap');
 eq(get('.cart-row','flex-wrap',width),'wrap');
 eq(get('.product-grid','grid-template-columns',width),width>=1100?'repeat(4,minmax(0,1fr))':width>=768?'repeat(3,minmax(0,1fr))':width<=360?'minmax(0,1fr)':undefined);
 eq(get('.account-dialog','width',width),'min(740px,calc(100% - 24px))');
 eq(get('.account-dialog','overflow-y',width),'auto');
 eq(get('.product-card h3','overflow-wrap',width),'anywhere');
}
eq(get('.account-dialog','max-height',390),'90dvh');
eq(get('.account-dialog','font-size',390),'16px');
eq(get('.header-nav','justify-content',1024),'center');
eq(get('.payment-dialog','width',390),'min(580px,calc(100% - 24px))');
eq(get('.favorite-button','width',390),'44px');
eq(get('.more-times','min-height',390),'44px');
eq(get('.payment-field input','min-height',390),'48px');
eq(get('.hero-art img','width',1366),'auto');
eq(get('.hero-art img','height',1366),'auto');
eq(get('.hero-art img','object-fit',1366),'contain');
eq(get('.hero-art img','object-fit',390),'contain');
eq(get('.hero-art img','max-height',390),'340px');
eq(get('.hero-art img','border-radius',1366),'0');
for(const width of [320,390,768,1366]){
 eq(get('.quick-slots','grid-template-columns',width),'repeat(3,minmax(0,1fr))');
 eq(get('.quick-slot','min-height',width),'104px');
}
for(const width of [375,390,430,1366]){
 eq(get('.mobile-header','display',width),width<768?'grid':'none');
 eq(get('header > .header-inner','display',width),width<768?'none':undefined);
 eq(get('.product-add-controls','display',width),'flex');
}
console.log(`${checks} responsive CSS assertions passed across 320, 375, 390, 430, 560, 768, 1024 and 1366px. No rendered-mobile verification is implied.`);
