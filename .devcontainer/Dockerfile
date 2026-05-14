# Copilot OTel / Langfuse 検証用 devcontainer。
# Node.js 24 系とセッション証跡用の軽量 CLI を追加する。
FROM mcr.microsoft.com/devcontainers/javascript-node:24-bookworm

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl jq ca-certificates chromium \
    && rm -rf /var/lib/apt/lists/*