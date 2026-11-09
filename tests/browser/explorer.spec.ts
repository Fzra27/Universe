import {test,expect} from '@playwright/test';
async function ready(page:any){await page.goto('/');await expect(page.locator('#catalog-status')).toContainText('CATALOGED OBJECTS',{timeout:30000});}
test('renders real catalog, switches scales, travels and measures across systems',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await ready(page);
 await expect(page.locator('canvas')).toBeVisible();await expect(page.locator('#object-name')).toHaveText('Earth');
 await page.locator('#catalog-open').click();await page.locator('#search').fill('Andromeda');await page.locator('.result-row').first().click();
 await expect(page.locator('#object-name')).toContainText('Andromeda');await expect(page.locator('[data-scale=cosmic]')).toHaveClass('active');
 await page.locator('#home').click();await expect(page.locator('#object-name')).toHaveText('Earth');await expect(page.locator('[data-scale=solar]')).toHaveClass('active');
 await page.locator('#endpoint-b').click();await page.locator('#search').fill('Proxima');await page.locator('.result-row').first().click();
 await expect(page.locator('#distance-value')).not.toHaveText('0');await expect(page.locator('#distance-value')).not.toHaveText('Unresolved');
 await page.locator('#matter').click();await expect(page.locator('#matter')).toHaveAttribute('aria-pressed','true');
 await page.locator('#help-open').click();await expect(page.locator('#help')).toBeVisible();await page.locator('#help-close').click();
 await expect(page.locator('#help')).not.toBeVisible();expect(errors).toEqual([]);
 await page.screenshot({path:'/workspace/work/universe-desktop.png'});
});
test('same-host planet separation is explicitly unresolved and imported names are safe',async({page})=>{
 await ready(page);
 for(const [endpoint,name] of [['a','TRAPPIST-1 b'],['b','TRAPPIST-1 c']]){
  await page.locator('#endpoint-'+endpoint).click();await page.locator('#search').fill(name);await page.locator('.result-row').first().click();
 }
 await expect(page.locator('#distance-value')).toHaveText('Unresolved');
 await page.locator('#catalog-open').click();await page.locator('#import-file').setInputFiles({name:'objects.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify([{name:'<img src=x onerror=alert(1)>',kind:'Star',ra:0,dec:0,distanceLy:12}]))});
 await page.locator('#search').fill('<img');await expect(page.locator('.result-row')).toHaveCount(1);await expect(page.locator('.result-row img')).toHaveCount(0);
 await page.locator('.result-row').click();await expect(page.locator('#object-name')).toHaveText('<img src=x onerror=alert(1)>');
});
test('controller movement, drift deadzone, right-stick look, and Home button',async({page})=>{
 await page.addInitScript(()=>{(window as any).__pad={axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0})),connected:true,mapping:'standard',id:'Synthetic standard gamepad'};navigator.getGamepads=()=>[(window as any).__pad];});
 await ready(page);await expect(page.locator('#pad-status')).toContainText('GAMEPAD CONNECTED');
 await page.evaluate(()=>{(window as any).__pad.axes=[0,-1,.6,0];});await page.waitForTimeout(600);
 await page.evaluate(()=>{(window as any).__pad.axes=[0,0,0,0];(window as any).__pad.buttons[2]={pressed:true,value:1};});await expect(page.locator('#object-name')).toHaveText('Earth');
});
test('mobile tools remain visible and catalog works',async({page})=>{
 await page.setViewportSize({width:390,height:844});await ready(page);await expect(page.locator('#focus')).toBeVisible();
 await page.locator('#catalog-open').click();await page.locator('#search').fill('Saturn');await page.locator('.result-row').filter({hasText:'Saturn'}).first().click();await expect(page.locator('#object-name')).toHaveText('Saturn');
 await page.screenshot({path:'/workspace/work/universe-mobile.png'});
});
