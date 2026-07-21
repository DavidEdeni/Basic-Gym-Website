import { jest } from '@jest/globals';
import { pageFixture } from './fixture.js';
// Importing for its side effect: script.js registers a single
// DOMContentLoaded listener that each test drives against a fresh DOM.
import '../script.js';

// Captures the most recently constructed IntersectionObserver so tests can
// drive its callback manually (jsdom does not implement IntersectionObserver).
let lastObserver;

class MockIntersectionObserver {
  constructor(callback, options) {
    this.callback = callback;
    this.options = options;
    this.observed = [];
    this.unobserved = [];
    lastObserver = this;
  }
  observe(el) {
    this.observed.push(el);
  }
  unobserve(el) {
    this.unobserved.push(el);
  }
  disconnect() {}
  // Helper used by tests to simulate elements entering the viewport.
  trigger(entries) {
    this.callback(entries, this);
  }
}

function setScrollY(value) {
  Object.defineProperty(window, 'scrollY', { value, configurable: true });
  Object.defineProperty(window, 'pageYOffset', { value, configurable: true });
}

// script.js attaches listeners to the shared jsdom window/document that would
// otherwise leak across tests (each run re-registers "scroll" handlers whose
// closures point at stale DOM). We record every listener added while a test
// runs and remove them afterwards so each test is fully isolated.
const tracked = [];
const originalWindowAdd = window.addEventListener.bind(window);
const originalDocumentAdd = document.addEventListener.bind(document);

function startTracking() {
  window.addEventListener = (type, listener, opts) => {
    tracked.push({ target: window, type, listener, opts });
    return originalWindowAdd(type, listener, opts);
  };
  document.addEventListener = (type, listener, opts) => {
    tracked.push({ target: document, type, listener, opts });
    return originalDocumentAdd(type, listener, opts);
  };
}

function stopTracking() {
  window.addEventListener = originalWindowAdd;
  document.addEventListener = originalDocumentAdd;
  while (tracked.length) {
    const { target, type, listener, opts } = tracked.pop();
    target.removeEventListener(type, listener, opts);
  }
}

// Builds the DOM, wires the required globals and runs script.js by dispatching
// the DOMContentLoaded event its top-level listener waits for.
function loadPage() {
  document.body.innerHTML = pageFixture;
  document.dispatchEvent(new Event('DOMContentLoaded'));
}

beforeEach(() => {
  jest.useFakeTimers();

  // jsdom does not implement matchMedia; script.js uses it to reset the mobile
  // menu when leaving the mobile breakpoint.
  window.matchMedia = jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }));

  lastObserver = undefined;
  window.IntersectionObserver = MockIntersectionObserver;
  global.IntersectionObserver = MockIntersectionObserver;

  window.requestAnimationFrame = (cb) => {
    cb(0);
    return 0;
  };
  window.scrollTo = jest.fn();
  setScrollY(0);
  startTracking();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
  stopTracking();
  document.body.innerHTML = '';
});

describe('navbar scroll effect', () => {
  test('adds the "scrolled" class when the page is scrolled past 50px', () => {
    loadPage();
    const navbar = document.getElementById('navbar');
    expect(navbar.classList.contains('scrolled')).toBe(false);

    setScrollY(120);
    window.dispatchEvent(new Event('scroll'));

    expect(navbar.classList.contains('scrolled')).toBe(true);
  });

  test('removes the "scrolled" class when scrolled back to the top', () => {
    setScrollY(200);
    loadPage();
    const navbar = document.getElementById('navbar');
    expect(navbar.classList.contains('scrolled')).toBe(true);

    setScrollY(0);
    window.dispatchEvent(new Event('scroll'));

    expect(navbar.classList.contains('scrolled')).toBe(false);
  });
});

describe('mobile navigation toggle', () => {
  test('toggling the button opens and closes the menu and locks body scroll', () => {
    loadPage();
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');

    navToggle.dispatchEvent(new Event('click'));
    expect(navToggle.classList.contains('active')).toBe(true);
    expect(navMenu.classList.contains('active')).toBe(true);
    expect(document.body.style.overflow).toBe('hidden');

    navToggle.dispatchEvent(new Event('click'));
    expect(navToggle.classList.contains('active')).toBe(false);
    expect(navMenu.classList.contains('active')).toBe(false);
    expect(document.body.style.overflow).toBe('');
  });

  test('clicking a nav link closes the menu when it is open', () => {
    loadPage();
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    navToggle.dispatchEvent(new Event('click'));
    expect(navMenu.classList.contains('active')).toBe(true);

    const link = document.querySelector('.nav-link');
    link.dispatchEvent(new Event('click', { bubbles: true }));

    expect(navMenu.classList.contains('active')).toBe(false);
  });

  test('clicking a nav link does nothing when the menu is already closed', () => {
    loadPage();
    const navMenu = document.getElementById('navMenu');
    const navToggle = document.getElementById('navToggle');
    expect(navMenu.classList.contains('active')).toBe(false);

    const link = document.querySelector('.nav-link');
    link.dispatchEvent(new Event('click', { bubbles: true }));

    expect(navMenu.classList.contains('active')).toBe(false);
    expect(navToggle.classList.contains('active')).toBe(false);
  });
});

