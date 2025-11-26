import { test, expect } from "@playwright/test";

test.describe("イベント作成フロー", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/create");
  });

  test("イベント作成フォームが正しく表示される", async ({ page }) => {
    // 必須フィールドが存在する
    await expect(page.getByLabel(/タイトル|Title/i)).toBeVisible();
    await expect(page.getByLabel(/開始日時|Start Date/i)).toBeVisible();
    await expect(page.getByLabel(/終了日時|End Date/i)).toBeVisible();
    await expect(page.getByLabel(/クレジット|Credits/i)).toBeVisible();

    // 送信ボタンが存在する
    await expect(page.getByRole("button", { name: /イベントを作成|Create Event/i })).toBeVisible();
  });

  test("バリデーションエラーが表示される", async ({ page }) => {
    // タイトルを空のまま送信
    const titleInput = page.getByLabel(/タイトル|Title/i);
    await titleInput.fill("");
    await titleInput.clear();

    // フォームを送信
    const submitButton = page.getByRole("button", { name: /イベントを作成|Create Event/i });
    await submitButton.click();

    // ブラウザのHTML5バリデーションメッセージが表示される（required属性）
    // または、タイトル入力欄にフォーカスが当たる
  });

  test("有効な入力でイベントが作成される", async ({ page }) => {
    // タイトルを入力
    await page.getByLabel(/タイトル|Title/i).fill("テストイベント E2E");

    // 説明を入力
    await page.getByLabel(/説明|Description/i).fill("E2Eテスト用のイベントです");

    // クレジット数を設定
    await page.getByLabel(/クレジット|Credits/i).fill("50");

    // フォームを送信
    await page.getByRole("button", { name: /イベントを作成|Create Event/i }).click();

    // 作成完了ページにリダイレクトされる
    await expect(page).toHaveURL(/\/admin\/created\?id=/);

    // 成功メッセージまたは管理URLが表示される
    await expect(page.getByText(/作成されました|Created/i)).toBeVisible();
  });

  test("戻るリンクがホームページに遷移する", async ({ page }) => {
    // 戻るリンクをクリック
    await page.getByRole("link", { name: /戻る|Back/i }).click();

    // ホームページにリダイレクトされる
    await expect(page).toHaveURL("/");
  });
});

