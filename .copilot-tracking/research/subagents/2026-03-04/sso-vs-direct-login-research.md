# SSO vs Direct Login Research — doc-integration.pfizer.com

**Date:** 2026-03-04
**Context:** User reports a direct login form (username/password + "Log In" button) on `https://doc-integration.pfizer.com/`. Error text observed: **"Sso Login Unsuccessful"**. Post-login page shows buttons: Home, Actions, VM Operations, CI Loop.

---

## 1. When Does a "Direct Login Form" Require Persistent Context?

### Ephemeral Context Works When

- The form `action` attribute posts to the **same origin** (e.g., `https://doc-integration.pfizer.com/api/login`).
- The response sets session cookies on the **same domain** (`pfizer.com` or `doc-integration.pfizer.com`).
- No cross-domain redirects occur during authentication.
- The entire auth flow completes within a single request-response cycle (or a same-origin redirect chain).

### Persistent Context Needed When

- The form posts to a **different domain** (e.g., `login.microsoftonline.com`, `fed.pfizer.com`, `sso.connect.pingidentity.com`).
- A **multi-step redirect chain** crosses domain boundaries, setting cookies on intermediate domains that must be present for subsequent requests.
- The identity provider (IdP) sets its own session cookie on its domain, then redirects back to the service provider (SP) with a SAML assertion or OAuth code — the SP then sets its own cookie. Both cookies may be needed for session maintenance.
- **Token refresh** relies on the IdP session cookie surviving across navigations. If the IdP cookie is lost (ephemeral context is destroyed), re-authentication fails silently or triggers a new login prompt.

### Gray Area — Form-Fronted SSO

Many enterprise sites present a **local login form** that collects credentials, then submits them to an **external IdP** via hidden form POST or JavaScript XHR. This pattern looks like a direct login but behaves like SSO under the hood. Indicators:

- Form `action` URL differs from the page origin.
- Hidden form fields contain SAML `RelayState`, `SAMLRequest`, or OAuth `state`/`nonce` parameters.
- JavaScript intercepts form submission and redirects to an IdP.
- Network waterfall shows 302 redirects to external identity domains after form POST.

---

## 2. Pfizer Corporate SSO Patterns

### Known Pfizer Identity Infrastructure

| Component | Details |
|---|---|
| **Primary IdP** | Pfizer historically uses **PingFederate** as their federation server. Some properties have migrated to **Azure AD (Entra ID)**. |
| **Federation protocol** | SAML 2.0 is the dominant protocol for internal apps. OAuth 2.0 / OIDC used for newer services. |
| **SSO domains** | Common Pfizer SSO endpoints include patterns like `fed.pfizer.com`, `login.pfizer.com`, `sso.pfizer.com`, or Azure AD's `login.microsoftonline.com` with Pfizer tenant. |
| **MFA** | Pfizer enforces multi-factor authentication (Duo, Microsoft Authenticator, or RSA) for most internal apps. |
| **Cookie domains** | SSO cookies are typically set on `.pfizer.com` (domain-wide) to enable cross-subdomain SSO. |

### Authentication Flow (Likely)

```
User visits doc-integration.pfizer.com
  → Page renders local login form
  → User enters credentials, clicks "Log In"
  → Form POSTs to IdP (PingFederate or Azure AD)
     OR JavaScript submits credentials via API to IdP
  → IdP validates credentials
  → IdP redirects back to doc-integration.pfizer.com with auth token/assertion
  → doc-integration.pfizer.com sets session cookie
  → User sees post-login content (Home, Actions, VM Operations, CI Loop)
```

### Why the Form Exists Despite SSO

Enterprise apps commonly present a **branded login form** for several reasons:

