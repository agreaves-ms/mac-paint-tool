# Login Automation Prompt

Paste into Copilot chat:

---

```
Follow the playwright-automation-msedge SKILL.md. Use msedge, not chromium.

1. Read username and password from $env:APP_USERNAME and $env:APP_PASSWORD.
2. Open Edge browser (headed, persistent profile) and navigate to https://doc-integration.pfizer.com/
3. It will redirect to /login. Snapshot and find the "Enter Username" and "Enter Password" textboxes.
4. Fill username from $env:APP_USERNAME, fill password from $env:APP_PASSWORD.
5. Snapshot again — the "Log In" button should now be enabled (not disabled). Click it.
6. Wait up to 30 seconds. Take snapshot. Login SUCCEEDED if:
   - Page shows buttons like "Home", "Actions", "VM Operations", "CI Loop", etc.
   - No error text like "Sso Login Unsuccessful" or "Invalid credentials"
   If failed: screenshot, report error, stop.
7. Take screenshot and save as login.png. Close browser.
```
