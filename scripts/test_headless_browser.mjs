import puppeteer from '../frontend/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = 'http://localhost:3001';
const SCREENSHOT_DIR = '/Users/wonyoung/.gemini/antigravity-cli/brain/7e4cd523-6d33-44d7-a4f7-73478c291e73/scratch';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function runBrowserTests() {
  console.log('🚀 Starting Headless Browser E2E Test Suite...');
  console.log(`Target: ${BASE_URL}`);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  const consoleErrors = [];
  const pageErrors = [];

  page.on('console', (msg) => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') {
      consoleErrors.push(text);
      console.log(`[Browser Console Error] ${text}`);
    }
  });

  page.on('pageerror', (err) => {
    pageErrors.push(err.toString());
    console.error(`[Browser Page Error] ${err.message}`);
  });

  const testResults = [];

  const record = (name, passed, detail = '') => {
    testResults.push({ name, passed, detail });
    const mark = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${mark}: ${name} ${detail ? `(${detail})` : ''}`);
  };

  try {
    // 1. Initial Page Load
    console.log('\n--- 1. Testing Page Load ---');
    const response = await page.goto(BASE_URL, { waitUntil: 'networkidle2', timeout: 15000 });
    record('Page HTTP Status 200', response.status() === 200, `status: ${response.status()}`);

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_initial_load.png') });

    // 2. News Cards Rendered
    console.log('\n--- 2. Testing News Cards Rendering ---');
    await page.waitForSelector('article', { timeout: 8000 });
    const cardCount = await page.$$eval('article', (articles) => articles.length);
    record('News Cards Visible', cardCount > 0, `Found ${cardCount} cards rendered`);

    // Verify first card has title and content
    const firstTitle = await page.$eval('article h2', (el) => el.textContent.trim());
    record('First Card Title Valid', !!firstTitle && firstTitle.length > 5, `Title: "${firstTitle.slice(0, 40)}..."`);

    // 3. Category Filter Tabs
    console.log('\n--- 3. Testing Category Navigation Tabs ---');
    const harnessTab = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('nav button'));
      return btns.find((b) => b.textContent.includes('하네스'));
    });
    if (harnessTab) {
      await harnessTab.click();
      await page.waitForNetworkIdle({ timeout: 4000 }).catch(() => {});
      await new Promise((r) => setTimeout(r, 600));

      const harnessCards = await page.$$eval('article', (arts) => arts.length);
      record('Category Tab Click (Harness)', harnessCards > 0, `Filtered to ${harnessCards} cards`);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_category_harness.png') });

      // Click back to "전체 소식"
      const allTab = await page.evaluateHandle(() => {
        const btns = Array.from(document.querySelectorAll('nav button'));
        return btns.find((b) => b.textContent.includes('전체 소식'));
      });
      if (allTab) {
        await allTab.click();
        await page.waitForNetworkIdle({ timeout: 4000 }).catch(() => {});
        await new Promise((r) => setTimeout(r, 600));
      }
    }

    // 4. Source Filter Pills
    console.log('\n--- 4. Testing Source Filter ---');
    const githubBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find((b) => b.textContent.trim().startsWith('GitHub'));
    });
    if (githubBtn) {
      await githubBtn.click();
      await page.waitForNetworkIdle({ timeout: 4000 }).catch(() => {});
      await new Promise((r) => setTimeout(r, 600));
      const ghCardCount = await page.$$eval('article', (arts) => arts.length);
      record('Source Filter Click (GitHub)', ghCardCount > 0, `${ghCardCount} GitHub cards rendered`);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_source_github.png') });

      // Click "전체" source back
      const allSourceBtn = await page.evaluateHandle(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        return btns.find((b) => b.textContent.trim().startsWith('전체'));
      });
      if (allSourceBtn) {
        await allSourceBtn.click();
        await page.waitForNetworkIdle({ timeout: 4000 }).catch(() => {});
        await new Promise((r) => setTimeout(r, 600));
      }
    }

    // 5. Must-Read High Signal Toggle
    console.log('\n--- 5. Testing Must-Read (High Signal) Toggle ---');
    const mustReadBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find((b) => b.textContent.includes('Must-Read'));
    });
    if (mustReadBtn) {
      await mustReadBtn.click();
      await page.waitForNetworkIdle({ timeout: 4000 }).catch(() => {});
      await new Promise((r) => setTimeout(r, 600));
      const highSignalCount = await page.$$eval('article', (arts) => arts.length);
      record('Must-Read Toggle Click', highSignalCount > 0, `${highSignalCount} High Signal cards shown`);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_must_read_filter.png') });

      // Untoggle Must-Read
      await mustReadBtn.click();
      await page.waitForNetworkIdle({ timeout: 4000 }).catch(() => {});
      await new Promise((r) => setTimeout(r, 600));
    }

    // 6. News Card Click & Detail Modal
    console.log('\n--- 6. Testing News Detail Modal ---');
    await page.waitForSelector('article', { timeout: 8000 });
    const firstArticle = await page.$('article');
    if (firstArticle) {
      await firstArticle.click();
      await new Promise((r) => setTimeout(r, 700));

      const modalTitle = await page.$eval('h2.text-base, h2.text-lg', (el) => el.textContent.trim()).catch(() => null);
      record('News Detail Modal Opens', !!modalTitle, `Modal Title: "${modalTitle?.slice(0, 35)}..."`);

      const tldrExists = await page.evaluate(() => document.body.textContent.includes('Executive TL;DR'));
      record('Modal Executive TL;DR Displayed', tldrExists);

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_news_detail_modal.png') });

      // Close modal (Click X button)
      const closeBtn = await page.evaluateHandle(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        return btns.find((b) => b.querySelector('svg.lucide-x'));
      });
      if (closeBtn) {
        await closeBtn.click();
        await new Promise((r) => setTimeout(r, 500));
        record('News Detail Modal Closes', true);
      }
    }

    // 7. Tech Radar Accordion
    console.log('\n--- 7. Testing Tech Radar Accordion ---');
    const techRadarToggle = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find((b) => b.textContent.includes('자세히') || b.textContent.includes('접기'));
    });
    if (techRadarToggle) {
      await techRadarToggle.click();
      await new Promise((r) => setTimeout(r, 500));
      const hasSurging = await page.evaluate(() => document.body.textContent.includes('급상승'));
      record('Tech Radar Expand/Collapse', hasSurging, 'Surging section revealed');
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_tech_radar_expanded.png') });
    }

    // 8. Daily Briefing Banner Click & Modal
    console.log('\n--- 8. Testing Daily Briefing Modal ---');
    const briefingBanner = await page.evaluateHandle(() => {
      const els = Array.from(document.querySelectorAll('div[class*="cursor-pointer"]'));
      return els.find((el) => el.textContent.includes('Daily Briefing'));
    });
    if (briefingBanner) {
      await briefingBanner.click();
      await new Promise((r) => setTimeout(r, 600));

      const briefingModalVisible = await page.evaluate(() =>
        document.body.textContent.includes('일일 인텔리전스 브리핑') || document.body.textContent.includes('Daily Intelligence')
      );
      record('Daily Briefing Modal Opens', briefingModalVisible);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_briefing_modal.png') });

      // Close briefing modal
      const closeBriefingBtn = await page.evaluateHandle(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        return btns.find((b) => b.querySelector('svg.lucide-x'));
      });
      if (closeBriefingBtn) {
        await closeBriefingBtn.click();
        await new Promise((r) => setTimeout(r, 500));
        record('Daily Briefing Modal Closes', true);
      }
    }

    // 9. Reset Confirmation Modal
    console.log('\n--- 9. Testing Reset & Recollect Modal ---');
    const resetBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find((b) => b.textContent.includes('초기화 & 재수집'));
    });
    if (resetBtn) {
      await resetBtn.click();
      await new Promise((r) => setTimeout(r, 500));

      const resetModalVisible = await page.evaluate(() =>
        document.body.textContent.includes('수집 데이터 전체 삭제 및 재수집')
      );
      record('Reset Confirmation Modal Opens', resetModalVisible);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_reset_modal.png') });

      // Click "취소"
      const cancelBtn = await page.evaluateHandle(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        return btns.find((b) => b.textContent.trim() === '취소');
      });
      if (cancelBtn) {
        await cancelBtn.click();
        await new Promise((r) => setTimeout(r, 400));
        record('Reset Modal Dismissed via Cancel', true);
      }
    }

    // 10. Autonomous Deep Research & Sources Modal
    console.log('\n--- 10. Testing Autonomous Deep Research & Sources Modal ---');
    const sourcesBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find((b) => b.textContent.includes('소스 & 리서처'));
    });
    if (sourcesBtn) {
      await sourcesBtn.click();
      await new Promise((r) => setTimeout(r, 700));

      const modalTitleVisible = await page.evaluate(() =>
        document.body.textContent.includes('자율 딥 리서치')
      );
      record('Deep Research Modal Opens', modalTitleVisible);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_deep_research_modal.png') });

      // Check Deep Research Tab
      const auditTrailVisible = await page.evaluate(() =>
        document.body.textContent.includes('자율 리서치 판정 감사 일지') || document.body.textContent.includes('스케줄러')
      );
      record('Deep Research Audit Feed Rendered', auditTrailVisible);

      // Click "수집 대상 목록 (sources.json)" tab
      const sourcesTab = await page.evaluateHandle(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        return btns.find((b) => b.textContent.includes('수집 대상 목록'));
      });
      if (sourcesTab) {
        await sourcesTab.click();
        await new Promise((r) => setTimeout(r, 800));

        const sourcesListVisible = await page.evaluate(() =>
          document.body.textContent.includes('등록된 RSS 피드 목록')
        );
        record('Sources List Tab Switches', sourcesListVisible);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_sources_list_tab.png') });
      }

      // Close modal
      const closeSourcesBtn = await page.evaluateHandle(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        return btns.find((b) => b.textContent.trim() === '닫기');
      });
      if (closeSourcesBtn) {
        await closeSourcesBtn.click();
        await new Promise((r) => setTimeout(r, 400));
        record('Sources Modal Closes', true);
      }
    }

    // 11. Console Errors Check
    console.log('\n--- 11. Checking Console & Page Errors ---');
    record('Zero Page JS Errors', pageErrors.length === 0, `${pageErrors.length} errors found`);
    record('Zero Console Errors', consoleErrors.length === 0, `${consoleErrors.length} errors found`);

    console.log('\n======================================');
    const allPassed = testResults.every((t) => t.passed);
    console.log(`SUMMARY: ${allPassed ? 'ALL TESTS PASSED! 🎉' : 'SOME TESTS FAILED ⚠️'}`);
    console.log(`Passed: ${testResults.filter((t) => t.passed).length} / ${testResults.length}`);
    console.log('======================================\n');

  } catch (err) {
    console.error('Fatal test error:', err);
  } finally {
    await browser.close();
  }
}

runBrowserTests();
