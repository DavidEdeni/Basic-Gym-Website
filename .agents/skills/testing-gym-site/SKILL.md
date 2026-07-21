---
name: testing-gym-site
description: Run and test the IronPulse Gym static site end-to-end. Use when verifying UI or script.js changes (nav, forms, mobile menu, scroll-reveal) or running the Jest suite.
---

# Testing the IronPulse Gym site

Static site: `index.html`, `styles.css`, `script.js`. No build step. Also has a Jest (jsdom) unit suite.

## Run locally
```bash
python3 -m http.server 8000
# open http://localhost:8000/index.html
```

## Unit tests
```bash
npm install   # installs jest + jest-environment-jsdom
npm test      # runs the jsdom suite in tests/script.test.js
```
The suite mocks `IntersectionObserver` and drives `DOMContentLoaded` against a DOM fixture (`tests/fixture.js`). jsdom does NOT implement `IntersectionObserver` or `matchMedia`, so any new `script.js` code that touches browser-only APIs must be feature-guarded (e.g. `if ('IntersectionObserver' in window)`, `if (typeof window.matchMedia === 'function')`) or the entire `DOMContentLoaded` handler throws and every test goes red.

## Primary UI flows to verify (via browser)
- **JS init**: page loads with no console errors; nav toggle `aria-expanded="false"`; feature cards start `opacity:0`.
- **Scroll-reveal**: scrolling brings `.feature-card`/`.class-card` etc. into view (they gain `.revealed`, opacity 1). If the reveal engine crashed, cards stay invisible.
- **Active nav link**: scrolling to a section highlights exactly ONE nav link (underline) matching that section — check for stale/duplicate `.nav-link.active`.
- **Forms**: submitting the contact or newsletter form shows an orange toast (`.notification`) bottom-right and resets the form.
- **Mobile menu + resize reset**: resize the browser window below 768px (e.g. `wmctrl -r :ACTIVE: -e 0,20,20,430,760`) to show the hamburger; click it to open the slide-in menu (`aria-expanded=true`, `body.overflow=hidden`); then maximize (`wmctrl -r :ACTIVE: -b add,maximized_vert,maximized_horz`) and confirm the menu auto-closes and `body.overflow` is cleared.

Note: the display is 1600x1200 but the computer tool uses a scaled 1024x768 coordinate space. Resize the Chrome window with `wmctrl`/xdotool (actual pixels) rather than assuming tool coords.

## Devin Secrets Needed
None — the site is fully static and runs locally with no credentials.
