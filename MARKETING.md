# NOTSPAM.uk: Privacy-First Email Clean Room

## Marketing Assets

### 1. Hero Headline + Sub-headline
**Headline:** Zero Server. Zero Surveillance. Your Email Clean Room.
**Sub-headline:** Client-side temporary inboxes that shield your real data without storing a single byte.

### 2. Elevator Pitch
NOTSPAM is a privacy-first temporary email utility built entirely on a zero-persistence architecture. By processing all inbox data strictly within your browser, it provides an impenetrable barrier against spam and tracking while guaranteeing your ephemeral emails are never stored, logged, or monetised by us.

### 3. Feature Bullets
- **Zero-Server Architecture:** 100% client-side operation means your email data never touches our infrastructure.
- **In-Memory Privacy:** Sessions are ephemeral. Close the tab, and the data ceases to exist.
- **Cryptographic Generation:** Inbox addresses are created using browser-native CSPRNG for mathematical unpredictability.
- **Bookmarkable Sessions:** Return to your active inbox via secure, stateless URL parameters without requiring an account.
- **Installable PWA:** Add the app to your device for instant access to a secure email clean room on demand.

### 4. CTA Variants
- **Primary:** Generate Secure Inbox
- **Secondary:** View Technical Architecture
- **Urgency-Driven:** Shield Your Address Now

### 5. SEO Meta Title & Description
**Meta Title:** NOTSPAM | Zero-Server Temporary Email Clean Room
**Meta Description:** Protect your privacy with instant, anonymous, disposable email addresses. 100% client-side. Zero data storage. Shield your real inbox today.

### 6. Email Subject Lines
- A: Stop giving away your real email address
- B: Introducing the zero-server email clean room
- C: True privacy: Why we built an app with no database

### 7. Social Posts
**LinkedIn:**
Privacy shouldn't require trust. That's why we built NOTSPAM.uk with a zero-server, zero-persistence architecture. By processing temporary emails 100% client-side, we've eliminated the database entirely. If we don't store your data, it can't be breached, tracked, or monetised. See how true privacy engineering works. [Link] #PrivacyTech #CyberSecurity #WebDev

**X (Twitter):**
Most disposable email tools log your data. We built one that physically can't. 🛡️
NOTSPAM.uk is a 100% client-side email clean room. Zero server. Zero database. Maximum privacy.
Generate a secure inbox in seconds: [Link] #PrivacyFirst #InfoSec

---

## Technical Overview & How It Works

NOTSPAM is engineered on a strict "Zero Trust, Zero Persistence" philosophy. It is designed to act as a secure, ephemeral relay for email verification without ever storing user data on proprietary servers.

### Core Architecture
- **Framework:** Next.js 15 (App Router) with React 19.
- **Deployment:** Fully static client-side export (SSG), deployed to edge networks (Cloudflare Pages / Vercel). There is no active backend, Node.js server, or database involved in the application layer.
- **Styling:** Tailwind CSS v4 using modern CSS variable-driven themes.

### How The Inbox Works (Client-Side Polling)
The application acts as a clean, stateless UI wrapper around the public `1secmail.com` API.
1. **Address Generation:** The client uses the `crypto.getRandomValues()` API to securely generate a mathematically random 10-character local-part for the email address.
2. **Stateless State:** The generated address is stored strictly in React `useState` (memory) and the URL `?id=` parameter. It is never written to `localStorage`, `sessionStorage`, or cookies.
3. **Direct Polling:** The browser polls the external email API directly every 10 seconds using native `fetch`. The response goes straight to the DOM.
4. **Sandboxed Reader:** When an email is opened, HTML bodies are rendered inside an `iframe` with `sandbox="allow-same-origin"` to prevent execution of malicious scripts embedded in incoming spam.
5. **Ephemeral Lifecycle:** Because no data is stored locally or on a backend, simply closing the browser tab permanently destroys the session and any access to the inbox data (unless the URL is explicitly bookmarked by the user).

### Progressive Web App (PWA) Implementation
To provide native-like access without compromising privacy, the app includes a Service Worker that caches only the static UI shell (HTML, CSS, JS, fonts, logos). 
**Crucially, the Service Worker is programmed with a strict network bypass for all API traffic.** Email fetch requests are never cached, ensuring no sensitive data is inadvertently persisted in the browser's Cache Storage.

### Compliance & Security
- **GDPR / PECR:** The app operates without consent banners because it uses zero analytics, tracking, or marketing cookies. Only strictly necessary session logic is used, which falls under the PECR exemption.
- **CSP (Content Security Policy):** Strict headers prevent the execution of unauthorised external scripts, mitigating XSS attacks.
