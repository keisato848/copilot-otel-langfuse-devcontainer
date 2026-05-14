# Copilot OTel / Langfuse 汎用テンプレート手順書

## 1. 目的

このテンプレートは、VS Code Copilot Chat の OpenTelemetry 出力を OTel Collector 経由でローカル Langfuse に送り、必要に応じて同じデータを Remote OTLP にも転送するための汎用 devcontainer テンプレートである。

本書は、テンプレートを任意のリポジトリへコピーした後に、仕組みを理解し、ダッシュボードを読み、セットアップ、起動、検証、トラブルシュート、リモート転送、セッション証跡生成を行うための手順をまとめる。

---

## 2. PM 整理 (Phase 0-3)

| Phase | 整理内容 |
|------|------|
| Phase 0 受付 | OTel + Langfuse の仕組みと手順をテンプレート利用者向けの日本語ドキュメントとして残す |
| Phase 1 要件 | 利用者が devcontainer または手動起動で Langfuse を立ち上げ、Copilot Chat の trace を確認し、証跡を保存できる |
| Phase 2 基本設計 | Copilot Chat -> OTel Collector -> Local Langfuse、任意で Remote OTLP へ転送する。秘密値は `.env` に保持し、コミットしない |
| Phase 3 詳細設計・WBS | README と本手順書を正本にし、テンプレートコピー後の操作・検証・トラブル対応を明記する。コード変更は行わない |

### 2.1 影響領域

| 領域 | 影響 |
|------|------|
| Docs | README と本手順書を更新する |
| DevContainer | 既存 `.devcontainer` 構成の使い方を説明する |
| Observability | Copilot Chat OTel、OTel Collector、Langfuse、Remote OTLP の見方を説明する |
| Security | `captureContent`、`.env`、Remote 認証ヘッダーの扱いを明記する |
| Test / Evidence | E2E ではなく、OTel セッション証跡の生成確認を対象にする |

### 2.2 更新すべき文書

| 文書 | 役割 |
|------|------|
| `README.md` | テンプレートの入口と本手順書への導線 |
| `docs/CopilotOtelLangfuseRunbook.md` | 仕組み、操作、検証、トラブルシュートの正本 |
| `langfuse/README.md` | Langfuse ローカル監視の補足 |
| `otel-collector/README.md` | Collector 転送設定の補足 |

### 2.3 検証観点

- `npm run otel:setup` で `.env`、`langfuse/docker-compose.yml`、`otel-collector/generated/config.yml` が生成されること
- `npm run otel:compose` で Langfuse と OTel Collector が起動すること
- `npm run otel:verify` で Langfuse health、Collector 到達性、環境変数を確認できること
- `http://localhost:3000` の Langfuse UI で project `copilot-otel` の Tracing を確認できること
- Copilot Chat Agent mode で会話した後、Langfuse に trace / span が表示されること
- `npm run otel:report` または `npm run otel:start-session` で `docs/04_reports/otel-sessions/` に Markdown とスクリーンショットが生成されること

### 2.4 E2E 証跡要否

このテンプレートはアプリケーション UI を変更しないため、Playwright E2E エビデンス報告書は不要である。

ただし、OTel / Langfuse の起動確認を行った場合は、`docs/04_reports/otel-sessions/` のセッションレポートとスクリーンショットを OTel 監視の証跡として残す。

---

## 3. 仕組み

```text
VS Code Copilot Chat
  -> OTLP HTTP
  -> OTel Collector (:4318)
  -> Local Langfuse (/api/public/otel)
  -> optional Remote OTLP
```

| コンポーネント | 役割 |
|------|------|
| Copilot Chat | VS Code 設定に従い、会話・ツール実行の telemetry を OTLP HTTP で送信する |
| OTel Collector | Copilot から受けたデータをローカル Langfuse と任意の Remote OTLP へ転送する |
| Langfuse | project `copilot-otel` で trace を保存・表示するローカルダッシュボード |
| `.env` | Langfuse 初期ユーザー、project key、OTLP Authorization、Remote OTLP 設定を保持する未追跡ファイル |
| セッションレポート | Langfuse health、OTLP endpoint、Remote 転送有無、ダッシュボード画像を Markdown に残す |

