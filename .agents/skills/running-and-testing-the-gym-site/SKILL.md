---
name: running-and-testing-the-gym-site
description: How to run and manually test the IronPulse gym static website locally. Use when serving the site, verifying JS behavior, or testing changes to index.html / script.js / styles.css.
---

# Running & testing the Basic Gym Website

This is a **static site** — just `index.html`, `script.js`, `styles.css`. There is no
build step, package manager, dependencies, tests, or linter. (The repo's own "How To Run"
doc references a `freebuff` tool that is not needed.)

## Run locally
From the repo root:
```
python3 -m http.server 8000
```
Then open `http://localhost:8000`. Any static file server works.

## Quick JS sanity check
```
node --check script.js
```
Catches syntax errors without a browser.

## What the JS does (script.js, all inside a `DOMContentLoaded` handler)
- Navbar `scrolled` class toggle on scroll; mobile hamburger menu toggle.
- Smooth-scroll for `a[href^="#"]` anchors.
- Active nav-link highlighting on scroll.
- Contact & newsletter forms: `preventDefault` then show an orange notification toast
  (`showNotification`) — there is **no backend**, submissions are not sent anywhere.
- `IntersectionObserver`-based scroll-reveal animation for cards/sections.

## Manual test checklist (browser + DevTools console open)
- Nav links smooth-scroll to their sections; active link updates.
- Hamburger toggles the mobile menu (narrow viewport).
- Submitting the contact form shows the toast "Thanks, <name>! Your message has been sent."
- Cards fade/slide in as they enter the viewport.
- Console shows no JS errors. Note: a `favicon.ico` 404 is expected and harmless.

## Testing defensive / error-handling changes
Because guards are invisible on the happy path, reproduce failure conditions to prove them:
serve a modified copy of `index.html` (e.g. rename `id="navbar"`, or add an invalid-hash
anchor like `href="#123bad"`) and compare OLD vs NEW `script.js` in two `http.server`
instances on different ports, watching the DevTools console for uncaught errors vs warnings.
