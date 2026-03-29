import { createBdd } from 'playwright-bdd';
import { test } from '../fixtures';

const { When } = createBdd(test);

/**
 * Sets the clinic outcome for the most recent call in the clinic tracking table.
 * The clinic table shows a status dropdown button (default text "In Clinic") for
 * each unresolved call. This step clicks the first such button and selects the
 * requested outcome from the dropdown menu.
 */
When('I set the clinic outcome for the latest call to {string}', async ({ page }, outcome: string) => {
  // The clinic tracking table status trigger has exactly "In Clinic" as its accessible name.
  // The team-card status button in the left panel has "In Clinic Status Status" (substring),
  // so we must use exact: true to avoid matching it first.
  const statusButton = page.getByRole('button', { name: 'In Clinic', exact: true }).first();
  await statusButton.click();
  // Select the outcome from the dropdown
  await page.getByRole('menuitem', { name: outcome }).click();
});
