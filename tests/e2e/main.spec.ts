import { test, expect, _electron as electron } from '@playwright/test';
import type { ElectronApplication } from 'playwright-core';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
let electronApp: ElectronApplication;

test.beforeAll(async () => {
  // Launch with the project root so Electron resolves "main" from package.json
  const projectRoot = path.resolve(__dirname, '../..');

  electronApp = await electron.launch({
    args: [projectRoot],
    env: {
      ...process.env,
      NODE_ENV: 'development',
    },
  });
});

test.afterAll(async () => {
  if (electronApp) {
    await electronApp.close();
  }
});

test('Launch app and verify main window loads', async () => {
  const window = await electronApp.firstWindow();

  // Wait for the renderer to finish loading
  await window.waitForLoadState('domcontentloaded');

  // The main window should exist
  expect(window).toBeTruthy();
});

test('Main window displays the HERA header', async () => {
  const window = await electronApp.firstWindow();
  await window.waitForLoadState('domcontentloaded');

  // The app header should render "HERA"
  const header = window.locator('h1');
  await expect(header).toHaveText('HERA');
});

test('Board columns are visible', async () => {
  const window = await electronApp.firstWindow();
  await window.waitForLoadState('domcontentloaded');

  // Wait for the board data to load and columns to render
  await expect(window.locator('text=TODO')).toBeVisible({ timeout: 10000 });
  await expect(window.locator('text=IN PROGRESS')).toBeVisible();
  await expect(window.locator('text=DONE')).toBeVisible();
});

test('Search input is present and functional', async () => {
  const window = await electronApp.firstWindow();
  await window.waitForLoadState('domcontentloaded');

  const searchInput = window.locator('input[placeholder="Search tasks..."]');
  await expect(searchInput).toBeVisible();

  // Type into the search box
  await searchInput.fill('test query');
  await expect(searchInput).toHaveValue('test query');

  // Clear it
  await searchInput.fill('');
  await expect(searchInput).toHaveValue('');
});

test('New task button opens the task modal', async () => {
  const window = await electronApp.firstWindow();
  await window.waitForLoadState('domcontentloaded');

  // Click the "+" button in the header (the only button in the header area)
  const addButton = window.locator('header button');
  await addButton.click();

  // The modal should appear with "New Task" heading
  await expect(window.locator('text=New Task')).toBeVisible({ timeout: 5000 });

  // Close the modal via the Cancel button
  const cancelButton = window.locator('button:has-text("Cancel")');
  await cancelButton.click();

  // Modal should be gone
  await expect(window.locator('text=New Task')).not.toBeVisible();
});
