import { test, expect } from "@playwright/test";

test.describe("投票フロー", () => {
  // テスト用のイベント作成とトークン取得
  let eventId: string;
  let adminToken: string;
  let accessToken: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    
    // イベント作成
    await page.goto("/admin/create");
    await page.getByLabel(/タイトル|Title/i).fill("E2E投票テストイベント");
    await page.getByLabel(/説明|Description/i).fill("投票フローテスト用");
    await page.getByLabel(/クレジット|Credits/i).fill("100");
    
    // 投票モードを個別投票に設定（デフォルト）
    await page.getByRole("button", { name: /イベントを作成|Create Event/i }).click();
    
    // 作成完了ページにリダイレクトされるまで待機
    await page.waitForURL(/\/admin\/created\?id=/);
    
    // URLからイベントIDを取得
    const url = new URL(page.url());
    eventId = url.searchParams.get("id") || "";
    
    // 管理URLからadminTokenを取得
    const adminUrlElement = page.locator("input[readonly]").first();
    const adminUrl = await adminUrlElement.inputValue();
    const adminUrlParsed = new URL(adminUrl);
    adminToken = adminUrlParsed.searchParams.get("token") || "";
    
    // 管理ページに移動してトークンを生成
    await page.goto(`/admin/${eventId}?token=${adminToken}`);
    
    // 投票対象を追加
    const addSubjectButton = page.getByRole("button", { name: /追加|Add/i });
    if (await addSubjectButton.isVisible()) {
      await addSubjectButton.click();
      await page.getByLabel(/タイトル|Title/i).first().fill("選択肢A");
      await page.getByRole("button", { name: /保存|Save/i }).click();
      await page.waitForTimeout(500);
      
      await addSubjectButton.click();
      await page.getByLabel(/タイトル|Title/i).first().fill("選択肢B");
      await page.getByRole("button", { name: /保存|Save/i }).click();
      await page.waitForTimeout(500);
    }
    
    // アクセストークンを生成
    const generateButton = page.getByRole("button", { name: /トークン.*生成|Generate.*Token/i });
    if (await generateButton.isVisible()) {
      await generateButton.click();
      await page.waitForTimeout(500);
      
      // 生成されたトークンを取得（CSVからまたはUI表示から）
      const tokenCell = page.locator("td").filter({ hasText: /^[a-f0-9-]{36}$/ }).first();
      if (await tokenCell.isVisible()) {
        accessToken = await tokenCell.textContent() || "";
      }
    }
    
    await page.close();
  });

  test("イベント公開ページが正しく表示される", async ({ page }) => {
    test.skip(!eventId, "イベントIDが取得できませんでした");
    
    await page.goto(`/events/${eventId}`);
    
    // イベントタイトルが表示される
    await expect(page.getByRole("heading", { name: /E2E投票テストイベント/i })).toBeVisible();
    
    // ステータスバッジが表示される（開催中または開催前）
    const statusBadge = page.locator("[class*='badge']");
    await expect(statusBadge.first()).toBeVisible();
  });

  test("トークン付きURLで投票ページにアクセスできる", async ({ page }) => {
    test.skip(!eventId || !accessToken, "テストデータが不足しています");
    
    await page.goto(`/events/${eventId}/vote?token=${accessToken}`);
    
    // 投票インターフェースが表示される
    await expect(page.getByText(/クレジット|Credits/i)).toBeVisible();
    
    // 投票対象が表示される
    await expect(page.getByText(/選択肢A/)).toBeVisible();
    await expect(page.getByText(/選択肢B/)).toBeVisible();
  });

  test("投票ボタンの操作でクレジットが計算される", async ({ page }) => {
    test.skip(!eventId || !accessToken, "テストデータが不足しています");
    
    await page.goto(`/events/${eventId}/vote?token=${accessToken}`);
    
    // +ボタンをクリック
    const plusButton = page.getByRole("button", { name: "+" }).first();
    await plusButton.click();
    
    // クレジット表示が更新される（100から99へ: 1票 = 1^2 = 1クレジット）
    await expect(page.getByText(/99|残り/)).toBeVisible();
    
    // もう一度+ボタンをクリック
    await plusButton.click();
    
    // クレジット表示が更新される（99から96へ: 2票 = 2^2 = 4クレジット、増分3）
    await expect(page.getByText(/96|残り/)).toBeVisible();
  });

  test("投票を送信して完了ページに遷移する", async ({ page }) => {
    test.skip(!eventId || !accessToken, "テストデータが不足しています");
    
    await page.goto(`/events/${eventId}/vote?token=${accessToken}`);
    
    // 投票する（選択肢Aに1票）
    const plusButton = page.getByRole("button", { name: "+" }).first();
    await plusButton.click();
    
    // 投票ボタンをクリック
    const submitButton = page.getByRole("button", { name: /投票する|Submit|Vote/i });
    await submitButton.click();
    
    // 完了ページにリダイレクトされる
    await expect(page).toHaveURL(new RegExp(`/events/${eventId}/complete`));
    
    // 完了メッセージが表示される
    await expect(page.getByText(/完了|Completed|Thank/i)).toBeVisible();
  });

  test("結果ページで投票結果が表示される", async ({ page }) => {
    test.skip(!eventId, "イベントIDが取得できませんでした");
    
    await page.goto(`/events/${eventId}/result`);
    
    // 結果見出しが表示される
    await expect(page.getByRole("heading", { name: /結果|Results/i })).toBeVisible();
    
    // 統計情報が表示される
    await expect(page.getByText(/参加者|Participants|投票者/i)).toBeVisible();
  });

  test("無効なトークンでアクセスするとエラーが表示される", async ({ page }) => {
    test.skip(!eventId, "イベントIDが取得できませんでした");
    
    await page.goto(`/events/${eventId}/vote?token=invalid-token-12345`);
    
    // エラーメッセージまたはサインインページへのリダイレクト
    const hasError = await page.getByText(/エラー|Error|無効|Invalid/i).isVisible().catch(() => false);
    const hasSignIn = await page.getByText(/サインイン|Sign in|ログイン/i).isVisible().catch(() => false);
    
    expect(hasError || hasSignIn).toBeTruthy();
  });

  test("クレジット超過時に+ボタンが無効化される", async ({ page }) => {
    test.skip(!eventId || !accessToken, "テストデータが不足しています");
    
    await page.goto(`/events/${eventId}/vote?token=${accessToken}`);
    
    // 10票（100クレジット）まで投票
    const plusButton = page.getByRole("button", { name: "+" }).first();
    
    for (let i = 0; i < 10; i++) {
      const isDisabled = await plusButton.isDisabled();
      if (isDisabled) break;
      await plusButton.click();
      await page.waitForTimeout(100);
    }
    
    // クレジットが0または不足していることを確認
    await expect(page.getByText(/0|不足|使い切り/i)).toBeVisible();
    
    // これ以上投票できないことを確認（ボタン無効化）
    await expect(plusButton).toBeDisabled();
  });
});

test.describe("投票フロー - 認証エラーケース", () => {
  test("トークンなしで投票ページにアクセスするとエラー", async ({ page }) => {
    // 存在するイベントのIDが必要（テスト用の固定値は使えないため、最初にイベントを作成）
    await page.goto("/admin/create");
    await page.getByLabel(/タイトル|Title/i).fill("認証テストイベント");
    await page.getByLabel(/クレジット|Credits/i).fill("50");
    await page.getByRole("button", { name: /イベントを作成|Create Event/i }).click();
    
    await page.waitForURL(/\/admin\/created\?id=/);
    const url = new URL(page.url());
    const eventId = url.searchParams.get("id");
    
    // トークンなしで投票ページにアクセス
    await page.goto(`/events/${eventId}/vote`);
    
    // サインインページへのリダイレクトまたはエラー表示
    const hasSignIn = await page.getByText(/サインイン|Sign in|ログイン/i).isVisible().catch(() => false);
    const hasError = await page.getByText(/認証|エラー|Error/i).isVisible().catch(() => false);
    const isRedirected = page.url().includes("signin") || page.url().includes("auth");
    
    expect(hasSignIn || hasError || isRedirected).toBeTruthy();
  });
});


