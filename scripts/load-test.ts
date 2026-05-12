/**
 * 大規模投票負荷テスト
 *
 * PoC前のサニティチェック用。N人が同時に投票するシナリオをシミュレートし、
 * 成功率・レイテンシ分布・エラー内訳を出力する。
 *
 * ## 使い方
 *
 * 1. 管理画面で個別投票方式のテストイベントを作成、N個のトークンを発行
 *    + adminToken をメモ(URLの ?token=xxx 部分)
 * 2. 管理画面の CSV エクスポートでトークン一覧を取得 → tokens.csv に保存
 * 3. Vercel の環境変数に `LOAD_TEST_ENABLED=true` を設定して再デプロイ
 * 4. このスクリプトを実行:
 *
 *    BASE_URL=https://qv-tool.vercel.app \
 *    EVENT=test-event-slug \
 *    ADMIN_TOKEN=xxx-yyy-zzz \
 *    TOKENS_CSV=./tokens.csv \
 *    CONCURRENCY=100 \
 *    npx tsx scripts/load-test.ts
 *
 * 5. テスト完了後、Vercel の `LOAD_TEST_ENABLED` を削除 / false に戻す
 *
 * ## 環境変数
 * - `BASE_URL` (必須): テスト対象のベース URL
 * - `EVENT` (必須): イベント ID または slug
 * - `ADMIN_TOKEN` (必須): event.adminToken
 * - `TOKENS_CSV` (必須): トークンが入った CSV ファイル (1列目が token)
 * - `CONCURRENCY` (任意, default=100): 同時並行数
 * - `RAMP_UP_MS` (任意, default=0): 開始時の段階的な ramp-up 時間
 */

import { promises as fs } from "node:fs";

interface Config {
  baseUrl: string;
  event: string;
  adminToken: string;
  tokensCsv: string;
  concurrency: number;
  rampUpMs: number;
}

interface VoteResult {
  token: string;
  ok: boolean;
  status: number;
  latencyMs: number;
  body: unknown;
  error?: string;
}

function readConfig(): Config {
  const baseUrl = process.env.BASE_URL;
  const event = process.env.EVENT;
  const adminToken = process.env.ADMIN_TOKEN;
  const tokensCsv = process.env.TOKENS_CSV;
  const concurrency = parseInt(process.env.CONCURRENCY ?? "100", 10);
  const rampUpMs = parseInt(process.env.RAMP_UP_MS ?? "0", 10);

  const missing: string[] = [];
  if (!baseUrl) missing.push("BASE_URL");
  if (!event) missing.push("EVENT");
  if (!adminToken) missing.push("ADMIN_TOKEN");
  if (!tokensCsv) missing.push("TOKENS_CSV");
  if (missing.length > 0) {
    console.error(`Missing env vars: ${missing.join(", ")}`);
    console.error("See scripts/load-test.ts header for usage.");
    process.exit(1);
  }

  return {
    baseUrl: baseUrl!.replace(/\/$/, ""),
    event: event!,
    adminToken: adminToken!,
    tokensCsv: tokensCsv!,
    concurrency,
    rampUpMs,
  };
}

async function readTokens(path: string): Promise<string[]> {
  const content = await fs.readFile(path, "utf-8");
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  // 1行目がヘッダー（"トークン" など）の場合はスキップ
  const looksLikeHeader = !/^[\w-]{8,}/.test(lines[0]?.split(",")[0] ?? "");
  const dataLines = looksLikeHeader ? lines.slice(1) : lines;
  const tokens = dataLines
    .map((line) => line.split(",")[0].replace(/^"|"$/g, "").trim())
    .filter((t) => t.length > 0);
  return tokens;
}

