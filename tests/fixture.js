// Minimal DOM fixture mirroring the structure that script.js depends on in
// index.html (navbar, mobile toggle, nav links, sections, forms and the
// elements targeted by the scroll-reveal animation).
const pageFixture = `
  <nav class="navbar" id="navbar">
    <button class="nav-toggle" id="navToggle" aria-label="Toggle navigation">
      <span class="hamburger"></span>
    </button>
    <ul class="nav-menu" id="navMenu">
      <li><a href="#home" class="nav-link active">Home</a></li>
      <li><a href="#about" class="nav-link">About</a></li>
      <li><a href="#contact" class="nav-link">Contact</a></li>
      <li><a href="#" class="logo-link">Logo</a></li>
    </ul>
  </nav>

  <section id="home" class="hero"></section>
  <section id="about" class="about section">
    <div class="feature-card">Feature</div>
  </section>
  <section id="contact" class="contact section">
    <form class="contact-form" id="contactForm">
      <input type="text" id="name" name="name" value="Jordan" />
      <input type="email" id="email" name="email" value="jordan@example.com" />
      <textarea id="message" name="message">Hi</textarea>
      <button type="submit">Send Message</button>
    </form>
  </section>

  <footer>
    <form class="newsletter-form" id="newsletterForm">
      <input type="email" name="email" value="sub@example.com" />
      <button type="submit">Subscribe</button>
    </form>
  </footer>
`;

module.exports = { pageFixture };
