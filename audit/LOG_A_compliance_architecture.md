# NOTSPAM.UK — Internal Compliance Audit Log A
# Article 24 UK GDPR — Records of Processing Activities (RoPA)
# Classification: INTERNAL ONLY — Not for public distribution
# Maintained by: ItsMyApp.co.uk Data Privacy Lead (hello@itsmyapp.co.uk)
# Last Updated: July 2026

---

## Document Purpose

This document constitutes a Record of Processing Activities (RoPA) as required under
Article 30 of the UK GDPR and fulfils the accountability obligation under Article 24.
It documents the architectural and data-flow decisions made during the development of
NOTSPAM.uk to demonstrate compliance-by-design.

---

## 1. Controller Details

| Field              | Value                      |
|--------------------|----------------------------|
| Controller Name    | ItsMyApp.co.uk             |
| Contact            | hello@itsmyapp.co.uk       |
| Service Name       | NOTSPAM.uk                 |
| Service URL        | https://notspam.uk         |
| Supervisory Auth   | Information Commissioner's Office (ICO) |

---

## 2. Processing Architecture — Zero-Data Design

### Core Architectural Decision

NOTSPAM.uk was intentionally architected as a **zero-server, zero-persistence** application.
This design eliminates all categories of personal data processing at the infrastructure level
beyond what is inherent to serving static files over HTTPS.

### Data Flow Audit

```
User Browser (client)
    │
    ├── [1] Loads static HTML/CSS/JS from Vercel CDN
    │       • No user-identifiable data transmitted to NOTSPAM.uk servers beyond
    │         standard HTTP request headers (IP, user-agent, timestamp)
    │       • Vercel processes these as data processor under DPA
    │
    ├── [2] CSPRNG generates 10-char alphanumeric local-part in browser memory
    │       • Uses Web Crypto API: crypto.getRandomValues()
    │       • Local-part NEVER transmitted to any NOTSPAM.uk infrastructure
    │       • Local-part destroyed on page close / refresh (in-memory only)
    │
    ├── [3] Browser polls 1secmail.com API directly
    │       • API endpoint: https://www.1secmail.com/api/v1/
    │       • User's IP visible to 1secmail.com (third-party controller)
    │       • NOTSPAM.uk has no visibility into these requests
    │       • Message content rendered in browser memory only
    │       • Message content NEVER transmitted to NOTSPAM.uk infrastructure
    │
    └── [4] Session destruction
            • Browser refresh or tab close destroys all state
            • No persistence mechanism (no localStorage, sessionStorage,
              IndexedDB, cookies, service workers, or cache API)
```

### Conclusion on Data Minimisation (Article 5(1)(c))

The architecture satisfies the data minimisation principle to the maximum technically
achievable extent. No personal data is collected beyond what is inherent to HTTPS
infrastructure operation.

---

## 3. Third-Party Processor Register

| Processor     | Role                  | Transfers       | DPA Reference             |
|---------------|-----------------------|-----------------|---------------------------|
| Vercel, Inc.  | Static file hosting   | UK → USA (SCCs) | vercel.com/legal/dpa      |
| 1secmail.com  | Email relay (client→) | User browser only | 1secmail.com privacy docs |

Note: 1secmail.com is not a data processor of NOTSPAM.uk — they receive direct requests
from user browsers. NOTSPAM.uk has no data sharing relationship with 1secmail.com.

---

## 4. Legal Bases Register

| Processing Activity           | Legal Basis               | Article      |
|-------------------------------|---------------------------|--------------|
| Serving static web application| Legitimate Interests (LI) | Art. 6(1)(f) |
| Infrastructure security logs  | Legitimate Interests (LI) | Art. 6(1)(f) |
| Fraud/abuse detection         | Legitimate Interests (LI) | Art. 6(1)(f) |
| Fault diagnosis & repair      | Legitimate Interests (LI) | Art. 6(1)(f) |

Legitimate Interests Assessment (LIA) — brief summary:
- Purpose: Secure service delivery, fraud prevention, fault repair
- Necessity: Minimal — only inherent HTTPS infrastructure logging
- Balancing: Individual privacy impact is negligible; data is transient,
  not used for profiling, and not linked to identity
- LIA conclusion: LI applies without override

---

## 5. Security Measures (Article 32)

| Measure                    | Implementation                              |
|----------------------------|---------------------------------------------|
| Encryption in transit      | TLS 1.3 enforced by Vercel (HSTS deployed)  |
| No data at rest            | Confirmed — zero server-side storage        |
| CSP Headers                | Strict CSP blocking all external scripts    |
| Referrer policy            | no-referrer (no URL leakage)                |
| Iframe sandboxing          | allow-same-origin only on email renderer    |
| CSPRNG address generation  | Web Crypto API (not Math.random)            |
| XSS protection             | X-XSS-Protection header + CSP              |
| Clickjacking protection    | X-Frame-Options: DENY                       |

---

## 6. DPIA Assessment

A full Data Protection Impact Assessment (DPIA) under Article 35 is NOT required
because the processing described above does not involve:
- Systematic and extensive profiling
- Processing of special categories of data at scale
- Systematic monitoring of publicly accessible areas

The zero-data architecture means the residual risk to data subjects is negligible.

---

## Change Log

| Date       | Change                            | Author           |
|------------|-----------------------------------|------------------|
| 2026-07-04 | Initial document creation         | ItsMyApp.co.uk   |
