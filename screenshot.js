const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setViewport({ width: 375, height: 812, isMobile: true, hasTouch: true });
        await page.goto('http://localhost:8000', { waitUntil: 'networkidle0' });
        // wait extra 2 seconds for preloader
        await new Promise(r => setTimeout(r, 2000));
        await page.screenshot({ path: 'mobile_view.png', fullPage: false });
        await browser.close();
        console.log("Screenshot saved to mobile_view.png");
    } catch (e) {
        console.error(e);
    }
})();
