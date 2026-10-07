// Opt-in browser journey against a running app, SQL-backed API and real Cognito test users.
import assert from 'node:assert/strict';

const required = [
  'CONNECTO_F3_BROWSER_URL',
  'CONNECTO_F3_EMAIL_A',
  'CONNECTO_F3_PASSWORD_A',
  'CONNECTO_F3_EMAIL_B',
  'CONNECTO_F3_PASSWORD_B',
];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  console.log(`SKIP F3 browser acceptance: missing ${missing.join(', ')}`);
  process.exit(0);
}

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.log(
    'SKIP F3 browser acceptance: install Playwright and its Chromium browser first.',
  );
  process.exit(0);
}

const baseUrl = process.env.CONNECTO_F3_BROWSER_URL;
const marker = `F3 browser ${Date.now()}`;
let browser;

async function openContext() {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  await page.goto(baseUrl);
  return { context, page };
}

async function login(page, email, password) {
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Log In' }).click();
  await page
    .locator('.desktop-side')
    .getByRole('button', { name: 'My profile' })
    .waitFor();
  await page.locator('.desktop-side').getByRole('button', { name: 'My profile' }).click();
  await page.getByText('Logged in to Connecto').waitFor();
}

async function openLoadedActivity(page) {
  await page
    .locator('.desktop-side')
    .getByRole('button', { name: 'My activity' })
    .click();
  const refresh = page.getByRole('button', { name: 'Refresh activity' });
  await refresh.waitFor();
  await Promise.all([
    page.waitForResponse(
      (response) =>
        response.url().includes('/api/users/me/activity') &&
        response.request().method() === 'GET' &&
        response.ok(),
    ),
    refresh.click(),
  ]);
  await refresh.waitFor({ state: 'visible' });
  await page.waitForFunction(() => {
    const button = [...document.querySelectorAll('button')].find(
      (element) => element.textContent?.trim() === 'Refresh activity',
    );
    return button && !button.disabled;
  });
}

try {
  browser = await chromium.launch({ headless: true });
  const a = await openContext();
  await login(
    a.page,
    process.env.CONNECTO_F3_EMAIL_A,
    process.env.CONNECTO_F3_PASSWORD_A,
  );
  if (
    !(await a.page
      .getByRole('dialog')
      .isVisible()
      .catch(() => false))
  )
    await a.page.getByRole('button', { name: 'Edit profile' }).click();
  const dialog = a.page.getByRole('dialog');
  await dialog.getByLabel('First name').fill('F3 Browser');
  await dialog.getByLabel('Last name').fill('Account A');
  await dialog.getByLabel('Neighborhood').fill('Auckland');
  await dialog.getByLabel('A little about you').fill(marker);
  await dialog.getByRole('button', { name: 'Save Profile' }).click();
  await a.page.locator('.profile-card').getByText(marker).waitFor();

  await openLoadedActivity(a.page);
  await a.page
    .locator('section')
    .filter({ has: a.page.getByRole('heading', { name: 'Your Help Requests' }) })
    .getByRole('button', { name: '+ New' })
    .click();
  await a.page.getByLabel('Short Title').fill(marker);
  await a.page
    .getByLabel('Details & Materials')
    .fill('Fresh browser recovery acceptance item');
  await a.page.getByRole('button', { name: 'Post Help Request' }).click();
  await a.page.getByText('Your request was saved to Connecto API.').waitFor();
  await a.context.close();

  const b = await openContext();
  await login(
    b.page,
    process.env.CONNECTO_F3_EMAIL_B,
    process.env.CONNECTO_F3_PASSWORD_B,
  );
  assert.equal(
    (await b.page.locator('.profile-card').textContent()).includes(marker),
    false,
  );
  await openLoadedActivity(b.page);
  assert.equal((await b.page.locator('main').textContent()).includes(marker), false);
  await b.context.close();

  const freshA = await openContext();
  await login(
    freshA.page,
    process.env.CONNECTO_F3_EMAIL_A,
    process.env.CONNECTO_F3_PASSWORD_A,
  );
  await freshA.page.locator('.profile-card').getByText(marker).waitFor();
  await openLoadedActivity(freshA.page);
  await freshA.page.getByRole('heading', { name: marker }).waitFor();
  await freshA.context.close();
  console.log(
    'PASS F3 browser acceptance: A profile and Need recovered in a fresh context; B saw neither.',
  );
} finally {
  await browser?.close();
}