describe('smooth scrolling for anchor links', () => {
  test('scrolls to an existing target and prevents the default jump', () => {
    loadPage();
    const anchor = document.querySelector('a[href="#about"]');

    const event = new Event('click', { bubbles: true, cancelable: true });
    anchor.dispatchEvent(event);

    expect(window.scrollTo).toHaveBeenCalledTimes(1);
    expect(window.scrollTo).toHaveBeenCalledWith(
      expect.objectContaining({ behavior: 'smooth' })
    );
    expect(event.defaultPrevented).toBe(true);
  });

  test('ignores bare "#" links without scrolling', () => {
    loadPage();
    const anchor = document.querySelector('a[href="#"]');

    const event = new Event('click', { bubbles: true, cancelable: true });
    anchor.dispatchEvent(event);

    expect(window.scrollTo).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  test('does not scroll when the target element does not exist', () => {
    document.body.innerHTML = pageFixture + `<a href="#missing">Missing</a>`;
    document.dispatchEvent(new Event('DOMContentLoaded'));
    const anchor = document.querySelector('a[href="#missing"]');

    const event = new Event('click', { bubbles: true, cancelable: true });
    anchor.dispatchEvent(event);

    expect(window.scrollTo).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });
});

describe('contact form handling', () => {
  test('submitting shows a personalized notification and resets the form', () => {
    loadPage();
    const form = document.getElementById('contactForm');
    const resetSpy = jest.spyOn(form, 'reset');

    const event = new Event('submit', { bubbles: true, cancelable: true });
    form.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    const notification = document.querySelector('.notification');
    expect(notification).not.toBeNull();
    expect(notification.textContent).toContain('Jordan');
    expect(resetSpy).toHaveBeenCalledTimes(1);
  });
});

describe('newsletter form handling', () => {
  test('submitting shows the subscription notification and resets the form', () => {
    loadPage();
    const form = document.getElementById('newsletterForm');
    const resetSpy = jest.spyOn(form, 'reset');

    const event = new Event('submit', { bubbles: true, cancelable: true });
    form.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    const notification = document.querySelector('.notification');
    expect(notification).not.toBeNull();
    expect(notification.textContent).toContain('newsletter');
    expect(resetSpy).toHaveBeenCalledTimes(1);
  });
});

describe('optional forms', () => {
  test('initializes without error when the forms are absent', () => {
    document.body.innerHTML = `
      <nav id="navbar">
        <button id="navToggle"></button>
        <ul id="navMenu"><li><a href="#home" class="nav-link">Home</a></li></ul>
      </nav>
      <section id="home"></section>
    `;

    expect(() => {
      document.dispatchEvent(new Event('DOMContentLoaded'));
    }).not.toThrow();
    expect(document.querySelector('.notification')).toBeNull();
  });
});

describe('notification helper', () => {
  test('only a single notification exists when submitting twice', () => {
    loadPage();
    const contactForm = document.getElementById('contactForm');
    const newsletterForm = document.getElementById('newsletterForm');

    contactForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    newsletterForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    expect(document.querySelectorAll('.notification')).toHaveLength(1);
  });

  test('animates in via requestAnimationFrame and is removed after the timeout', () => {
    loadPage();
    const form = document.getElementById('contactForm');
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    const notification = document.querySelector('.notification');
    // requestAnimationFrame is invoked synchronously in the test, so the
    // "shown" styles are applied immediately.
    expect(notification.style.opacity).toBe('1');
    expect(notification.style.transform).toBe('translateY(0)');

    // 4s to start the exit animation, then 400ms before removal.
    jest.advanceTimersByTime(4000);
    expect(notification.style.opacity).toBe('0');
    jest.advanceTimersByTime(400);
    expect(document.querySelector('.notification')).toBeNull();
  });
});

describe('scroll reveal animation', () => {
  test('reveal elements start hidden and are observed', () => {
    loadPage();
    const card = document.querySelector('.feature-card');

    expect(card.style.opacity).toBe('0');
    expect(card.style.transform).toBe('translateY(30px)');
    expect(lastObserver).toBeDefined();
    expect(lastObserver.observed).toContain(card);
  });

  test('intersecting elements get the "revealed" class and are unobserved', () => {
    loadPage();
    const card = document.querySelector('.feature-card');

    lastObserver.trigger([{ isIntersecting: true, target: card }]);

    expect(card.classList.contains('revealed')).toBe(true);
    expect(lastObserver.unobserved).toContain(card);
  });

  test('non-intersecting entries are left untouched', () => {
    loadPage();
    const card = document.querySelector('.feature-card');

    lastObserver.trigger([{ isIntersecting: false, target: card }]);

    expect(card.classList.contains('revealed')).toBe(false);
    expect(lastObserver.unobserved).not.toContain(card);
  });
});

describe('active nav link on scroll', () => {
  function stubOffset(el, top, height) {
    Object.defineProperty(el, 'offsetTop', { value: top, configurable: true });
    Object.defineProperty(el, 'offsetHeight', { value: height, configurable: true });
  }

  test('highlights the nav link for the section currently in view', () => {
    loadPage();
    // jsdom does not compute layout, so stub the geometry the handler reads.
    stubOffset(document.getElementById('home'), 0, 500);
    stubOffset(document.getElementById('about'), 500, 500);
    stubOffset(document.getElementById('contact'), 1000, 500);

    setScrollY(600); // scrollPosition (600 + 100) lands inside #about
    window.dispatchEvent(new Event('scroll'));

    const activeLinks = document.querySelectorAll('.nav-link.active');
    expect(activeLinks).toHaveLength(1);
    expect(activeLinks[0].getAttribute('href')).toBe('#about');
  });
});
