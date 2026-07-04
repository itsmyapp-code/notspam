# NOTSPAM.UK — Internal Compliance Audit Log B
# Consent Design Decisions & PECR Justification Record
# Classification: INTERNAL ONLY — Not for public distribution
# Maintained by: ItsMyApp.co.uk Data Privacy Lead (hello@itsmyapp.co.uk)
# Last Updated: July 2026

---

## Document Purpose

This document records the consent architecture decisions made during the development of
NOTSPAM.uk. It serves as the internal audit record required under Article 24 UK GDPR
for demonstrating accountability in consent design and PECR compliance.

---

## 1. Cookie Consent Architecture Decision

### Decision: No Consent Banner Required

**Rationale:** NOTSPAM.uk sets zero cookies of any kind. Under the Privacy and Electronic
Communications Regulations (PECR) Regulation 6, consent is required only for the storage
of information or the gaining of access to information stored in the terminal equipment of
a subscriber or user. Since no storage occurs, no consent is required.

**Record of Decision:**
- Decision Date: July 2026
- Decision Maker: ItsMyApp.co.uk Development Lead
- Legal Reference: PECR Regulation 6; UK GDPR Article 6
- Review Due: July 2027

### Decision: Informational Banner (Not Consent Banner)

Despite no legal requirement for a banner, NOTSPAM.uk displays an **informational notice**
on every fresh session load to maintain transparency and user trust. This is a voluntary
transparency measure, not a legal requirement.

**Banner Design Principles Applied:**

| Principle | Implementation | Rationale |
|-----------|---------------|-----------|
| Zero localStorage | In-memory state only (React useState) | Consistent with zero-persistence service philosophy |
| Equal Prominence | DISMISS and ACKNOWLEDGE buttons are visually identical in dimensions | ICO equal prominence guidance; prevents dark pattern |
| First-Layer Rejection | Single-click dismissal with no nested screens | ICO guidance on first-layer rejection pathways |
| Accurate Copy | Banner clearly states no optional cookies are set | Prevents misleading consent collection |
| Session-Reset Display | Banner appears on every fresh load | Correct for ephemeral service; no persistent consent record needed |

---

## 2. Tracking & Analytics Decision

### Decision: Zero Telemetry

**Date:** July 2026
**Decision:** No analytics, telemetry, conversion tracking, or third-party monitoring
scripts are loaded by NOTSPAM.uk under any circumstances.

**Rationale:**
1. The service brand promise is "zero surveillance" — analytics would contradict the value proposition
2. The target user base has elevated privacy expectations — any tracking would destroy trust
3. No commercial model requires conversion tracking
4. UK GDPR Article 5(1)(c) data minimisation principle supports this position

**Review Trigger:** Any future commercial model change must trigger a re-evaluation of
this decision with a full DPIA.

---

## 3. Marketing Cookie Decision

### Decision: Permanent Block on Third-Party Marketing Trackers

**Date:** July 2026
**Decision:** No third-party marketing, retargeting, or advertising scripts will be
loaded by NOTSPAM.uk. This is an unconditional technical and policy block.

**Mechanism:** Content Security Policy header deployed via vercel.json blocks
all external script sources except specifically whitelisted origins. No advertising
network domains are whitelisted.

**PECR Reference:** PECR Regulation 6 — marketing cookies require explicit opt-in.
Since our policy is to never deploy marketing cookies, this consent collection path
is permanently closed.

---

## 4. DUAA Statutory Exemptions Assessment

Under the Data (Use and Access) Act provisions, certain processing activities may be
exempt from standard consent requirements:

| Exemption Category                    | Applicable? | Notes |
|---------------------------------------|-------------|-------|
| First-party anonymous performance analytics | No | No analytics deployed |
| Fraud detection checking connection params | Yes — via Vercel infrastructure | Handled by Vercel as processor |
| User-defined viewport/preference storage | No | No preferences stored |

---

## 5. Subject Access Request (SAR) Procedure

### Intake Process
- Requests received at: hello@itsmyapp.co.uk
- Acknowledgement SLA: Within 30 calendar days (paused for identity verification)
- Response SLA: Within 30 calendar days of identity verification
- Extension provision: Additional 60 days for complex requests (with notification)

### SAR Response Template

Since NOTSPAM.uk holds zero personal data, the standard SAR response will be:

> "Following a thorough search of all data systems operated by or on behalf of NOTSPAM.uk /
> ItsMyApp.co.uk in relation to this service, we have confirmed that we hold no personal
> data relating to your identity. This is consistent with our zero-data architecture,
> in which no user-identifiable information is stored at any point."

### ICO Escalation Path

If a complainant is unsatisfied: https://ico.org.uk/make-a-complaint/
ICO Helpline: 0303 123 1113

---

## 6. Subscription & Billing (Not Applicable)

NOTSPAM.uk operates no subscription model, billing, or payment processing.
The cooling-off period, refund matrix, and renewal notification requirements
of the Compliance MD framework are therefore not applicable to this service.

This declaration is recorded for completeness of the compliance audit trail.

---

## Change Log

| Date       | Change                            | Author           |
|------------|-----------------------------------|------------------|
| 2026-07-04 | Initial document creation         | ItsMyApp.co.uk   |
