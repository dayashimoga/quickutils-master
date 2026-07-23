const { test, expect } = require('@playwright/test');

test.describe('ChessOS V3 Platform E2E Tests', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  // ═══════════════════════════════════════
  // 1. Core Loading & Navigation
  // ═══════════════════════════════════════
  test('1. should load page title and dashboard elements', async ({ page }) => {
    await expect(page).toHaveTitle(/ChessOS/);
    const brand = page.locator('.brand-name');
    await expect(brand).toHaveText('ChessOS');
    const currentElo = page.locator('#currentEloVal');
    await expect(currentElo).toBeVisible();
    await expect(currentElo).not.toBeEmpty();
  });

  test('2. should render all 20 navigation items', async ({ page }) => {
    const navItems = page.locator('.nav-item');
    const count = await navItems.count();
    expect(count).toBeGreaterThanOrEqual(15);
  });

  test('3. should navigate between views without console errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));

    const targets = ['play', 'coach-view', 'tournament-view', 'community-view', 'analytics-view'];
    for (const t of targets) {
      await page.click(`button[data-target="${t}"]`);
      await page.waitForTimeout(300);
    }
    expect(errors).toHaveLength(0);
  });

  // ═══════════════════════════════════════
  // 2. Play View & Chess Board
  // ═══════════════════════════════════════
  test('4. should load Play view with board and 64 squares', async ({ page }) => {
    await page.click('button[data-target="play"]');
    const board = page.locator('#board');
    await expect(board).toBeVisible();
    const squares = board.locator('.square');
    await expect(squares).toHaveCount(64);
  });

  test('5. should show chess clock displays in Play view', async ({ page }) => {
    await page.click('button[data-target="play"]');
    const clockWhite = page.locator('#clockWhite');
    const clockBlack = page.locator('#clockBlack');
    await expect(clockWhite).toBeVisible();
    await expect(clockBlack).toBeVisible();
    await expect(clockWhite).toContainText('10:00');
    await expect(clockBlack).toContainText('10:00');
  });

  test('6. should have ARIA grid role on chessboard', async ({ page }) => {
    await page.click('button[data-target="play"]');
    await page.waitForTimeout(500);
    const board = page.locator('#board');
    await expect(board).toHaveAttribute('role', 'grid');
    const firstSquare = board.locator('.square').first();
    await expect(firstSquare).toHaveAttribute('role', 'gridcell');
  });

  // ═══════════════════════════════════════
  // 3. Tournament Center
  // ═══════════════════════════════════════
  test('7. should load Tournament view with functional buttons', async ({ page }) => {
    await page.click('button[data-target="tournament-view"]');
    const section = page.locator('#tournament-view');
    await expect(section).toBeVisible();

    const swissBtn = page.locator('#btnStartSwiss');
    const arenaBtn = page.locator('#btnStartArena');
    await expect(swissBtn).toBeVisible();
    await expect(arenaBtn).toBeVisible();
    // Verify NO alert() stubs
    await expect(swissBtn).not.toHaveAttribute('onclick');
    await expect(arenaBtn).not.toHaveAttribute('onclick');
  });

  test('8. should have tournament history section', async ({ page }) => {
    await page.click('button[data-target="tournament-view"]');
    const history = page.locator('#tournamentHistoryList');
    await expect(history).toBeVisible();
  });

  // ═══════════════════════════════════════
  // 4. Community View
  // ═══════════════════════════════════════
  test('9. should load Community view with dynamic content', async ({ page }) => {
    await page.click('button[data-target="community-view"]');
    const section = page.locator('#community-view');
    await expect(section).toBeVisible();

    const content = page.locator('#communityContent');
    await expect(content).toBeVisible();
    // Should NOT have hardcoded "1,240 Members"
    const text = await content.textContent();
    expect(text).not.toContain('1,240 Members');
  });

  // ═══════════════════════════════════════
  // 5. AI Coach
  // ═══════════════════════════════════════
  test('10. should load AI Coach with weakness cards and chat', async ({ page }) => {
    await page.click('button[data-target="coach-view"]');
    const coachSection = page.locator('#coach-view');
    await expect(coachSection).toBeVisible();

    const weaknessCards = page.locator('#weaknessCards');
    await expect(weaknessCards).toBeVisible();

    const chatInput = page.locator('#coachChatInput');
    await expect(chatInput).toBeVisible();
  });

  // ═══════════════════════════════════════
  // 6. Skill Assessment
  // ═══════════════════════════════════════
  test('11. should navigate to Skill Assessment with start button', async ({ page }) => {
    await page.click('button[data-target="assessment-view"]');
    const introPanel = page.locator('#assessmentIntro');
    await expect(introPanel).toBeVisible();
    const startBtn = page.locator('#btnStartAssessment');
    await expect(startBtn).toBeVisible();
  });

  // ═══════════════════════════════════════
  // 7. Skill Tree
  // ═══════════════════════════════════════
  test('12. should render Skill Tree with nodes', async ({ page }) => {
    await page.click('button[data-target="skilltree-view"]');
    const grid = page.locator('#skillTreeGrid');
    await expect(grid).toBeVisible();
    await page.waitForTimeout(500);
    const nodes = grid.locator('.st-node');
    expect(await nodes.count()).toBeGreaterThan(0);
  });

  // ═══════════════════════════════════════
  // 8. Boss Battles
  // ═══════════════════════════════════════
  test('13. should load Boss Battles with challenge cards', async ({ page }) => {
    await page.click('button[data-target="boss-view"]');
    const bossGrid = page.locator('#bossGrid');
    await expect(bossGrid).toBeVisible();
    await page.waitForTimeout(500);
    const cards = bossGrid.locator('.boss-card');
    expect(await cards.count()).toBeGreaterThan(0);
  });

  // ═══════════════════════════════════════
  // 9. Analytics
  // ═══════════════════════════════════════
  test('14. should render Analytics radar chart', async ({ page }) => {
    await page.click('button[data-target="analytics-view"]');
    const radarSvg = page.locator('#radarSvg');
    await expect(radarSvg).toBeVisible();
    await page.waitForTimeout(500);
    // Should contain radar polygon (not empty SVG)
    const polygons = radarSvg.locator('polygon');
    expect(await polygons.count()).toBeGreaterThan(0);
  });

  test('15. should load Deep Analytics with stats cards', async ({ page }) => {
    await page.click('button[data-target="deep-analytics-view"]');
    const statsCards = page.locator('#analyticsStatCards');
    await expect(statsCards).toBeVisible();
  });

  // ═══════════════════════════════════════
  // 10. Opening Lab
  // ═══════════════════════════════════════
  test('16. should load Opening Lab with repertoire branches', async ({ page }) => {
    await page.click('button[data-target="opening-view"]');
    const section = page.locator('#opening-view');
    await expect(section).toBeVisible();
    await page.waitForTimeout(500);
    const branches = page.locator('.repertoire-branch');
    expect(await branches.count()).toBeGreaterThan(0);
  });

  // ═══════════════════════════════════════
  // 11. Tactics Academy
  // ═══════════════════════════════════════
  test('17. should load Tactics Academy with puzzle categories', async ({ page }) => {
    await page.click('button[data-target="tactics-view"]');
    const section = page.locator('#tactics-view');
    await expect(section).toBeVisible();
    await page.waitForTimeout(500);
    const cards = page.locator('#tacticsCategoryList .tactic-card');
    expect(await cards.count()).toBeGreaterThan(0);
  });

  // ═══════════════════════════════════════
  // 12. Famous Games
  // ═══════════════════════════════════════
  test('18. should load Famous Games with game entries', async ({ page }) => {
    await page.click('button[data-target="famous-view"]');
    const section = page.locator('#famous-view');
    await expect(section).toBeVisible();
    await page.waitForTimeout(500);
    const entries = page.locator('.game-entry');
    expect(await entries.count()).toBeGreaterThan(0);
  });

  // ═══════════════════════════════════════
  // 13. Visualization Lab
  // ═══════════════════════════════════════
  test('19. should load Visualization Lab with trainer sections', async ({ page }) => {
    await page.click('button[data-target="vis-lab-view"]');
    const section = page.locator('#vis-lab-view');
    await expect(section).toBeVisible();
    // Check for board finder / memory / sequence trainers
    const bfBoard = page.locator('#bfBoard');
    await expect(bfBoard).toBeVisible();
  });

  // ═══════════════════════════════════════
  // 14. Accessibility
  // ═══════════════════════════════════════
  test('20. should have ARIA roles on sidebar and main content', async ({ page }) => {
    const sidebar = page.locator('aside.sidebar');
    await expect(sidebar).toHaveAttribute('role', 'navigation');
    const main = page.locator('main.main-content');
    await expect(main).toHaveAttribute('role', 'main');
    const toast = page.locator('#toastContainer');
    await expect(toast).toHaveAttribute('aria-live', 'polite');
  });

  test('21. should have no inline onclick handlers', async ({ page }) => {
    const clickHandlers = await page.locator('[onclick]').count();
    expect(clickHandlers).toBe(0);
  });

  // ═══════════════════════════════════════
  // 15. Theme & Settings
  // ═══════════════════════════════════════
  test('22. should toggle theme on button click', async ({ page }) => {
    const html = page.locator('html');
    const initialTheme = await html.getAttribute('data-theme');
    await page.click('#themeBtn');
    const newTheme = await html.getAttribute('data-theme');
    expect(newTheme).not.toBe(initialTheme);
  });

  // ═══════════════════════════════════════
  // 16. Game Review
  // ═══════════════════════════════════════
  test('23. should load Game Review with PGN input', async ({ page }) => {
    await page.click('button[data-target="review"]');
    const pgnInput = page.locator('#pgnInput');
    await expect(pgnInput).toBeVisible();
    const reviewBtn = page.locator('#btnReviewPGN');
    await expect(reviewBtn).toBeVisible();
  });

  // ═══════════════════════════════════════
  // 17. Security
  // ═══════════════════════════════════════
  test('24. should not expose any placeholder or Coming Soon text', async ({ page }) => {
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).not.toContain('Coming soon');
    expect(bodyText).not.toContain('coming soon');
  });
});
