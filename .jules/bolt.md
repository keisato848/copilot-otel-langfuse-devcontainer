## 2024-12-07 - Parallel Host Resolution Optimization
**Learning:** Sequential network health checks in scripts executed outside the container network result in 3000ms+ timeout delays when evaluating unreachable Docker container hostnames (like `http://langfuse-web:3000`) before reachable localhost URLs.
**Action:** Always use `Promise.any` when checking an array of fallback URLs for reachability/health in this codebase to process them in parallel and immediately return the first successful connection.
