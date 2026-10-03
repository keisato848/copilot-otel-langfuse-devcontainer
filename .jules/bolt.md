## 2024-10-02 - Sequential Docker Hostname Timeouts
**Learning:** Checking fallback URLs (e.g., Docker container hostnames vs localhost) sequentially using `for...of` loops causes unnecessary delays due to timeout waiting (up to 3 seconds per unreachable host) when the script is run outside the container network where Docker hostnames don't resolve.
**Action:** Always use `Promise.any()` when checking fallback URLs or performing health checks across multiple hostnames in this codebase. This allows checks to run in parallel, avoiding unresolvable hostname timeout delays.
