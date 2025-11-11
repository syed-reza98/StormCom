import { test, expect } from '@playwright/test';

// Basic E2E check: homepage renders and exposes a <link rel="icon"> pointing to our SVG
// Also verifies the icon URL resolves with a successful HTTP status.

test.describe('favicon', () => {
  test('homepage includes a favicon link that loads', async ({ page, request }) => {
    await page.goto('/');

    const iconHref = await page.getAttribute('link[rel="icon"]', 'href');
    expect(iconHref, 'link[rel="icon"] should be present').toBeTruthy();

    // Resolve relative hrefs against baseURL
    const base = new URL('/', page.url());
    const iconUrl = new URL(iconHref || '', base).toString();

    const res = await request.get(iconUrl);
    expect(res.ok(), `favicon should be reachable at ${iconUrl}`).toBeTruthy();
  });

  test('login route responds with 200', async ({ request }) => {
    const res = await request.get('/login');
    expect(res.status(), 'login page should load').toBe(200);
  });
});
