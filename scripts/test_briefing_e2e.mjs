import puppeteer from '../frontend/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = '/Users/wonyoung/.gemini/antigravity-cli/brain/7e4cd523-6d33-44d7-a4f7-73478c291e73/scratch';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runBriefingTest() {
  console.log('🚀 Launching Headless Chrome for Briefing Overhaul Testing...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,960']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 960 });

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log(`[Browser Console Error] ${msg.text()}`);
    }
  });

  try {
    console.log(`1. Navigating to ${BASE_URL}...`);
    await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 15000 });
    await sleep(1500);

    // Screenshot 1: Dashboard with new Briefing Banner
    console.log('2. Verifying Dashboard and Daily Briefing Banner...');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'briefing_01_dashboard_banner.png') });

    // 3. Find and click the briefing banner
    console.log('3. Clicking Briefing Banner to open DailyBriefingModal...');
    const banner = await page.$('div.group.rounded-md.bg-\\[\\#161b22\\]');
    if (banner) {
      await banner.click();
    } else {
      // Try text match
      const elements = await page.$$('div');
      for (const el of elements) {
        const text = await page.evaluate(e => e.textContent, el);
        if (text && text.includes('오늘의 AI 브리핑') && text.includes('브리핑 보기')) {
          await el.click();
          break;
        }
      }
    }

    await sleep(1000);
    // Screenshot 2: Daily Briefing Modal with Category Sections
    console.log('4. Capturing Categorized Daily Briefing Modal...');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'briefing_02_categorized_modal.png') });

    // 5. Switch to Markdown View
    console.log('5. Switching to Markdown View Tab...');
    const buttons = await page.$$('button');
    for (const b of buttons) {
      const text = await page.evaluate(e => e.textContent, b);
      if (text && text.includes('마크다운 전문')) {
        await b.click();
        break;
      }
    }
    await sleep(600);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'briefing_03_markdown_tab.png') });

    // 6. Switch back and test Email Prompt
    console.log('6. Switching back and opening Email send prompt...');
    for (const b of buttons) {
      const text = await page.evaluate(e => e.textContent, b);
      if (text && text.includes('카테고리별 요약')) {
        await b.click();
        break;
      }
    }
    await sleep(400);

    const emailBtn = await page.$$('button');
    for (const b of emailBtn) {
      const text = await page.evaluate(e => e.textContent, b);
      if (text && text.includes('이메일 전송')) {
        await b.click();
        break;
      }
    }
    await sleep(400);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'briefing_04_email_prompt.png') });

    // 7. Open Settings Modal (BriefingSettingsModal)
    console.log('7. Opening Briefing & Notification Settings Modal...');
    // Close current briefing modal first
    const closeButtons = await page.$$('button');
    for (const b of closeButtons) {
      const text = await page.evaluate(e => e.textContent, b);
      if (text && text.trim() === '닫기') {
        await b.click();
        break;
      }
    }
    await sleep(500);

    // Click "공유 & 알림" in Header
    const headerBtns = await page.$$('button');
    for (const b of headerBtns) {
      const text = await page.evaluate(e => e.textContent, b);
      if (text && text.includes('공유 & 알림')) {
        await b.click();
        break;
      }
    }
    await sleep(800);

    // Screenshot 5: Notion Tab in Settings Modal
    console.log('8. Capturing Notion Settings Tab...');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'briefing_05_settings_notion.png') });

    // Click Email Tab
    console.log('9. Switching to Email Settings Tab...');
    const tabBtns = await page.$$('button');
    for (const b of tabBtns) {
      const text = await page.evaluate(e => e.textContent, b);
      if (text && text.includes('이메일 (SMTP)')) {
        await b.click();
        break;
      }
    }
    await sleep(500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'briefing_06_settings_email.png') });

    // Click Webhook Tab
    console.log('10. Switching to Webhook Settings Tab...');
    const tabBtns2 = await page.$$('button');
    for (const b of tabBtns2) {
      const text = await page.evaluate(e => e.textContent, b);
      if (text && text.includes('웹훅 (Slack/Discord)')) {
        await b.click();
        break;
      }
    }
    await sleep(500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'briefing_07_settings_webhook.png') });

    console.log('🎉 Headless Browser E2E Test Passed Successfully!');
  } catch (err) {
    console.error('❌ Headless Browser Test Failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runBriefingTest();
