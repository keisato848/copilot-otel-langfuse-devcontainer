
## 2024-05-18 - [Optimize health checks with Promise.any]
**Learning:** Sequential health checks that try unresolvable network hosts (like docker container hostnames from a host machine network) accumulate massive timeout delays (e.g., 3s + 3s = 6s) before failing or trying localhost.
**Action:** Use `Promise.any` to check connection endpoints in parallel for faster health resolution and avoiding blocking timeouts.
