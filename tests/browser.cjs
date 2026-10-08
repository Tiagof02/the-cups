/* Optional rendered regression check: npm install --no-save playwright;
   npx playwright install chromium; node tests/browser.cjs
   CHROMIUM_EXECUTABLE may point to an existing Chromium binary. */
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const output=process.env.QA_OUTPUT||path.join(root,'..','tmp','mobile-browser-results');
const baseline=process.env.QA_BASELINE;
let checks=0;const check=(value,message)=>{assert(value,message);checks++};
(async()=>{
 fs.mkdirSync(output,{recursive:true});
 const server=http.createServer((req,res)=>{
  let pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const isBaseline=baseline&&pathname.startsWith('/baseline/');
  const base=isBaseline?path.resolve(baseline):root;
  if(isBaseline)pathname=pathname.slice('/baseline'.length);
  const file=path.resolve(base,'.'+pathname+(pathname.endsWith('/')?'index.html':''));
  if(!file.startsWith(base+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
  const type={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.ttf':'font/ttf'}[path.extname(file)]||'application/octet-stream';
  res.writeHead(200,{'Content-Type':type});fs.createReadStream(file).pipe(res);
 });
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const url=`http://127.0.0.1:${server.address().port}`;
 let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_EXECUTABLE||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
  for(const width of [375,390,430,1366]){
   const context=await browser.newContext({viewport:{width,height:900},timezoneId:'Europe/Lisbon'});
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.emulateMedia({reducedMotion:'reduce'});
   await page.clock.install({time:new Date('2026-10-08T13:00:00Z')});
   await page.goto(url);await page.evaluate(()=>document.fonts.ready);
   const mobile=width<768;
   check(await page.locator('.mobile-header').isVisible()===mobile,'Mobile visibility '+width);
   check(await page.locator('.header-inner').isVisible()===!mobile,'Desktop visibility '+width);
   for(const lang of ['EN','PT','DE']){
    const header=mobile?'.mobile-header':'.header-inner';
    await page.locator(`${header} .lang[data-lang="${lang}"]`).click();
    if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)){
      console.log(await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,elements:Array.from(document.querySelectorAll('body *')).filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.right>innerWidth+1}).map(e=>({tag:e.tagName,id:e.id,cls:e.className,text:e.textContent.slice(0,60),right:e.getBoundingClientRect().right,width:e.getBoundingClientRect().width})).slice(0,22)})));
      await page.screenshot({path:path.join(output,'overflow.png'),fullPage:true});
    }
    check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Horizontal overflow '+width+' '+lang);
    const height=await page.locator('header').evaluate(e=>e.getBoundingClientRect().height);
    if(mobile)check(height<=145,'Compact header height '+height);
    const overlap=await page.locator(header).evaluate((e,mobile)=>{
     const selectors=mobile?['.mobile-brand','#mobile-account-toggle','#mobile-nav-toggle','.language-picker','.mobile-order']:['.brand-home','.header-nav','.header-controls'];
     const rects=selectors.map(s=>e.querySelector(s).getBoundingClientRect());
     return rects.some((a,i)=>rects.slice(i+1).some(b=>Math.min(a.right,b.right)-Math.max(a.left,b.left)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1));
    },mobile);
    check(!overlap,'Header control overlap '+width+' '+lang);
    if(mobile){
     for(const target of ['menu','pickup','loyalty','find-us']){
      await page.locator('#mobile-nav-toggle').click();check(await page.locator('#mobile-nav-panel').isVisible(),'Menu opens');
      await page.locator(`#mobile-nav-panel a[href="#${target}"]`).click();
      check(await page.locator('#mobile-nav-panel').isHidden(),'Menu closes after anchor');
      check(new URL(page.url()).hash==='#'+target,'Correct anchor target');
      const top=await page.locator('#'+target).evaluate(e=>e.getBoundingClientRect().top);
      check(top>=height-1&&top<190,'Target clears sticky header '+target+' '+top);
     }
     await page.locator('#mobile-nav-toggle').click();await page.keyboard.press('Escape');
     check(await page.locator('#mobile-nav-panel').isHidden(),'Escape closes navigation');
     check(await page.locator('#mobile-nav-toggle').evaluate(e=>e===document.activeElement),'Escape restores focus');
     await page.locator('#mobile-nav-toggle').click();await page.locator('#mobile-account-toggle').click();
     check(await page.locator('#mobile-nav-panel').isHidden(),'Only one panel open');
     check(await page.locator('#mobile-account-panel [data-open-account="login"]').isVisible(),'Mobile login access');
     check(await page.locator('#mobile-account-panel [data-open-account="create"]').isVisible(),'Mobile signup access');
     await page.locator('#mobile-account-panel [data-open-account="login"]').click();
     check(await page.locator('#account-dialog').isVisible(),'Account dialog opens');
     await page.locator('[data-close-account]').click();
     check(await page.locator('#mobile-account-toggle').evaluate(e=>e===document.activeElement),'Account dialog restores icon focus');
    }
    await page.locator('.add-product[data-product-id="espresso"]').click();
    await page.locator('.add-product[data-product-id="espresso"]').click();
    const badge=page.locator('[data-basket-quantity="espresso"]');
    check((await badge.textContent()).startsWith('2 '),'Correct espresso count');
    check(await page.locator('[data-basket-quantity="cappuccino"]').isHidden(),'Unrelated badge absent');
    const layout=await page.locator('.product-card[data-product-id="espresso"]').evaluate(card=>{
     const badge=card.querySelector('.basket-quantity').getBoundingClientRect(),plus=card.querySelector('.add-product').getBoundingClientRect(),rect=card.getBoundingClientRect();
     return badge.right<=plus.left&&Math.abs((badge.top+badge.bottom)/2-(plus.top+plus.bottom)/2)<2&&badge.left>=rect.left&&plus.right<=rect.right;
    });
    check(layout,'Badge next to plus without overlap '+width+' '+lang);
    check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'No overflow with quantity badge');
    if(lang==='EN')await page.locator('.product-card[data-product-id="espresso"]').screenshot({path:path.join(output,`product-${width}.png`)});
    await page.locator('.qty[data-id="espresso"][data-change="-1"]').click();check((await badge.textContent()).startsWith('1 '),'Cart decrement sync');
    await page.locator('[data-remove-product="espresso"]').click();check(await badge.isHidden(),'Cart removal sync');
   }
   await page.locator((mobile?'.mobile-header':'.header-inner')+' .lang[data-lang="EN"]').click();
   await page.evaluate(()=>scrollTo(0,0));
   await page.screenshot({path:path.join(output,`home-${width}.png`)});
   if(mobile){
    await page.locator('#mobile-nav-toggle').click();await page.screenshot({path:path.join(output,`navigation-${width}.png`)});await page.locator('#mobile-nav-toggle').click();
    await page.locator('#mobile-account-toggle').click();await page.locator('#mobile-account-panel [data-open-account="create"]').click();
    for(const [name,value] of Object.entries({firstName:'Mobile',lastName:'Demo',email:`mobile${width}@example.test`,password:'DemoPassword123'}))await page.locator(`#create-account-form [name="${name}"]`).fill(value);
    await page.locator('#create-account-form [type="submit"]').click();await page.locator('#profile-form').waitFor();await page.locator('[data-close-account]').click();
    await page.locator('#mobile-account-toggle').click();check(await page.locator('#mobile-account-panel [data-open-account="profile"]').isVisible(),'Signed-in profile access');
    await page.locator('#mobile-account-panel [data-logout]').click();
    await page.locator('#mobile-account-toggle').click();await page.locator('#mobile-account-panel [data-open-account="login"]').click();
    await page.locator('#login-form [name="email"]').fill(`mobile${width}@example.test`);await page.locator('#login-form [name="password"]').fill('DemoPassword123');
    await page.locator('#login-form [type="submit"]').click();await page.locator('#profile-form').waitFor();await page.locator('[data-close-account]').click();
    await page.reload();check(await page.evaluate(()=>window.CupsStore.user?.firstName)==='Mobile','Persisted login after refresh');
    await page.locator('#mobile-nav-toggle').click();await page.locator('#mobile-nav-toggle').click();check(await page.locator('#mobile-nav-panel').isHidden(),'Toggle closes navigation');
   }else if(baseline){
    const current=await page.locator('header').screenshot();
    await page.goto(url+'/baseline/index.html');await page.evaluate(()=>document.fonts.ready);
    const before=await page.locator('header').screenshot();
    check(current.equals(before),'Desktop header pixel-identical to baseline');
   }
   check(errors.length===0,'Browser runtime errors: '+errors.join(';'));
   await context.close();
  }
  console.log(`${checks} rendered Chromium assertions passed at 375, 390, 430 and 1366px in EN/PT/DE. Screenshots: ${output}`);
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1});
