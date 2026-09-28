const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('https://ultrapaul0816.github.io/kaju-koi-site/order.html?box=original-6', { waitUntil: 'networkidle' });
  await p.fill('#o-address', 'TEST ORDER - please ignore. 1 Test Lane, Panaji');
  await p.fill('#o-city', 'Panaji'); await p.fill('#o-pincode', '403001');
  await p.fill('#o-name', 'TEST Order (notifications disabled check)');
  await p.fill('#o-phone', '+91 90000 00000'); await p.fill('#o-email', 'test@example.com');
  await p.fill('#o-notes', 'TEST submission by the build agent. Not a real order.');
  await p.click('#o-submit');
  await p.waitForSelector('#order-done:not([hidden])', { timeout: 30000 });
  console.log('ORDER ref', await p.textContent('#done-ref'), 'total', await p.textContent('#done-total'));
  await b.close();
})();
