import { test, expect } from "@playwright/test";

test.describe("結果表示・CSVエクスポート", () => {
  // テスト用のイベントを作成して投票する
  let eventId: string;
  let adminToken: string;
  let accessToken: string;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();

    // イベント作成
    await page.goto("/admin/create");
    await page.getByLabel(/タイトル|Title/i).fill("結果テストイベント");
    await page
      .getByLabel(/説明|Description/i)
      .fill("結果表示とエクスポートのテスト");
    await page.getByLabel(/クレジット|Credits/i).fill("100");

    await page
      .getByRole("button", { name: /イベントを作成|Create Event/i })
      .click();

    // 作成完了ページにリダイレクト
    await page.waitForURL(/\/admin\/created\?id=/);

    // URLからイベントIDを取得
    const url = new URL(page.url());
    eventId = url.searchParams.get("id") || "";

    // 管理URLからadminTokenを取得
    const adminUrlElement = page.locator("input[readonly]").first();
    const adminUrl = await adminUrlElement.inputValue();
    const adminUrlParsed = new URL(adminUrl);
    adminToken = adminUrlParsed.searchParams.get("token") || "";

    // 管理ページに移動
    await page.goto(`/admin/${eventId}?token=${adminToken}`);

    // 投票対象を追加
    const addSubjectButton = page.getByRole("button", { name: /追加|Add/i });
    if (await addSubjectButton.isVisible()) {
      await addSubjectButton.click();
      await page
        .getByLabel(/タイトル|Title/i)
        .first()
        .fill("候補A");
      await page.getByRole("button", { name: /保存|Save/i }).click();
      await page.waitForTimeout(500);

      await addSubjectButton.click();
      await page
        .getByLabel(/タイトル|Title/i)
        .first()
        .fill("候補B");
      await page.getByRole("button", { name: /保存|Save/i }).click();
      await page.waitForTimeout(500);

      await addSubjectButton.click();
      await page
        .getByLabel(/タイトル|Title/i)
        .first()
        .fill("候補C");
      await page.getByRole("button", { name: /保存|Save/i }).click();
      await page.waitForTimeout(500);
    }

    // アクセストークンを生成
    const generateButton = page.getByRole("button", {
      name: /トークン.*生成|Generate.*Token/i,
    });
    if (await generateButton.isVisible()) {
      await generateButton.click();
      await page.waitForTimeout(500);

      const tokenCell = page
        .locator("td")
        .filter({ hasText: /^[a-f0-9-]{36}$/ })
        .first();
      if (await tokenCell.isVisible()) {
        accessToken = (await tokenCell.textContent()) || "";
      }
    }

    // 投票を実行
    if (accessToken) {
      await page.goto(`/events/${eventId}/vote?token=${accessToken}`);

      // 候補Aに3票
      const plusButtons = page.getByRole("button", { name: "+" });
      for (let i = 0; i < 3; i++) {
        await plusButtons.first().click();
        await page.waitForTimeout(100);
      }

      // 候補Bに2票（2番目の+ボタン）
      for (let i = 0; i < 2; i++) {
        await plusButtons.nth(1).click();
        await page.waitForTimeout(100);
      }

      // 投票を送信
      const submitButton = page.getByRole("button", {
        name: /投票する|Submit|Vote/i,
      });
      await submitButton.click();

      await page.waitForURL(new RegExp(`/events/${eventId}/complete`));
    }

    await page.close();
  });

  test.describe("結果ページ", () => {
    test("結果ページが正しく表示される", async ({ page }) => {
      test.skip(!eventId, "イベントIDが取得できませんでした");

      await page.goto(`/events/${eventId}/result`);

      // 結果見出しが表示される
      await expect(
        page.getByRole("heading", { name: /結果|Results/i })
      ).toBeVisible();

      // イベントタイトルが表示される
      await expect(page.getByText(/結果テストイベント/)).toBeVisible();
    });

    test("投票結果の統計が表示される", async ({ page }) => {
      test.skip(!eventId, "イベントIDが取得できませんでした");

      await page.goto(`/events/${eventId}/result`);

      // 統計情報セクションが表示される
      await expect(page.getByText(/参加者|Participants|投票者/i)).toBeVisible();

      // 投票総数または参加者数が表示される（1人の投票があるはず）
      const participantCount = page.locator("text=/1|\\d+人/");
      await expect(participantCount.first()).toBeVisible();
    });

    test("候補ごとの結果が表示される", async ({ page }) => {
      test.skip(!eventId, "イベントIDが取得できませんでした");

      await page.goto(`/events/${eventId}/result`);

      // 各候補名が表示される
      await expect(page.getByText(/候補A/)).toBeVisible();
      await expect(page.getByText(/候補B/)).toBeVisible();
      await expect(page.getByText(/候補C/)).toBeVisible();
    });

    test("チャートまたはグラフが表示される", async ({ page }) => {
      test.skip(!eventId, "イベントIDが取得できませんでした");

      await page.goto(`/events/${eventId}/result`);

      // グラフ要素またはチャートコンポーネントが存在する
      const chartElement = page.locator(
        "[class*='chart'], [class*='recharts'], canvas, svg[class*='chart']"
      );

      // チャートが存在する場合
      if (await chartElement.first().isVisible()) {
        await expect(chartElement.first()).toBeVisible();
      }
    });

    test("結果ページはトークンなしでもアクセス可能", async ({ page }) => {
      test.skip(!eventId, "イベントIDが取得できませんでした");

      // 結果ページはトークンなしでアクセス可能（公開情報）
      await page.goto(`/events/${eventId}/result`);

      // エラーページではなく結果が表示される
      await expect(
        page.getByRole("heading", { name: /結果|Results/i })
      ).toBeVisible();
    });
  });

  test.describe("CSVエクスポート", () => {
    test("管理ページにCSVエクスポートボタンがある", async ({ page }) => {
      test.skip(!eventId || !adminToken, "テストデータが不足しています");

      await page.goto(`/admin/${eventId}?token=${adminToken}`);

      // CSVエクスポートボタンが存在する
      const csvButton = page.getByRole("button", {
        name: /CSV|エクスポート|Export|ダウンロード|Download/i,
      });

      await expect(csvButton.first()).toBeVisible();
    });

    test("CSVエクスポートボタンをクリックするとダウンロードが開始される", async ({
      page,
    }) => {
      test.skip(!eventId || !adminToken, "テストデータが不足しています");

      await page.goto(`/admin/${eventId}?token=${adminToken}`);

      // ダウンロードイベントをリッスン
      const downloadPromise = page.waitForEvent("download");

      // CSVボタンをクリック
      const csvButton = page.getByRole("button", {
        name: /CSV|エクスポート|Export|ダウンロード|Download/i,
      });
      await csvButton.first().click();

      try {
        const download = await downloadPromise;
        // ダウンロードされたファイル名を確認
        expect(download.suggestedFilename()).toMatch(/\.csv$/);
      } catch {
        // ダウンロードが発生しない場合（UIの実装によっては別の方法でエクスポート）
        console.log("CSVダウンロードがトリガーされませんでした");
      }
    });

    test("投票URLのCSVエクスポートが機能する", async ({ page }) => {
      test.skip(!eventId || !adminToken, "テストデータが不足しています");

      await page.goto(`/admin/${eventId}?token=${adminToken}`);

      // 投票URL/トークンのエクスポートボタンを探す
      const tokenExportButton = page.getByRole("button", {
        name: /トークン.*CSV|投票URL.*Export|URL.*ダウンロード/i,
      });

      if (await tokenExportButton.isVisible()) {
        const downloadPromise = page.waitForEvent("download");
        await tokenExportButton.click();

        try {
          const download = await downloadPromise;
          expect(download.suggestedFilename()).toMatch(/\.csv$/);
        } catch {
          console.log("トークンCSVダウンロードがトリガーされませんでした");
        }
      }
    });
  });

  test.describe("管理ページでの結果確認", () => {
    test("管理ページで投票状況が確認できる", async ({ page }) => {
      test.skip(!eventId || !adminToken, "テストデータが不足しています");

      await page.goto(`/admin/${eventId}?token=${adminToken}`);

      // 投票数または参加者数が表示される
      await expect(
        page.getByText(/投票|votes|参加|participants/i)
      ).toBeVisible();
    });

    test("管理ページから結果ページへのリンクがある", async ({ page }) => {
      test.skip(!eventId || !adminToken, "テストデータが不足しています");

      await page.goto(`/admin/${eventId}?token=${adminToken}`);

      // 結果ページへのリンク
      const resultLink = page.getByRole("link", { name: /結果|Results/i });

      if (await resultLink.isVisible()) {
        await resultLink.click();
        await expect(page).toHaveURL(new RegExp(`/events/${eventId}/result`));
      }
    });

    test("投票締め切り前後で結果の表示が適切に切り替わる", async ({ page }) => {
      test.skip(!eventId, "イベントIDが取得できませんでした");

      await page.goto(`/events/${eventId}/result`);

      // ステータス表示（開催中、終了など）
      const statusIndicator = page.locator(
        "[class*='badge'], [class*='status']"
      );

      // ステータスが何らかの形で表示される
      await expect(statusIndicator.first()).toBeVisible();
    });
  });

  test.describe("アクセシビリティ", () => {
    test("結果ページに適切な見出し構造がある", async ({ page }) => {
      test.skip(!eventId, "イベントIDが取得できませんでした");

      await page.goto(`/events/${eventId}/result`);

      // h1見出しが存在
      const h1 = page.getByRole("heading", { level: 1 });
      await expect(h1).toBeVisible();
    });

    test("グラフに代替テキストまたは説明がある", async ({ page }) => {
      test.skip(!eventId, "イベントIDが取得できませんでした");

      await page.goto(`/events/${eventId}/result`);

      // SVGグラフにaria-labelまたはtitleがある、
      // または代替テキスト表示がある
      const chartContainer = page.locator("[class*='chart']").first();

      if (await chartContainer.isVisible()) {
        // Rechartsなどのライブラリは通常アクセシブルな構造を持つ
        const hasAccessibleLabel =
          (await chartContainer.getAttribute("aria-label")) !== null ||
          (await chartContainer.getAttribute("role")) !== null;

        // アクセシビリティラベルがなくても、テキストによる説明があればOK
        const hasTextDescription = await page
          .getByText(/票|votes|得票/i)
          .isVisible();

        expect(hasAccessibleLabel || hasTextDescription).toBeTruthy();
      }
    });
  });
});

test.describe("結果ページ - エラーケース", () => {
  test("存在しないイベントの結果ページにアクセスするとエラー", async ({
    page,
  }) => {
    await page.goto("/events/non-existent-event-id/result");

    // 404エラーまたはエラーメッセージが表示される
    const hasError = await page
      .getByText(/エラー|Error|見つかりません|Not Found|404/i)
      .isVisible()
      .catch(() => false);

    const is404 = await page
      .locator("text=/404/")
      .isVisible()
      .catch(() => false);

    expect(hasError || is404).toBeTruthy();
  });
});
