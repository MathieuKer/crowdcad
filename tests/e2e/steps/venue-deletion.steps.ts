import { createBdd } from 'playwright-bdd';
import { expect } from '@playwright/test';
import { test } from '../fixtures';
import { NAV_TIMEOUT } from '../timeouts';

const { Given, When, Then } = createBdd(test);

/**
 * Background step: creates a venue and navigates to the selection page.
 * Stores the venue name in scenarioState for later assertions.
 */
Given('I have a venue on the selection page', async ({ page, scenarioState }) => {
  scenarioState.deletionVenueName = `Del-Venue-${Date.now()}`;
  await page.goto('/venues/management', { waitUntil: 'networkidle', timeout: NAV_TIMEOUT });
  await page.getByPlaceholder('e.g., Convention Center Hall A').fill(scenarioState.deletionVenueName);
  await page.getByRole('button', { name: 'Create Venue' }).click();
  await page.waitForURL('/venues/selection', { timeout: NAV_TIMEOUT });
  await expect(page.getByText(scenarioState.deletionVenueName, { exact: true })).toBeVisible();
});

When('I open the venue actions menu', async ({ page, scenarioState }) => {
  // On desktop, the venue card shows an ellipsis button with aria-label "Venue actions".
  // We need to find the one associated with our venue. The venue name appears in the same
  // row/card as the actions button.
  const venueRow = page.locator('div', { hasText: scenarioState.deletionVenueName })
    .filter({ has: page.locator('[aria-label="Venue actions"]') })
    .last();
  await venueRow.locator('[aria-label="Venue actions"]').click();
});

When('I confirm venue deletion', async ({ page }) => {
  // Register a dialog handler to accept the window.confirm before clicking Delete
  page.once('dialog', dialog => dialog.accept());
  // force:true bypasses Playwright's stability/scroll checks that cause the
  // HeroUI dropdown to re-render and detach the element mid-click
  await page.getByRole('menuitem', { name: 'Delete' }).click({ force: true });
});

When('I cancel venue deletion', async ({ page }) => {
  // Register a dialog handler to dismiss the window.confirm
  page.once('dialog', dialog => dialog.dismiss());
  await page.getByRole('menuitem', { name: 'Delete' }).click({ force: true });
});

Then('the venue should no longer be visible', async ({ page, scenarioState }) => {
  await expect(page.getByText(scenarioState.deletionVenueName, { exact: true })).not.toBeVisible({ timeout: 5_000 });
});

Then('the venue should still be visible', async ({ page, scenarioState }) => {
  await expect(page.getByText(scenarioState.deletionVenueName, { exact: true })).toBeVisible();
});
