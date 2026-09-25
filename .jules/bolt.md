## 2024-09-24 - Node.js Concurrent Network Checks
**Learning:** Sequential network checks (like checking fallback hosts) can introduce `O(N)` latency when previous hosts fail with a timeout.
**Action:** Use `Promise.any()` with mapped promises that explicitly throw on failure, transforming latency from `O(N)` down to `O(1)` while maintaining clear and safe fallback behavior when all endpoints are unhealthy.
