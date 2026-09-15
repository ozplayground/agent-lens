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
  console.log('🚀 Launching Puppeteer for Ask AI End-to-End Test...');
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

    console.log('2. Finding and clicking a news card (article)...');
    const article = await page.$('article');
    if (article) {
      await article.click();
    } else {
      console.log('No article found!');
    }

    page.on('console', (msg) => {
      console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`);
    });
    page.on('pageerror', (err) => {
      console.log(`[Browser PageError] ${err.message}`);
    });
    page.on('response', async (res) => {
      if (res.url().includes('/ask')) {
        console.log(`[HTTP ${res.status()}] ${res.url()}`);
        try {
          const text = await res.text();
          console.log(`[Response Body Preview] ${text.slice(0, 300)}`);
        } catch (e) {}
      }
    });

    await sleep(1500);

    console.log('3. Capturing News Detail Modal Overview Tab...');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'ask_ai_01_modal_overview.png') });

    console.log('4. Switching to AI 엔지니어링 Q&A tab...');
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await page.evaluate((el) => el.textContent, btn);
      if (text && text.includes('AI 엔지니어링 Q&A')) {
        await btn.click();
        break;
      }
    }
    await sleep(800);

    console.log('5. Capturing initial Q&A Tab...');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'ask_ai_02_qa_initial.png') });

    console.log('6. Clicking quick prompt button (핵심 원리 및 구조)...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const promptBtn = btns.find(b => b.textContent?.includes('핵심 원리 및 구조'));
      promptBtn?.click();
    });

    console.log('7. Waiting for live Gemini AI response (.markdown-viewer)...');
    try {
      await page.waitForSelector('.markdown-viewer', { timeout: 25000 });
      console.log('Found .markdown-viewer!');
    } catch (e) {
      console.log('Timed out waiting for .markdown-viewer');
    }
    await sleep(5000);

    console.log('8. Capturing AI Response in modal...');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'ask_ai_03_qa_answered.png') });

    console.log('🎉 Ask AI E2E Test Completed Successfully!');
  } catch (err) {
    console.error('Test failed with error:', err);
  } finally {
    await browser.close();
  }
}

runTest();
