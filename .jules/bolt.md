
## 2023-10-25 - Parallel Health Checks with Promise.any
**Learning:** Sequential connection attempts (e.g., using `for...of` loops) with timeout mechanisms can cause significant delays (3000ms+ per unreachable host) when trying to resolve internal Docker network hostnames while running scripts externally (like from the host machine or a different container context). This degrades developer experience and script execution performance.
**Action:** Always use `Promise.any` to check health and reachability of multiple fallback URLs in parallel. This completely avoids cumulative timeout delays while retaining fallback robustness.
