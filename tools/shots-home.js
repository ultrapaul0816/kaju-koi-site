const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const [vp, size, m] of [['desktop',{width:1440,height:900},false],['mobile',{width:390,height:844},true]]) {
    const ctx = await b.newContext({ viewport: size, deviceScaleFactor: m?2:1, isMobile: m, hasTouch: m });
    const p = await ctx.newPage();
    await p.goto('https://kaju-koi.vercel.app/', { waitUntil: 'networkidle' });
    await p.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=600){scrollTo(0,y);await new Promise(r=>setTimeout(r,60));}scrollTo(0,0);});
    await p.waitForTimeout(500);
    await p.screenshot({ path: `../screens/vercel-home-${vp}.png`, fullPage: true });
    await p.screenshot({ path: `/tmp/vercel-home-${vp}-fold.png` });
    await ctx.close();
  }
  await b.close();
})();
