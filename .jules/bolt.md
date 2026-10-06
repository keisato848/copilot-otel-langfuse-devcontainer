## 2026-10-05 - Sequential Fallback Delays in Scripts
**Learning:** Sequential `for...of` loops over fallback URLs (like Docker service vs localhost) introduce significant blocking delays. If the first hostname is unresolvable or unreachable, the `fetch` timeout (often 3 seconds) must expire before the fallback is tried.
**Action:** Always use `Promise.any` when checking fallback hosts in parallel to avoid sequential timeout delays, especially in scripts dealing with devcontainers and Docker networks.
