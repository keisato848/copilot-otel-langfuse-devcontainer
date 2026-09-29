#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dashboardUrl = process.env.COPILOT_OTEL_DASHBOARD_URL || 'http://localhost:3000';
const healthHosts = ['http://langfuse-web:3000', 'http://localhost:3000'];
const maxAttempts = 60;
const intervalMs = 5000;

function sleep(ms) {
  return new Promise(resolveSleep => setTimeout(resolveSleep, ms));
}

// ⚡ Bolt: Use Promise.any to check all hosts concurrently.
// This prevents unreachable hosts (like docker hostnames outside dev container)
// from blocking the start script with timeouts (saving up to 3 seconds per attempt).
async function findFirstHealthyHost(hosts) {
  const globalController = new AbortController();
  try {
    const readyHost = await Promise.any(
      hosts.map(async host => {
        const timeout = setTimeout(() => globalController.abort(), 3000);
        try {
          const response = await fetch(`${host}/api/public/health`, { signal: globalController.signal });
          if (response.ok) return host;
          throw new Error('Not healthy');
        } finally {
          clearTimeout(timeout);
        }
      })
    );
    globalController.abort(); // Cancel pending requests as soon as one succeeds
    return readyHost;
  } catch {
    return '';
  }
}

function openDashboard() {
  if (process.env.COPILOT_OTEL_AUTO_OPEN === 'false') {
    return;
  }

  const candidates = [
    process.env.VSCODE_CLI_PATH,
    '/vscode/vscode-server/bin/linux-x64/8b640eef5a6c6089c029249d48efa5c99adf7d51/bin/remote-cli/code',
    'code',
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (candidate.includes('/') && !existsSync(candidate)) {
      continue;
    }
    const result = spawnSync(candidate, ['--open-url', dashboardUrl], { stdio: 'ignore' });
    if (result.status === 0) {
      console.log(`[otel-session] Langfuse ダッシュボードを開きました: ${dashboardUrl}`);
      return;
    }
  }

  console.warn(`[otel-session] VS Code CLI でダッシュボードを開けませんでした。手動で開いてください: ${dashboardUrl}`);
}

console.log('[otel-session] Langfuse 起動を確認します。');
let readyHost = '';
for (let attempt = 0; attempt < maxAttempts && !readyHost; attempt += 1) {
  readyHost = await findFirstHealthyHost(healthHosts);
  if (!readyHost) {
    await sleep(intervalMs);
  }
}

if (readyHost) {
  console.log(`[otel-session] Langfuse は起動しています: ${readyHost}`);
  openDashboard();
} else {
  console.warn('[otel-session] WARNING: Langfuse に到達できません。');
}

spawnSync(process.execPath, [resolve(root, 'scripts/capture-copilot-otel-session.mjs'), '--source', 'postStart'], {
  cwd: root,
  stdio: 'inherit',
});