### 3.1 devcontainer と手動起動の違い

| 起動方式 | Copilot OTLP endpoint | 主な設定元 |
|------|------|------|
| devcontainer | `http://otel-collector:4318` | `.devcontainer/devcontainer.json` と compose network |
| 手動起動 | `http://localhost:4318` | `.vscode/settings.json` とローカル port forward |

---

## 4. セットアップ

### 4.1 前提

- Node.js と npm が利用できること
- VS Code と GitHub Copilot / Copilot Chat 拡張が利用できること
- Docker Desktop、Rancher Desktop、Podman など、Compose 互換 CLI が利用できること
- `docker compose`、`docker-compose`、`nerdctl compose`、`podman compose` のいずれかが実行できること

Compose コマンドを明示する場合は以下を使う。

```bash
COPILOT_OTEL_COMPOSE_COMMAND="nerdctl compose" npm run otel:compose
```

### 4.2 テンプレートのコピー

対象リポジトリに以下をコピーする。

```text
.devcontainer/
.vscode/
langfuse/
otel-collector/
scripts/
docs/
.env.example
package.json
README.md
```

既存の `package.json` がある場合は、以下の scripts を統合する。

```json
{
  "otel:setup": "node scripts/setup-copilot-otel.mjs",
  "otel:compose": "node scripts/run-copilot-otel-compose.mjs",
  "otel:start-session": "node scripts/start-copilot-otel-session.mjs",
  "otel:verify": "node scripts/verify-copilot-otel.mjs",
  "otel:report": "node scripts/capture-copilot-otel-session.mjs"
}
```

### 4.3 devcontainer 起動

VS Code で対象リポジトリを Dev Container として開く。

起動時に以下が自動実行される。

1. `scripts/setup-copilot-otel.mjs` が Langfuse compose、`.env`、Collector 設定を生成する
2. compose が Langfuse と OTel Collector を起動する
3. `scripts/start-copilot-otel-session.mjs` が Langfuse health を待つ
4. `http://localhost:3000` の Langfuse UI を開く
5. `docs/04_reports/otel-sessions/` にセッションレポートを生成する

### 4.4 手動起動

Dev Container を使わない場合は、対象リポジトリのルートで以下を実行する。

```bash
npm run otel:setup
npm run otel:compose
export OTEL_EXPORTER_OTLP_HEADERS="$(sed -n 's/^OTEL_EXPORTER_OTLP_HEADERS=//p' .env)"
code .
npm run otel:start-session
```

PowerShell では以下を使う。

```powershell
$env:OTEL_EXPORTER_OTLP_HEADERS = (Select-String -Path .env -Pattern '^OTEL_EXPORTER_OTLP_HEADERS=').Line -replace '^OTEL_EXPORTER_OTLP_HEADERS=', ''
code .
npm run otel:start-session
```

---

## 5. 起動・停止・ログ確認

| 操作 | コマンド |
|------|------|
| 起動 | `npm run otel:compose` |
| 状態確認 | `npm run otel:compose -- ps` |
| Langfuse ログ | `npm run otel:compose -- logs langfuse-web` |
| Collector ログ | `npm run otel:compose -- logs otel-collector` |
| 停止 | `npm run otel:compose -- down` |
| 再生成 | `npm run otel:setup` |

---

## 6. Langfuse ダッシュボードの見方

### 6.1 アクセス

- URL: `http://localhost:3000`
- 初期 project: `copilot-otel`
- 初期ユーザー: `.env` の `LANGFUSE_INIT_USER_EMAIL`
- 初期パスワード: `.env` の `LANGFUSE_INIT_USER_PASSWORD`

自動生成直後の既定値は以下である。

```text
email: dev@example.com
password: changeme123
project: copilot-otel
```

### 6.2 確認順

1. Langfuse にログインする
2. project `copilot-otel` を開く
3. Tracing / Traces の一覧を開く
4. Time range を直近に絞る
5. VS Code で Copilot Chat Agent mode の会話を 1 回実行する
6. trace が増えることを確認する
7. trace を開き、span の duration、metadata、input / output、error を確認する

