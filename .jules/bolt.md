## 2024-10-24 - Parallel Fallback URL Checks
**Learning:** Sequential iteration over fallback URLs (`http://langfuse-web:3000`, `http://localhost:3000`) caused unnecessary 3-second timeout delays when running locally outside of the docker network where the primary hostname cannot be resolved or reached.
**Action:** Always use `Promise.any` when checking an array of alternative local/docker URLs. This codebase-specific pattern ensures the first reachable host returns immediately without blocking on unreachable container names.
