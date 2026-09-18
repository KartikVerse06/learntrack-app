# LearnTrack — Security Architecture & Threat Modeling

**Document Version:** 1.0.0  
**Status:** Approved for Implementation  
**Standard:** OWASP Top 10 + Zero-Trust Multi-Tenant Isolation

---

## 1. Zero-Trust Multi-Tenant Isolation Model

LearnTrack enforces a strict multi-tenant security architecture where each learner's study topics, notes, doubts, and statistics are cryptographically isolated.

```
       [ Client Request ]
               │
               ▼
   [ Next.js Middleware / Auth.js ]  ──► Validates JWT/Session Cookie
               │
               ▼
      [ Server Action Guard ]        ──► Extracts verified userId from session
               │
               ▼
       [ Prisma Query Scope ]        ──► WHERE { id: resourceId, userId: verifiedUserId }
               │
               ▼
       [ MySQL Database ]
```

### 1.1 Invariant: Absolute Rejection of Client-Provided User IDs
* **Rule:** No client request payload (JSON body, form data, or URL query param) is ever permitted to specify the target `userId`.
* **Enforcement:** All server actions derive the actor's identity solely from `await auth()`. Any route receiving a mismatching user parameter will immediately reject with a `403 Forbidden` or `401 Unauthorized`.

---

## 2. Authentication & Session Security (Auth.js)

### 2.1 Cookie Security Policy
* **`HttpOnly`:** Enabled. Client-side JavaScript cannot access the session cookie via `document.cookie`, neutralizing XSS-based session hijacking.
* **`Secure`:** Enabled in production. Cookies are only transmitted over TLS/HTTPS.
* **`SameSite=Lax`:** Default setting providing defense-in-depth against Cross-Site Request Forgery (CSRF).
* **Session Expiry & Rolling Refresh:** Sessions expire after 30 days of inactivity with automatic rolling renewal.

### 2.2 Password Hashing
* Credentials authentication utilizes **Argon2id** (preferred) or **bcrypt** with a minimum cost factor of 12 rounds.
* Salt is generated cryptographically per user and stored within the hash string. Plaintext passwords are never logged or stored.

---

## 3. Server-Side Input Validation (Zod)

Every Server Action and API Route executes Zod schema parsing before interacting with the database or services:
1. **String Sanitization:** Strict character bounds (e.g., Task Title: 3–120 chars; Description: $\le 2000$ chars).
2. **Enum Enforcement:** Priorities, Statuses, and Interval Numbers are strictly cast to validated TypeScript enums.
3. **Regex Verification:** Dates are strictly validated against `^\d{4}-\d{2}-\d{2}$`.
4. **Numeric Clamping:** Confidence scores are strictly clamped to integers between 1 and 5. Durations are validated against reasonable bounds ($60 \le \text{seconds} \le 7200$).

---

## 4. Cross-Site Scripting (XSS) & Markdown Sanitization

Learners record markdown notes in their `LearningLog` entries. Unsanitized markdown rendering poses an XSS risk.
* **Client Rendering Guard:** All markdown in logs and task descriptions is rendered using `react-markdown` paired with `rehype-sanitize`:
  ```typescript
  import ReactMarkdown from 'react-markdown';
  import rehypeSanitize from 'rehype-sanitize';

  <ReactMarkdown rehypePlugins={[rehypeSanitize]}>
    {learningLog.whatLearned}
  </ReactMarkdown>
  ```
* Raw HTML `<script>`, `<iframe>`, `<img>` with `onerror` attributes, and `javascript:` URIs are stripped completely at the AST level.

---

## 5. SQL Injection & ORM Safety

All database access is handled via **Prisma ORM**.
* **Parameterized Queries:** Prisma automatically parameterizes all queries and statements, preventing SQL injection vulnerabilities.
* **Raw Query Prohibition:** Raw SQL via `$queryRaw` or `$executeRaw` is strictly forbidden for standard CRUD operations. If used for analytics aggregations, tagged template literals with parameterized inputs must be strictly used.

---

## 6. CSRF Mitigation

* **Next.js Server Actions Built-in Protection:** Server Actions in Next.js App Router enforce strict host header verification and utilize cryptographic tokens to block cross-origin execution automatically.
* **API Routes:** API routes check the `Origin` and `Host` headers to prevent unauthorized cross-origin triggering of data feeds.

---

## 7. Environment Variables & Secret Hygiene

| Variable Name | Environment | Exposure | Purpose |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | Server Only | **Secret** | MySQL connection string with SSL credentials. |
| `AUTH_SECRET` | Server Only | **Secret** | Cryptographic key used to sign and encrypt session cookies. |
| `NEXTAUTH_URL` | Server Only | Public Config | Canonical base URL for Auth.js callbacks. |
| `NEXT_PUBLIC_APP_URL`| Client/Server | Public Config | Canonical URL for client links. |

* **Rule:** Never prefix database or authentication secrets with `NEXT_PUBLIC_`.
* **CI/CD Guard:** Git hooks and GitHub Actions audit commits to block accidental secret commits.

---

## 8. Secure Error Handling & Information Leakage

1. **Production Error Masking:** Database exceptions, connection errors, and ORM stack traces are logged securely to the server console or APM tool (e.g., Sentry), but are **never returned to the client**.
2. **Client Errors:** The client receives sanitized, user-friendly error codes:
   ```json
   {
     "success": false,
     "error": {
       "code": "TASK_NOT_FOUND",
       "message": "The requested learning task could not be found or you do not have permission to view it."
     }
   }
   ```
