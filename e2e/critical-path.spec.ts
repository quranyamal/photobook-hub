import { test, expect } from "@playwright/test";

// Minimal valid 1×1 PNG — passes MIME type check, well under 20 MB
const TEST_PHOTO = {
  name: "test-photo.png",
  mimeType: "image/png",
  buffer: Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "base64"
  ),
};

const CUSTOMER_EMAIL = "customer@e2e.test";
const CUSTOMER_PASSWORD = "TestPass123!";
const ADMIN_EMAIL = "admin@e2e.test";
const ADMIN_PASSWORD = "Admin123!";

// Shared across the serial describe block
let orderId: string | undefined;

import type { Page } from "@playwright/test";

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });
}

test.describe.serial("Critical path", () => {
  // ── Customer flow ──────────────────────────────────────────────────────────

  test("register", async ({ page }) => {
    await page.goto("/register");
    await page.locator('input[name="name"]').fill("E2E Customer");
    await page.locator('input[name="email"]').fill(CUSTOMER_EMAIL);
    await page.locator('input[name="password"]').fill(CUSTOMER_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });

  test("login redirects to dashboard", async ({ page }) => {
    await login(page, CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
    await expect(page.locator("h1")).toContainText("Welcome");
  });

  test("create project", async ({ page }) => {
    await login(page, CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
    await page.goto("/projects");
    await page.locator('button:has-text("New project")').first().click();
    await expect(page.locator('input#title')).toBeVisible();
    await page.locator('input#title').fill("E2E Photobook");
    await page.locator('button:has-text("Create")').last().click();
    await expect(page).toHaveURL(/\/projects\/.+$/, { timeout: 10_000 });
  });

  test("upload photo", async ({ page }) => {
    await login(page, CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
    await page.goto("/projects");
    await page.locator('a:has-text("E2E Photobook")').first().click();
    await expect(page).toHaveURL(/\/projects\/.+$/, { timeout: 10_000 });

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(TEST_PHOTO);
    await expect(page.locator('text=Done')).toBeVisible({ timeout: 15_000 });
  });

  test("create photobook in editor", async ({ page }) => {
    await login(page, CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
    await page.goto("/projects");
    await page.locator('a:has-text("E2E Photobook")').first().click();
    await page.locator('a:has-text("Create photobook")').click();
    await expect(page).toHaveURL(/\/editor/, { timeout: 10_000 });

    await page.locator('button:has-text("Create photobook")').click();
    // After creation the page refreshes and shows the page grid + Proceed button
    await expect(page.locator('a:has-text("Proceed to order")')).toBeVisible({
      timeout: 15_000,
    });
  });

  test("checkout and place order", async ({ page }) => {
    await login(page, CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
    await page.goto("/projects");
    await page.locator('a:has-text("E2E Photobook")').first().click();
    await page.locator('a:has-text("Create photobook")').click();
    await expect(page).toHaveURL(/\/editor/);
    await page.locator('a:has-text("Proceed to order")').click();
    await expect(page).toHaveURL(/\/checkout\//, { timeout: 10_000 });

    await page.locator('input[name="recipientName"]').fill("E2E Customer");
    await page.locator('input[name="phoneNumber"]').fill("08123456789");
    await page.locator('input[name="addressLine"]').fill("Jl. Test No. 1");
    await page.locator('input[name="city"]').fill("Jakarta");
    await page.locator('input[name="province"]').fill("DKI Jakarta");
    await page.locator('input[name="postalCode"]').fill("10110");
    await page.locator('button:has-text("Place order")').click();
    await expect(page).toHaveURL(/\/orders\//, { timeout: 15_000 });

    orderId = page.url().split("/").pop();
    expect(orderId).toBeTruthy();
  });

  test("submit payment reference", async ({ page }) => {
    await login(page, CUSTOMER_EMAIL, CUSTOMER_PASSWORD);
    await page.goto(`/orders/${orderId}`);

    await page.locator('input[placeholder="Transfer reference code"]').fill(
      "TRF-E2E-001"
    );
    await page.locator('button:has-text("I have transferred")').click();
    await expect(
      page.locator("text=payment reference has been received")
    ).toBeVisible({ timeout: 10_000 });
  });

  // ── Admin flow ─────────────────────────────────────────────────────────────

  test("admin: confirm payment", async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await expect(page.locator('a:has-text("Admin")')).toBeVisible();

    await page.goto("/admin/orders");
    await expect(page.locator("h1")).toContainText("Orders");

    // Find the order placed by the customer test
    await page.locator(`a[href="/admin/orders/${orderId}"]`).click();
    await expect(page).toHaveURL(`/admin/orders/${orderId}`, { timeout: 10_000 });

    await page.locator('button:has-text("Confirm payment")').click();
    // Wait for the status-advance button — only present after DB update + router.refresh()
    await expect(
      page.locator('button:has-text("Mark as In production")')
    ).toBeVisible({ timeout: 15_000 });
  });

  test("admin: advance order status", async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto(`/admin/orders/${orderId}`);
    await page.waitForLoadState("networkidle");

    await expect(
      page.locator('button:has-text("Mark as In production")')
    ).toBeVisible({ timeout: 15_000 });
    await page.locator('button:has-text("Mark as In production")').click();
    await expect(page.locator('button:has-text("Mark as Shipped")')).toBeVisible(
      { timeout: 15_000 }
    );
  });

  test("admin: download assets link is present", async ({ page }) => {
    await login(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto(`/admin/orders/${orderId}`);
    const downloadLink = page.locator('a[download]');
    await expect(downloadLink).toBeVisible();
    await expect(downloadLink).toHaveText("Download photos (ZIP)");
  });
});
