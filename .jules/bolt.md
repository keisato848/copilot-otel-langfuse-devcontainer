## 2025-02-18 - Sequential Network Checks

**Learning:** When scripts verify multiple URLs (like Docker service hostnames vs localhost), using sequential `for...of` loops with `await` introduces significant timeout delays (~3000ms per failed host) if the script is run outside the container network (e.g., local VS Code).
**Action:** Use `Promise.any` to check network URLs in parallel, preventing sequential timeouts and reducing resolution time from >3000ms to <100ms.
