## 2024-05-24 - [Promise.any instead of sequential await in URL fallback loops]
**Learning:** Checking fallbacks like docker container hostname vs localhost sequentially adds massive timeout delays (e.g., 3s per failed request), especially for unresolvable hostnames outside the docker network.
**Action:** Use `Promise.any()` when checking arrays of fallback URLs to find the fastest valid connection in parallel, saving multiple seconds on failure paths.