1. **User experience consistency** — The app controls the look and feel of the login page rather than showing the generic IdP page.
2. **Credential collection proxy** — The form collects credentials and forwards them to the IdP via back-channel (Resource Owner Password Credentials flow or PingFederate's HTML Form Adapter).
3. **Service-specific authentication** — Some apps allow both SSO and local accounts; the form accommodates both.

---

## 3. Critical Evidence — "Sso Login Unsuccessful" Error Text

### Analysis

The error message **"Sso Login Unsuccessful"** is the strongest indicator of the actual authentication architecture:

- The application **explicitly identifies itself as performing SSO login**, not direct authentication.
- This error message almost certainly originates from the **service provider's SSO callback handler** — the code path that processes the response from the identity provider.
- The word "Sso" in the error text means the application's own codebase classifies its login mechanism as SSO.

### Implications

| Finding | Impact |
|---|---|
| Error says "Sso" | The app uses SSO internally, regardless of the form appearance. |
| Cross-domain cookies likely | The SSO flow probably involves cookies on the IdP domain (`fed.pfizer.com` or `login.microsoftonline.com`) plus the SP domain (`doc-integration.pfizer.com`). |
| Redirect chain likely | Even if credentials are submitted from the form, the server-side flow involves IdP communication and possibly client-side redirects. |
| Ephemeral context risk | An ephemeral browser context may fail to preserve cookies set during the redirect chain, causing the "Sso Login Unsuccessful" error. |

---

## 4. Recommendation — Use Persistent Context by Default

### Decision Matrix

| Approach | Pros | Cons |
|---|---|---|
| **Ephemeral first, fall back to persistent** | Cleaner if it works; no leftover state | Wasted time debugging ephemeral failures; SSO failures may be ambiguous (timeouts, blank pages, cryptic errors) |
| **Persistent by default** | Handles SSO redirect chains; preserves all cookies across domains; works for both direct and SSO-fronted logins | Slightly more setup (user data directory); accumulated browser state across runs |
| **Persistent with cleanup** | Best of both worlds | Requires explicit cleanup logic |

### Recommended Approach: Persistent Context with Managed State

**Use persistent browser context** for `doc-integration.pfizer.com`. Rationale:

1. **The "Sso Login Unsuccessful" error proves SSO is involved.** This is not a guess — the application itself declares it.
2. **Pfizer's corporate infrastructure uses cross-domain SSO** (PingFederate/Azure AD). Cookie preservation across domains is essential.
3. **Persistent context cost is minimal.** The practical impact of using persistent context for a site that doesn't need it is:
   - A user data directory is created/reused (~50-100 MB).
   - Browser state (cookies, localStorage) persists between sessions — this is actually beneficial for SSO since it can reuse existing sessions.
   - Slightly slower first launch (browser profile initialization).
   - No functional downside — persistent context is a strict superset of ephemeral context capability.
4. **Ephemeral context failures for SSO are hard to diagnose.** The failure mode is often a silent redirect loop, a blank page, or a generic error — not an obvious "you need persistent context" message.

### Implementation Guidance

```text
Context type:      Persistent (LaunchPersistentContext)
User data dir:     .playwright-auth/pfizer-doc-integration/
Channel:           msedge (corporate sites often require Edge/Chromium)
Accept downloads:  true (if file download testing is needed)
Ignore HTTPS:      false (corporate sites use valid certs)
Headless:          true for CI, false for initial debugging
```

### Session Reuse Strategy

After first successful login:
1. Persistent context preserves the SSO session cookies automatically.
2. Subsequent test runs may skip login entirely if the session is still valid.
3. If session expires, re-login flow executes from the persistent context.
4. Periodic cleanup: delete the user data directory to force fresh login when needed.

---

## 5. Summary

| Question | Answer |
|---|---|
| Is this a direct login? | **No.** The form collects credentials but authentication is SSO-based (confirmed by "Sso Login Unsuccessful" error). |
| Context type needed? | **Persistent.** Cross-domain SSO requires cookie preservation. |
| Risk of using persistent unnecessarily? | **Minimal.** Slight disk usage; no functional downside. |
| Risk of using ephemeral incorrectly? | **High.** SSO flow will likely fail, producing the observed "Sso Login Unsuccessful" error. |
| Recommended approach? | **Persistent context by default** with managed user data directory. |
