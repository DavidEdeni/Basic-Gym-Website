document.addEventListener('DOMContentLoaded', () => {
    // ===== Elements =====
    const navbar = document.getElementById('navbar');
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');
    const contactForm = document.getElementById('contactForm');
    const newsletterForm = document.getElementById('newsletterForm');

    // ===== Navbar scroll effect =====
    function handleScroll() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial scroll position

    // ===== Mobile navigation toggle =====
    function setMenuState(isOpen) {
        navToggle.classList.toggle('active', isOpen);
        navMenu.classList.toggle('active', isOpen);
        navToggle.setAttribute('aria-expanded', String(isOpen));
        document.body.style.overflow = isOpen ? 'hidden' : '';
    }

    function toggleMenu() {
        setMenuState(!navMenu.classList.contains('active'));
    }

    navToggle.addEventListener('click', toggleMenu);

    // Reset the mobile menu when leaving the mobile breakpoint so the body
    // scroll lock and open state don't persist on desktop.
    if (typeof window.matchMedia === 'function') {
        const mobileBreakpoint = window.matchMedia('(max-width: 768px)');
        mobileBreakpoint.addEventListener('change', (e) => {
            if (!e.matches) {
                setMenuState(false);
            }
        });
    }

    // Close mobile menu when a nav link is clicked
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navMenu.classList.contains('active')) {
                setMenuState(false);
            }
        });
    });

    // ===== Smooth scrolling for anchor links =====
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#') return;

            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                const navHeight = navbar.offsetHeight;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // ===== Active nav link on scroll =====
    function setActiveLink() {
        const sections = document.querySelectorAll('section[id]');
        const scrollPosition = window.scrollY + navbar.offsetHeight + 100;
        let activeId = null;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;

            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                activeId = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.toggle('active', activeId !== null && link.getAttribute('href') === `#${activeId}`);
        });
    }

    window.addEventListener('scroll', setActiveLink);
    setActiveLink(); // Set initial active link (e.g. when loading at a hash)

    // ===== Form handling =====
    function setupFormHandler(form, buildMessage) {
        if (!form) return;

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            showNotification(buildMessage(new FormData(form)));
            form.reset();
        });
    }

    setupFormHandler(contactForm, (data) =>
        `Thanks, ${data.get('name')}! Your message has been sent. We'll get back to you soon.`
    );

    setupFormHandler(newsletterForm, () => 'Thanks for subscribing to our newsletter!');

    // ===== Notification helper =====
    function showNotification(message) {
        // Remove any existing notification
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;

        // Inline styles for the notification
        notification.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: linear-gradient(135deg, #ff4d00, #e04400);
            color: #ffffff;
            padding: 16px 24px;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(255, 77, 0, 0.3);
            z-index: 9999;
            font-weight: 600;
            max-width: 350px;
            line-height: 1.5;
            transform: translateY(100px);
            opacity: 0;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        `;

        document.body.appendChild(notification);

        // Trigger animation
        requestAnimationFrame(() => {
            notification.style.transform = 'translateY(0)';
            notification.style.opacity = '1';
        });

        // Remove after 4 seconds
        setTimeout(() => {
            notification.style.transform = 'translateY(100px)';
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 400);
        }, 4000);
    }

    // ===== Scroll reveal animation =====
    // Observe cards and sections for reveal animation. Guard the whole feature
    // behind IntersectionObserver support so unsupported browsers don't crash
    // (and don't leave content hidden).
    const revealElements = document.querySelectorAll(
        '.feature-card, .class-card, .trainer-card, .pricing-card, .contact-form'
    );

    if ('IntersectionObserver' in window) {
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };

        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        revealElements.forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(30px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            revealObserver.observe(el);
        });
    }

    // Add revealed class styles dynamically
    const style = document.createElement('style');
    style.textContent = `
        .revealed {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
    `;
    document.head.appendChild(style);
});
