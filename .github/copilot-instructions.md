# Copilot Instructions for iching_web

## Project Overview

**iching-web** is a bilingual (Chinese/English) web application for the Center for I Ching and World Civilizations at Shanghai Ocean University. The project features a Node.js backend serving static HTML frontends with form submission handling, email notifications, and data logging.

### Key Characteristics

- **Bilingual:** Zh-CN and English content coexist; language switching via JavaScript
- **Full-stack:** Lightweight Node.js server + vanilla HTML/CSS/JavaScript frontend
- **Traditional aesthetic:** Paper/ink color scheme reflecting I Ching philosophy
- **Contact-driven:** Inquiry forms with email notifications and NDJSON data logging

---

## Quick Start

```bash
npm start  # Starts server on http://localhost:3000 (or $HOST:$PORT)
```

### Environment Variables

- `HOST` (default: `127.0.0.1`)
- `PORT` (default: `3000`)
- `INQUIRY_EMAIL` (default: `htxia0413@gmail.com`) – recipient for form submissions
- `SENDMAIL_PATH` (default: `sendmail`) – system sendmail binary path

---

## Architecture

### Backend (server.js)

- **Routing:** Custom HTTP server (no framework)
- **Entry points:**
  - `GET /` → index.html
  - `GET /consulting.html` → consulting.html
  - `POST /api/inquiry` → form submission handler
  - Static file serving for `.css`, `.js`, `.png`, `.svg`, `.webp`, etc.
- **Data storage:** `data/inquiries.ndjson` – line-delimited JSON log of submissions
- **Email:** Sends via `sendmail` binary; validates email and message fields
- **Error handling:** Custom `ValidationError` class for request validation

### Frontend (index.html, consulting.html, site.js)

- **DOM elements:**
  - `#lang-switch` – language toggle button
  - `#menu-toggle` / `#nav-panel` – mobile navigation
  - `.reveal` – elements with scroll-triggered animations
  - `.js-inquiry-form` – form submission handlers
  - `.js-bagua` – I Ching bagua diagram interactive elements
- **Event handling:** IIFE pattern encapsulates DOM interactions
- **Localization:** `titleText` and `fieldPlaceholders` objects manage i18n strings

---

## Development Conventions

### Naming & Style

- **JavaScript:** camelCase for variables/functions; UPPER_CASE for constants
- **HTML:** Kebab-case for IDs and data attributes
- **CSS:** CSS custom properties for design tokens; `:root` defines color palette
  - `--ink`, `--paper`, `--surface`, `--accent`, `--olive` → maintain consistent theming
- **Bilingual content:** Store both zh/en versions; toggle via `body.dataset.lang`

### File Organization

```
iching_web/
├── index.html          # Main homepage
├── consulting.html     # Consulting/collaboration page
├── site.js             # Shared frontend logic
├── server.js           # Backend server
├── package.json        # Dependencies metadata
└── data/
    └── inquiries.ndjson  # Form submission log
```

### Adding New Pages

1. Create `.html` file following existing structure
2. Include same Google Fonts and CSS custom properties
3. Reference `/site.js` for shared DOM utilities
4. Add i18n strings to `site.js` if new forms/labels needed
5. Update server.js routing if new endpoints required

---

## Common Tasks

### Add a New Inquiry Form

1. **HTML:** Create form with `class="js-inquiry-form"` and field name attributes matching `fieldPlaceholders`
2. **JavaScript:** Form submission is auto-handled by `site.js` if class is present
3. **Backend:** `POST /api/inquiry` validates required fields and sends email

### Update Color Scheme

- Edit `:root` CSS variables in the `<style>` block
- Colors: `--ink`, `--paper`, `--surface`, `--accent`, `--olive` cascade throughout

### Deploy

- Set environment variables for production (especially `INQUIRY_EMAIL`, `HOST`, `PORT`)
- Ensure `sendmail` or equivalent mail system is available on host
- Run `npm start` or use process manager (pm2, systemd, etc.)

---

## Key Decision Points

- **No framework:** Vanilla JS and custom HTTP routing keep bundle small and cultural aesthetic intact
- **NDJSON logging:** Chosen for human-readable append-only format; easy to parse and audit
- **Bilingual toggle:** Implemented in JavaScript (not separate routes) to preserve SEO and simplify maintenance
- **Sendmail integration:** Uses system `sendmail` for maximum compatibility on Unix-like systems

---

## Common Pitfalls

- ⚠️ Form fields must match keys in `fieldPlaceholders` object or i18n will break
- ⚠️ CSS color variables rely on `:root` scope; inline styles bypass theming
- ⚠️ Email sending requires local `sendmail` binary; check `SENDMAIL_PATH` env var on deployment
- ⚠️ Static files require correct MIME types; add new types to `MIME_TYPES` map if adding media

---

## Related Documentation

- See [package.json](package.json) for full dependency list
- Form validation logic in [server.js](server.js) (~line 40–100)
- DOM utilities and i18n strings in [site.js](site.js)
- Design tokens in [index.html](index.html#L20–L30) `:root` CSS
