## 2026-09-25 - Promise.any for concurrent polling
**Learning:** Sequential polling loops (`for...of` with `await fetch()`) can significantly delay startup scripts if the first host in the list is unreachable and takes time to time out.
**Action:** Use `Promise.any` with an array of mapped async health check functions to poll all hosts concurrently, returning the first healthy one instantly instead of waiting for timeouts sequentially.
