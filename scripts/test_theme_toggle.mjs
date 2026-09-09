import puppeteer from '../frontend/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = 'http://localhost:3001';
const SCREENSHOT_DIR = '/Users/wonyoung/.gemini/antigravity-cli/brain/7e4cd523-6d33-44d7-a4f7-73478c291e73/scratch';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runThemeTest() {
  console.log('🚀 Launching Headless Chrome for Theme Toggle Testing...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log(`[Browser Console Error] ${msg.text()}`);
    }
  });

  try {
    console.log(`Navigating to ${BASE_URL}...`);
    await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 15000 });

    // 1. Initial State: Dark Mode
    const initialTheme = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-theme');
    });
    console.log(`Initial Theme attribute: ${initialTheme}`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'theme_01_initial_dark.png') });

    // 2. Find and click Theme Toggle button
    const toggleButton = await page.$('button[aria-label="테마 전환"]');
    if (!toggleButton) {
      throw new Error('Theme toggle button with aria-label="테마 전환" not found!');
    }

    console.log('Clicking Theme Toggle button to switch to Light Mode...');
    await toggleButton.click();
    await new Promise((r) => setTimeout(r, 600));

    // 3. Verify Light Mode
    const lightTheme = await page.evaluate(() => {
      return {
        dataTheme: document.documentElement.getAttribute('data-theme'),
        hasLightClass: document.documentElement.classList.contains('light'),
        storedTheme: localStorage.getItem('agentlens_theme'),
        bodyBg: window.getComputedStyle(document.body).backgroundColor
      };
    });
    console.log('Light Mode State:', JSON.stringify(lightTheme));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'theme_02_switched_light.png') });

    if (lightTheme.dataTheme !== 'light') {
      throw new Error(`Expected data-theme="light", got "${lightTheme.dataTheme}"`);
    }

    // 4. Open a modal in Light Mode to verify modal styling
    const sourcesBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find((b) => b.textContent && b.textContent.includes('소스 & 리서처'));
    });
    if (sourcesBtn && sourcesBtn.asElement()) {
      await sourcesBtn.asElement().click();
      await new Promise((r) => setTimeout(r, 600));
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'theme_03_modal_light.png') });

      // Close modal
      const closeBtn = await page.$('button[title="닫기"]');
      if (closeBtn) await closeBtn.click();
      await new Promise((r) => setTimeout(r, 400));
    }

    // 5. Click Theme Toggle button again to switch back to Dark Mode
    console.log('Clicking Theme Toggle button to switch back to Dark Mode...');
    const toggleButton2 = await page.$('button[aria-label="테마 전환"]');
    if (!toggleButton2) throw new Error('Theme toggle button not found on second click');
    await toggleButton2.click();
    await new Promise((r) => setTimeout(r, 600));

    const darkTheme = await page.evaluate(() => {
      return {
        dataTheme: document.documentElement.getAttribute('data-theme'),
        hasDarkClass: document.documentElement.classList.contains('dark'),
        storedTheme: localStorage.getItem('agentlens_theme'),
        bodyBg: window.getComputedStyle(document.body).backgroundColor
      };
    });
    console.log('Dark Mode State:', JSON.stringify(darkTheme));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'theme_04_switched_dark.png') });

    if (darkTheme.dataTheme !== 'dark') {
      throw new Error(`Expected data-theme="dark", got "${darkTheme.dataTheme}"`);
    }

    // 6. Test Persistence on Reload
    console.log('Testing persistence across page reload in Light Mode...');
    await toggleButton.click(); // switch back to light
    await new Promise((r) => setTimeout(r, 500));
    await page.reload({ waitUntil: 'networkidle2' });

    const persistedTheme = await page.evaluate(() => {
      return document.documentElement.getAttribute('data-theme');
    });
    console.log(`Persisted Theme after reload: ${persistedTheme}`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'theme_05_reloaded_light.png') });

    if (persistedTheme !== 'light') {
      throw new Error(`Expected persisted theme "light", got "${persistedTheme}"`);
    }

    // Switch back to dark for default
    const finalToggleBtn = await page.$('button[aria-label="테마 전환"]');
    if (finalToggleBtn) {
      await finalToggleBtn.click();
      await new Promise((r) => setTimeout(r, 400));
    }

    console.log('🎉 ALL THEME TOGGLE TESTS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runThemeTest();
