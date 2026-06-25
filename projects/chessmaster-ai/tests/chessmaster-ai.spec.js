const { test, expect } = require('@playwright/test');

test.describe('ChessOS V2 Platform E2E Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to the ChessOS application
    await page.goto('/');
  });

  test('should load page title and dashboard elements', async ({ page }) => {
    await expect(page).toHaveTitle(/ChessOS | Adaptive Chess Operating System/);
    
    // Check brand section
    const brand = page.locator('.brand-name');
    await expect(brand).toHaveText('ChessOS');

    // Check ELO values and stats
    const currentElo = page.locator('#currentEloVal');
    await expect(currentElo).toBeVisible();
    await expect(currentElo).not.toBeEmpty();
  });

  test('should navigate to Skill Assessment and check intro cards', async ({ page }) => {
    // Click on Skill Assessment in the sidebar
    await page.click('button[data-target="assessment-view"]');
    
    // Check if the assessment intro panel is visible
    const introPanel = page.locator('#assessmentIntro');
    await expect(introPanel).toBeVisible();

    const title = introPanel.locator('.card-title');
    await expect(title).toHaveText('📋 Comprehensive Skill Assessment');

    // Check if start button is present
    const startBtn = page.locator('#btnStartAssessment');
    await expect(startBtn).toBeVisible();
  });

  test('should navigate to Skill Tree and verify nodes', async ({ page }) => {
    await page.click('button[data-target="skilltree-view"]');
    
    const skillTreeSection = page.locator('#skilltree-view');
    await expect(skillTreeSection).toBeVisible();

    // Verify grid is populated
    const grid = page.locator('#skillTreeGrid');
    await expect(grid).toBeVisible();
    
    // Wait for dynamic nodes to render
    await page.waitForTimeout(500);
    const nodes = grid.locator('.st-node');
    const count = await nodes.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should load Boss Battles and check challenge cards', async ({ page }) => {
    await page.click('button[data-target="boss-view"]');
    
    const bossSection = page.locator('#boss-view');
    await expect(bossSection).toBeVisible();

    const bossGrid = page.locator('#bossGrid');
    await expect(bossGrid).toBeVisible();

    // Wait for boss battles to render
    await page.waitForTimeout(500);
    const cards = bossGrid.locator('.boss-card');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should load Learning Analytics view and deep analytics cards', async ({ page }) => {
    await page.click('button[data-target="deep-analytics-view"]');
    
    const analyticsSection = page.locator('#deep-analytics-view');
    await expect(analyticsSection).toBeVisible();

    const statsCards = page.locator('#analyticsStatCards');
    await expect(statsCards).toBeVisible();
  });

  test('should load Play view and check board elements', async ({ page }) => {
    await page.click('button[data-target="play"]');
    
    const playSection = page.locator('#play');
    await expect(playSection).toBeVisible();

    // Check if board element exists
    const board = page.locator('#board');
    await expect(board).toBeVisible();

    // Reset game button click
    const resetBtn = page.locator('#btnRestart');
    await expect(resetBtn).toBeVisible();
    await resetBtn.click();
  });

  test('should load AI Coach and check recommendations', async ({ page }) => {
    await page.click('button[data-target="coach-view"]');
    
    const coachSection = page.locator('#coach-view');
    await expect(coachSection).toBeVisible();

    const weaknessCards = page.locator('#weaknessCards');
    await expect(weaknessCards).toBeVisible();
  });
});
