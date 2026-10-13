## 2023-10-12 - Parallel Health Checks for Docker Hostnames
**Learning:** In a devcontainer or docker-compose environment, unresolvable Docker hostnames (e.g., `langfuse-web`) outside the container network can cause long sequential timeout delays (3000ms each) when health checking multiple fallback URLs in a simple `for` loop.
**Action:** Use `Promise.any` when checking fallback URLs like `[docker-host, localhost]` to check them in parallel. This avoids blocking on the unresolvable host's timeout if `localhost` is healthy.
