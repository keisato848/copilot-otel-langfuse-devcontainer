## 2023-11-20 - Promise.any for Faster Fallback URL Checks
**Learning:** Sequential connection timeouts block script execution unnecessarily when probing container vs localhost endpoints across networks.
**Action:** Use Promise.any() to race multiple healthcheck/reachability fetches in parallel instead of checking them one by one.
