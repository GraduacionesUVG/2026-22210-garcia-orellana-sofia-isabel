'use strict';
/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS entry point shared with the Jest harness. */
const { readFileSync } = require('node:fs');

function assertPlaywrightImage({ lockedVersion, installedVersion, image }) {
  if (typeof lockedVersion !== 'string' || !/^\d+\.\d+\.\d+$/.test(lockedVersion)) {
    throw new Error('Missing exact Playwright version in package-lock.json');
  }
  if (installedVersion !== lockedVersion) {
    throw new Error(`Installed Playwright ${installedVersion} does not match lockfile ${lockedVersion}`);
  }
  const expectedImage = `mcr.microsoft.com/playwright:v${lockedVersion}-noble`;
  if (image?.driverVersion !== lockedVersion || image?.dockerImageName !== expectedImage) {
    throw new Error(`Browser image must match ${expectedImage}; update frontend-gate.yml together with package-lock.json`);
  }
  return lockedVersion;
}

async function verifyBrowserLaunches() {
  const playwright = require('playwright');
  const ready = [];
  for (const name of ['chromium', 'firefox', 'webkit']) {
    const started = Date.now();
    const browser = await playwright[name].launch({ headless: true, timeout: 10_000 });
    try {
      const page = await browser.newPage();
      await page.setContent('<title>Frontend CI ready</title>', { waitUntil: 'domcontentloaded', timeout: 5000 });
      if (await page.title() !== 'Frontend CI ready') throw new Error(`${name} renderer is unavailable`);
      ready.push(name);
      console.log(`${name}: ready in ${Date.now() - started}ms`);
    } finally {
      // This probe owns this browser, including its contexts and pages.
      await browser.close();
    }
  }
  return ready;
}

async function main() {
  const started = Date.now();
  const lock = require('../../package-lock.json');
  let image;
  try { image = JSON.parse(readFileSync('/ms-playwright/.docker-info', 'utf8')); }
  catch { throw new Error('Official Playwright image metadata is missing; run this preflight inside the pinned CI container'); }
  const version = assertPlaywrightImage({
    lockedVersion: lock.packages['node_modules/@playwright/test']?.version,
    installedVersion: require('@playwright/test/package.json').version,
    image,
  });
  console.log(`Playwright ${version}: package and preinstalled browser image match`);
  await verifyBrowserLaunches();
  console.log(`Frontend CI preparation verified in ${Date.now() - started}ms; no downloads performed`);
}

if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = { assertPlaywrightImage, verifyBrowserLaunches };
