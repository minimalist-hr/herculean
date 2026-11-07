// Renders drawings in html/ to screens/ at their full height, and prints each height. Usage: node render-drawing.mjs L01-Logging W02-...

import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import puppeteer from 'puppeteer-core';

import { areaPath } from './areas.mjs';

const designDir = join(import.meta.dirname, '..');
const executablePath = process.env.BROWSER ?? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const browser = await puppeteer.launch({ executablePath, headless: true });

try {
  for (const file of process.argv.slice(2)) {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
    await page.goto(pathToFileURL(join(designDir, 'html', areaPath(file, 'html'))).href, { waitUntil: 'networkidle0' });
    await page.evaluateHandle('document.fonts.ready');
    const height = await page.evaluate(() => Math.ceil(document.body.firstElementChild.getBoundingClientRect().height));
    await page.setViewport({ width: 390, height, deviceScaleFactor: 2 });
    await page.screenshot({ path: join(designDir, 'screens', areaPath(file, 'png')) });
    await page.close();
    console.log(file, height);
  }
} finally {
  await browser.close();
}
