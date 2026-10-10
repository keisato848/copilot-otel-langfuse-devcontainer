## 2024-10-10 - Parallelize Health Endpoint Checks
**Learning:** Checking unresolvable Docker hostnames (e.g. `langfuse-web`) from outside the container network causes sequential 3000ms timeout delays.
**Action:** When implementing health checks or connecting to fallback URLs (e.g., Docker container hostnames vs localhost) in this codebase, use `Promise.any` to check the URLs in parallel.
