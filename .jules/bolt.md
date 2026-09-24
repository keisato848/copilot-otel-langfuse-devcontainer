## 2023-10-24 - Speed up health checks using Promise.any
**Learning:** Sequential `await fetch` checks over an array of fallback hosts (like primary + fallback URLs) are an anti-pattern when trying to failover quickly, because a slow failure on the primary blocks the check for the fallback. In this codebase, health check fetch operations timeout after 3 seconds.
**Action:** Use `Promise.any` to check all fallback hosts concurrently, immediately succeeding as soon as any one host responds successfully, saving multiple seconds of blocked execution.
