import { chromium } from 'playwright';

const baseURL = process.env.BASE_URL || 'http://127.0.0.1:3000';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(baseURL, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /play mission/i }).click();
  await page.getByRole('button', { name: /start quest/i }).click();
  await page.locator('canvas').waitFor();

  console.log('Smoke test passed: menu → intro → gameplay canvas rendered.');
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
