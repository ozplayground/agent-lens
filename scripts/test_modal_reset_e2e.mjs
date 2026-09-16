import puppeteer from '../frontend/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = '/Users/wonyoung/.gemini/antigravity-cli/brain/7e4cd523-6d33-44d7-a4f7-73478c291e73/scratch';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTest() {
  console.log('🚀 Starting News Detail Modal Reset & Switching Test...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,960']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 960 });

  try {
    console.log(`1. Navigating to ${BASE_URL}...`);
    await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 15000 });
    await sleep(1500);

    const articles = await page.$$('article');
    console.log(`Found ${articles.length} news cards.`);
    if (articles.length < 2) {
      throw new Error(`Expected at least 2 articles, found ${articles.length}`);
    }

    // Step 1: Open Article #1
    console.log('2. Clicking Article #1...');
    await articles[0].click();
    await sleep(800);

    // Verify modal is open and in Summary tab
    let summaryTabSelected = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const summaryBtn = btns.find(b => b.textContent?.includes('기사 분석 요약'));
      return summaryBtn?.className.includes('border-[#58a6ff]');
    });
    console.log(`Article #1 initial tab is Summary: ${summaryTabSelected}`);
    if (!summaryTabSelected) throw new Error('Article #1 did not open on Summary tab!');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'modal_reset_01_article1_summary.png') });

    // Step 2: Switch to AI Tab
    console.log('3. Switching Article #1 to AI Tab...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const aiBtn = btns.find(b => b.textContent?.includes('AI 엔지니어링 Q&A'));
      aiBtn?.click();
    });
    await sleep(600);

    let aiTabSelected = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const aiBtn = btns.find(b => b.textContent?.includes('AI 엔지니어링 Q&A'));
      return aiBtn?.className.includes('border-[#58a6ff]');
    });
    console.log(`Article #1 switched to AI tab: ${aiTabSelected}`);
    if (!aiTabSelected) throw new Error('Failed to switch to AI tab on Article #1');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'modal_reset_02_article1_ai_tab.png') });

    // Step 3: Close Article #1 via Escape Key
    console.log('4. Closing modal using Escape key...');
    await page.keyboard.press('Escape');
    await sleep(600);

    let modalVisible = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button')).some(b => b.textContent?.includes('기사 분석 요약'));
    });
    console.log(`Modal visible after Escape: ${modalVisible}`);
    if (modalVisible) throw new Error('Modal did not close on Escape key!');

    // Step 4: Open Article #2
    console.log('5. Clicking Article #2...');
    const refreshedArticles = await page.$$('article');
    await refreshedArticles[1].click();
    await sleep(800);

    // Verify Article #2 opens in Summary tab!
    summaryTabSelected = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const summaryBtn = btns.find(b => b.textContent?.includes('기사 분석 요약'));
      return summaryBtn?.className.includes('border-[#58a6ff]');
    });
    console.log(`Article #2 opened with Summary tab active: ${summaryTabSelected}`);
    if (!summaryTabSelected) throw new Error('Article #2 did NOT reset to Summary tab! Bug reproduced!');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'modal_reset_03_article2_summary.png') });

    // Step 5: Switch Article #2 to AI Tab
    console.log('6. Switching Article #2 to AI Tab...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const aiBtn = btns.find(b => b.textContent?.includes('AI 엔지니어링 Q&A'));
      aiBtn?.click();
    });
    await sleep(600);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'modal_reset_04_article2_ai_tab.png') });

    // Step 6: Close Article #2 via Backdrop click
    console.log('7. Closing modal using backdrop click...');
    // Click on overlay border/corner outside dialog
    await page.mouse.click(10, 10);
    await sleep(600);

    modalVisible = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button')).some(b => b.textContent?.includes('기사 분석 요약'));
    });
    console.log(`Modal visible after backdrop click: ${modalVisible}`);
    if (modalVisible) throw new Error('Modal did not close on backdrop click!');

    // Step 7: Re-open Article #1
    console.log('8. Re-opening Article #1...');
    const reArticles = await page.$$('article');
    await reArticles[0].click();
    await sleep(800);

    // Verify Article #1 is on Summary tab
    summaryTabSelected = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const summaryBtn = btns.find(b => b.textContent?.includes('기사 분석 요약'));
      return summaryBtn?.className.includes('border-[#58a6ff]');
    });
    console.log(`Article #1 re-opened with Summary tab active: ${summaryTabSelected}`);
    if (!summaryTabSelected) throw new Error('Article #1 did not reset to Summary tab when re-opened!');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'modal_reset_05_article1_reopened_summary.png') });

    console.log('🎉 ALL MODAL RESET AND ARTICLE SWITCHING TESTS PASSED!');
  } finally {
    await browser.close();
  }
}

runTest().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
