const { chromium } = require('playwright');
const base = process.argv[2] || 'http://localhost:8787/';
const out = process.argv[3] || '../screens';
(async () => {
  const b = await chromium.launch();
  const pages = [['home','index.html'],['shop','shop.html'],['order','order.html?box=original-12'],['business','business.html']];
  for (const [vp, size, mobile] of [['desktop',{width:1440,height:900},false],['mobile',{width:390,height:844},true]]) {
    const ctx = await b.newContext({ viewport: size, deviceScaleFactor: mobile?2:1, isMobile: mobile, hasTouch: mobile });
    const p = await ctx.newPage();
    for (const [n,u] of pages) {
      await p.goto(base+u, { waitUntil: 'networkidle' });
      await p.evaluate(async()=>{ for(let y=0;y<document.body.scrollHeight;y+=600){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,60));} window.scrollTo(0,0); });
      await p.waitForTimeout(500);
      await p.screenshot({ path: `${out}/${n}-${vp}.png`, fullPage: true });
      await p.screenshot({ path: `${out}/${n}-${vp}-fold.png` });
    }
    await ctx.close();
  }
  await b.close();
})();
