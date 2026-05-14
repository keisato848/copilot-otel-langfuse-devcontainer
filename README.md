# Copilot OTel + Langfuse Dev Container Template

Copilot Chat の OpenTelemetry 出力を OTel Collector 経由で Langfuse に送り、ローカルダッシュボードと任意のリモート OTLP に同時転送するための汎用テンプレートです。

詳細な仕組み、ダッシュボードの見方、セットアップ、起動、検証、トラブルシュート、リモート転送、セッション証跡の手順は `docs/CopilotOtelLangfuseRunbook.md` を参照してください。

## 対応ランタイム

このテンプレートは Docker Desktop 固有の前提を置きません。以下のいずれかを用意してください。

- VS Code Dev Containers 拡張が接続できる Docker 互換 API
- `docker compose`
- `docker-compose`
- Rancher Desktop の `nerdctl compose`
- `podman compose`

Rancher Desktop を使う場合、dockerd モードでは通常 `docker compose` が使えます。containerd モードでは `nerdctl compose` を使い、必要に応じて `COPILOT_OTEL_COMPOSE_COMMAND="nerdctl compose"` を指定してください。

## 使い方

1. このテンプレートのファイルを対象リポジトリへコピーします。
2. `.env.example` を参考にします。実値入りの `.env` は `npm run otel:setup` が生成します。
3. VS Code で Dev Container として開きます。
4. `http://localhost:3000` の Langfuse ダッシュボードを確認します。
5. Copilot Chat Agent mode で会話し、Langfuse の project `copilot-otel` の Tracing / Traces を確認します。

Dev Container 起動時は以下が自動実行されます。

- 公式 Langfuse compose の取得
- `.env` の生成
- OTel Collector 設定の生成
- Langfuse ダッシュボードの起動待ち
- VS Code から `http://localhost:3000` を開く
- セッションごとの Markdown レポートとスクリーンショット生成

## 手動起動

Dev Container を使わずに起動する場合は、対象リポジトリのルートで以下を実行します。

```bash
npm run otel:setup
npm run otel:compose
export OTEL_EXPORTER_OTLP_HEADERS="$(sed -n 's/^OTEL_EXPORTER_OTLP_HEADERS=//p' .env)"
code .
npm run otel:start-session
```

Compose 互換 CLI を明示する場合は以下のように指定します。

```bash
COPILOT_OTEL_COMPOSE_COMMAND="nerdctl compose" npm run otel:compose
```

ログ確認など任意の compose サブコマンドも渡せます。

```bash
npm run otel:compose -- logs langfuse-web
npm run otel:compose -- ps
npm run otel:compose -- down
```

## リモート OTLP 転送

リモートにも同じトレースを送る場合は、未追跡 `.env` に以下を設定してから再起動します。

```env
OTEL_REMOTE_EXPORTER_OTLP_ENDPOINT=https://otel.example.com/v1/traces
OTEL_REMOTE_AUTH_HEADER=Bearer xxxxx
```

送信経路は以下です。

```text
Copilot Chat -> OTel Collector (:4318) -> Local Langfuse (:3000)
                                      -> optional remote OTLP
```

## セッション証跡

`npm run otel:start-session` または Dev Container の `postStartCommand` により、Langfuse ダッシュボードの状態が Markdown とスクリーンショットで保存されます。出力先はコピー先リポジトリの `docs/04_reports/otel-sessions/` です。

## npm scripts

- `npm run otel:setup`: Langfuse compose、`.env`、OTel Collector 設定を生成します。
- `npm run otel:compose`: Compose 互換 CLI を検出し、Langfuse / OTel Collector スタックを操作します。
- `npm run otel:start-session`: Langfuse 起動確認、ダッシュボード表示、セッションレポート生成を実行します。
- `npm run otel:verify`: Langfuse / OTel Collector / OTel 環境変数を確認します。
- `npm run otel:report`: 現在の Langfuse ダッシュボード状態をセッションレポートとして保存します。

## プライベートリポジトリ化

GitHub CLI を使える環境では、以下で private repository を作成して push できます。

```bash
gh repo create <owner>/copilot-otel-langfuse-devcontainer --private --source . --remote origin --push
```

GitHub CLI を使わない場合は、GitHub 上で private repository を作成してから以下を実行します。

```bash
git remote add origin git@github.com:<owner>/copilot-otel-langfuse-devcontainer.git
git push -u origin main
```

## 注意

`github.copilot.chat.otel.captureContent=true` と `COPILOT_OTEL_CAPTURE_CONTENT=true` は、プロンプト、応答、ツール引数をトレースに含めます。シークレット、個人情報、本番データを含む会話では使用せず、ローカルまたは信頼済み環境でのみ有効化してください。