async function fetchSubjects(
  baseUrl: string,
  event: string,
  adminToken: string
): Promise<{ id: string }[]> {
  const url = `${baseUrl}/api/events/${encodeURIComponent(event)}/export?adminToken=${encodeURIComponent(adminToken)}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `Failed to fetch event subjects: ${res.status} ${await res.text()}`
    );
  }
  const data = (await res.json()) as { subjects: { id: string }[] };
  return data.subjects;
}

/** 候補ごとに 0〜3 票をランダムに振る (合計 cost が creditsPerVoter を超えない範囲) */
function generateRandomVote(
  subjects: { id: string }[],
  maxCredits = 100
): { subjectId: string; amount: number }[] {
  const result: { subjectId: string; amount: number }[] = [];
  let used = 0;
  // ランダムに並び替えて先頭から票を振る
  const shuffled = [...subjects].sort(() => Math.random() - 0.5);
  for (const subject of shuffled) {
    const remaining = maxCredits - used;
    if (remaining < 1) break;
    // 残クレジットから払える最大 amount を計算
    const maxAmount = Math.floor(Math.sqrt(remaining));
    const cap = Math.min(maxAmount, 5);
    const amount = Math.floor(Math.random() * (cap + 1)); // 0..cap
    if (amount > 0) {
      result.push({ subjectId: subject.id, amount });
      used += amount * amount;
    }
  }
  // すべて 0 だった場合は最初の候補に 1 票だけ入れる
  if (result.length === 0 && subjects.length > 0) {
    result.push({ subjectId: subjects[0].id, amount: 1 });
  }
  return result;
}

async function submitOne(
  config: Config,
  token: string,
  subjects: { id: string }[]
): Promise<VoteResult> {
  const details = generateRandomVote(subjects);
  const start = performance.now();
  try {
    const res = await fetch(`${config.baseUrl}/api/test/submit-vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adminToken: config.adminToken,
        eventSlugOrId: config.event,
        token,
        details,
      }),
    });
    const latencyMs = Math.round(performance.now() - start);
    const body = await res.json().catch(() => null);
    return {
      token,
      ok: res.ok && (body as { success?: boolean })?.success === true,
      status: res.status,
      latencyMs,
      body,
    };
  } catch (e) {
    return {
      token,
      ok: false,
      status: 0,
      latencyMs: Math.round(performance.now() - start),
      body: null,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(
    sorted.length - 1,
    Math.floor((p / 100) * sorted.length)
  );
  return sorted[idx];
}

async function main() {
  const config = readConfig();

  console.log("--- Load test ---");
  console.log(`Target:      ${config.baseUrl}`);
  console.log(`Event:       ${config.event}`);
  console.log(`Concurrency: ${config.concurrency}`);
  console.log(`Tokens file: ${config.tokensCsv}`);
  console.log();

  const tokens = await readTokens(config.tokensCsv);
  if (tokens.length === 0) {
    console.error("No tokens found in CSV.");
    process.exit(1);
  }
  console.log(`Loaded ${tokens.length} tokens`);

  console.log("Fetching subjects via export API...");
  const subjects = await fetchSubjects(
    config.baseUrl,
    config.event,
    config.adminToken
  );
  if (subjects.length === 0) {
    console.error("No subjects on event. Aborting.");
    process.exit(1);
  }
  console.log(`Event has ${subjects.length} subjects`);
  console.log();

  // 同時並行で投票送信
  const targets = tokens.slice(0, config.concurrency);
  console.log(`Firing ${targets.length} concurrent requests...`);
  const start = performance.now();

  // ramp-up: rampUpMs を targets.length で割って一定間隔で発火
  const results: VoteResult[] = await Promise.all(
    targets.map(async (token, i) => {
      if (config.rampUpMs > 0) {
        const delay = (config.rampUpMs / targets.length) * i;
        await new Promise((r) => setTimeout(r, delay));
      }
      return submitOne(config, token, subjects);
    })
  );

  const wallMs = Math.round(performance.now() - start);
  console.log(`Done in ${wallMs}ms wall time\n`);

  // 集計
  const successes = results.filter((r) => r.ok);
  const failures = results.filter((r) => !r.ok);
  const latencies = results.map((r) => r.latencyMs);

  console.log("--- Summary ---");
  console.log(`Total:    ${results.length}`);
  console.log(
    `Success:  ${successes.length} (${((successes.length / results.length) * 100).toFixed(1)}%)`
  );
  console.log(
    `Failure:  ${failures.length} (${((failures.length / results.length) * 100).toFixed(1)}%)`
  );
  console.log(`Wall:     ${wallMs}ms`);
  console.log(
    `Throughput: ${(results.length / (wallMs / 1000)).toFixed(1)} req/s`
  );
  console.log();

  console.log("--- Latency (ms) ---");
  console.log(`p50:  ${percentile(latencies, 50)}`);
  console.log(`p90:  ${percentile(latencies, 90)}`);
  console.log(`p95:  ${percentile(latencies, 95)}`);
  console.log(`p99:  ${percentile(latencies, 99)}`);
  console.log(`max:  ${Math.max(...latencies)}`);
  console.log();

  if (failures.length > 0) {
    console.log("--- Failure breakdown ---");
    const byStatus = new Map<string, number>();
    const samples = new Map<string, VoteResult>();
    for (const f of failures) {
      const key = f.error
        ? `network: ${f.error}`
        : `status ${f.status} ${
            (f.body as { error?: string })?.error ?? "(no error)"
          }`;
      byStatus.set(key, (byStatus.get(key) ?? 0) + 1);
      if (!samples.has(key)) samples.set(key, f);
    }
    for (const [key, count] of byStatus.entries()) {
      console.log(`  [${count}] ${key}`);
    }
    console.log();
    console.log("(First failure sample)");
    const first = failures[0];
    console.log(JSON.stringify(first, null, 2));
  }

  // 終了コード: 失敗が10%超なら 1
  process.exit(failures.length / results.length > 0.1 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