### 6.3 見るポイント

| 観点 | 判断 |
|------|------|
| trace がある | Copilot Chat -> Collector -> Langfuse の経路が成立している |
| span が並ぶ | 会話やツール実行の内部ステップを追える |
| duration が長い | 待ち時間や遅い処理の候補になる |
| input / output が見える | `captureContent=true` の場合のみ内容が記録されている |
| error がある | Copilot 側、Collector、転送先のいずれかで異常が起きている可能性がある |

---

## 7. 検証手順

### 7.1 health と到達性

```bash
npm run otel:verify
```

期待結果は以下である。

- Langfuse が `OK` になる
- OTel Collector が到達可能になる
- OTel 関連環境変数が表示される
- 秘密値は `[redacted]` として表示される

### 7.2 trace 生成

1. VS Code で Copilot Chat Agent mode を開く
2. 短い依頼を送る
3. Langfuse の Traces 一覧を更新する
4. 直近時刻の trace が表示されることを確認する

### 7.3 セッション証跡生成

```bash
npm run otel:report
```

または以下を実行する。

```bash
npm run otel:start-session
```

出力先は以下である。

```text
docs/04_reports/otel-sessions/{timestamp}_langfuse-session.md
docs/04_reports/otel-sessions/{timestamp}_langfuse-dashboard.png
```

---

## 8. Remote OTLP 転送

リモートにも同じ trace を送る場合は、未追跡 `.env` に以下を設定する。

```env
OTEL_REMOTE_EXPORTER_OTLP_ENDPOINT=https://otel.example.com/v1/traces
OTEL_REMOTE_AUTH_HEADER=Bearer xxxxx
```

設定後に再起動する。

```bash
npm run otel:compose -- down
npm run otel:setup
npm run otel:compose
```

確認は Collector ログで行う。

```bash
npm run otel:compose -- logs otel-collector
```

注意事項は以下である。

- `.env` はコミットしない
- `OTEL_REMOTE_AUTH_HEADER` をログや PR に貼らない
- 外部 Remote OTLP へ `captureContent=true` の内容を送ってよいか事前に確認する

---

## 9. トラブルシュート

| 症状 | 主な原因 | 確認・対応 |
|------|------|------|
| Langfuse が開かない | compose 未起動、port 3000 競合、初期化未完了 | `npm run otel:compose -- ps`、`npm run otel:compose -- logs langfuse-web` を確認する |
| Collector に届かない | port 4318 競合、Collector 設定未生成、compose 起動失敗 | `npm run otel:setup`、`npm run otel:compose -- logs otel-collector` を確認する |
| Traces が空 | Copilot OTel が無効、endpoint 不一致、ヘッダー未設定、会話未実行 | VS Code 設定、`OTEL_EXPORTER_OTLP_HEADERS`、endpoint を確認し、新しい Copilot 会話を実行する |
| 401 / 403 が出る | Langfuse project key と Authorization が不一致 | `.env` の project key と `OTEL_LANGFUSE_AUTH_HEADER` を確認する |
| Remote OTLP に届かない | endpoint / auth / outbound network の問題 | Remote 設定と Collector ログを確認する |
| スクリーンショットがない | Langfuse health 失敗、Playwright / Chromium 起動失敗 | `npm run otel:verify` の後に `npm run otel:report` を再実行する |
| `.env` が不整合 | 以前の値が残っている | 必要な値を退避したうえで `.env` を作り直し、`npm run otel:setup` を再実行する |

---

## 10. セキュリティ運用

- `github.copilot.chat.otel.captureContent=true` と `COPILOT_OTEL_CAPTURE_CONTENT=true` は、プロンプト、応答、ツール引数を trace に含める
- シークレット、個人情報、本番データ、顧客データを含む会話では有効化しない
- `.env`、Remote OTLP の認証ヘッダー、Langfuse の secret key はコミットしない
- セッションレポートやスクリーンショットを共有する前に、秘密情報が含まれていないか確認する
- 外部 Remote OTLP へ転送する場合は、会話内容の送信可否を事前に合意する
