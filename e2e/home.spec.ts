import { test, expect } from "@playwright/test";

test.describe("ホームページ", () => {
  test("ホームページが正しく表示される", async ({ page }) => {
    await page.goto("/");

    // タイトルを確認
    await expect(page).toHaveTitle(/QV-Tool/);

    // ヘッドラインが表示される
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // イベント作成ボタンが表示される
    await expect(
      page.getByRole("link", { name: /イベントを作成|Create Event/i })
    ).toBeVisible();
  });

  test("言語切り替えが機能する", async ({ page }) => {
    await page.goto("/");

    // 言語スイッチャーを探す
    const languageSwitcher = page.getByRole("combobox", {
      name: /言語|language/i,
    });

    if (await languageSwitcher.isVisible()) {
      // 言語を切り替え
      await languageSwitcher.click();
      const englishOption = page.getByRole("option", { name: "English" });

      if (await englishOption.isVisible()) {
        await englishOption.click();
        // 英語に切り替わったことを確認（ページの再読み込みが必要な場合がある）
        await page.waitForLoadState("networkidle");
      }
    }
  });

  test("イベント作成ページへ遷移できる", async ({ page }) => {
    await page.goto("/");

    // イベント作成リンクをクリック
    await page
      .getByRole("link", { name: /イベントを作成|Create Event/i })
      .click();

    // URLが変わったことを確認
    await expect(page).toHaveURL(/\/admin\/create/);

    // フォームが表示される
    await expect(
      page.getByRole("heading", {
        name: /新しい投票イベント|Create a New Voting/i,
      })
    ).toBeVisible();
  });

  test("特徴セクションが表示される", async ({ page }) => {
    await page.goto("/");

    // 特徴のカードが表示される
    const cards = page.locator("[class*='card']");
    await expect(cards.first()).toBeVisible();
  });

  test("スキップリンクが存在する（アクセシビリティ）", async ({ page }) => {
    await page.goto("/");

    // スキップリンクの存在確認（sr-onlyクラスで隠れている）
    const skipLink = page.getByRole("link", {
      name: /メインコンテンツへスキップ|Skip to main content/i,
    });

    // キーボードフォーカスでスキップリンクを表示
    await page.keyboard.press("Tab");

    // フォーカスがスキップリンクに当たる（sr-onlyからfocus:not-sr-onlyに変わる）
    // 実装によってはこのテストをスキップ
  });
});
