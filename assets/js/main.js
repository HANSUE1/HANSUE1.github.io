    // Navbar scroll effect
    const navbar = document.getElementById('navbar');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
      const currentScroll = window.pageYOffset;

      if (currentScroll > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }

      lastScroll = currentScroll;
    }, { passive: true });

    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    const themeToggleMobile = document.getElementById('themeToggleMobile');
    const html = document.documentElement;
    const THEME_KEY = 'portfolio-theme';

    function getSystemTheme() {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    function getStoredTheme() {
      try {
        return localStorage.getItem(THEME_KEY);
      } catch (e) {
        return null;
      }
    }

    function applyTheme(theme) {
      if (theme === 'dark') {
        html.setAttribute('data-theme', 'dark');
      } else {
        html.removeAttribute('data-theme');
      }
    }

    function getCurrentTheme() {
      return html.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    }

    function toggleTheme(event) {
      const currentTheme = getCurrentTheme();
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      const activeToggle = themeToggle || themeToggleMobile;
      const ripple = activeToggle ? activeToggle.querySelector('.theme-ripple') : null;

      if (ripple) {
        ripple.classList.remove('animate');
        void ripple.offsetWidth;
        ripple.classList.add('animate');
      }

      if (newTheme === 'light') {
        document.body.classList.add('theme-switching');
        setTimeout(() => {
          applyTheme(newTheme);
          document.body.classList.remove('theme-switching');
        }, 50);
      } else {
        applyTheme(newTheme);
      }

      try {
        localStorage.setItem(THEME_KEY, newTheme);
      } catch (e) {
        // ignore storage errors
      }
      
      if (typeof GradientWaves !== 'undefined' && GradientWaves.updateTheme) {
        GradientWaves.updateTheme();
      }
    }

    const storedTheme = getStoredTheme();
    if (storedTheme) {
      applyTheme(storedTheme);
    } else {
      applyTheme(getSystemTheme());
    }

    if (themeToggle) {
      themeToggle.addEventListener('click', toggleTheme);
    }

    if (themeToggleMobile) {
      themeToggleMobile.addEventListener('click', toggleTheme);
    }

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!getStoredTheme()) {
        applyTheme(e.matches ? 'dark' : 'light');
        if (typeof GradientWaves !== 'undefined' && GradientWaves.updateTheme) {
          GradientWaves.updateTheme();
        }
      }
    });

    // Mobile menu
    const navToggle = document.getElementById('navToggle');
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileOverlay = document.getElementById('mobileOverlay');

    function toggleMobileMenu() {
      const isActive = mobileMenu.classList.contains('active');
      navToggle.classList.toggle('active');
      mobileMenu.classList.toggle('active');
      mobileOverlay.classList.toggle('active');
      document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';

      if (!isActive) {
        navToggle.setAttribute('aria-expanded', 'true');
        mobileMenu.setAttribute('aria-hidden', 'false');
      } else {
        navToggle.setAttribute('aria-expanded', 'false');
        mobileMenu.setAttribute('aria-hidden', 'true');
      }
    }

    navToggle.addEventListener('click', toggleMobileMenu);
    mobileOverlay.addEventListener('click', toggleMobileMenu);

    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        if (mobileMenu.classList.contains('active')) {
          toggleMobileMenu();
        }
      });
    });

    // Close mobile menu on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileMenu.classList.contains('active')) {
        toggleMobileMenu();
      }
    });

    // Handle window resize for mobile menu
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (window.innerWidth >= 768 && mobileMenu.classList.contains('active')) {
          toggleMobileMenu();
        }
      }, 100);
    });

    // Intersection Observer for animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -80px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    document.querySelectorAll('.fade-in, .project-card').forEach(el => {
      observer.observe(el);
    });

    // Form submission
    const contactForm = document.getElementById('contact-form');
    const formFeedback = document.getElementById('form-feedback');
    const submitBtn = document.getElementById('submitBtn');

    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      submitBtn.disabled = true;
      submitBtn.querySelector('span').textContent = 'Sending...';

      setTimeout(() => {
        formFeedback.classList.add('success');
        formFeedback.textContent = 'Thank you for your message! I\'ll get back to you soon.';
        contactForm.reset();

        submitBtn.disabled = false;
        submitBtn.querySelector('span').textContent = 'Send Message';

        setTimeout(() => {
          formFeedback.classList.remove('success');
          formFeedback.textContent = '';
        }, 5000);
      }, 1500);
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') return;

        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          const navHeight = navbar.offsetHeight;
          const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight;

          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      });
    });

    // Magnetic effect for buttons - only on non-touch devices
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    if (!isTouchDevice) {
      document.querySelectorAll('.magnetic').forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
          const rect = btn.getBoundingClientRect();
          const x = e.clientX - rect.left - rect.width / 2;
          const y = e.clientY - rect.top - rect.height / 2;

          btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
        });

        btn.addEventListener('mouseleave', () => {
          btn.style.transform = 'translate(0, 0)';
        });
      });
    }

    // Parallax effect for hero - only on non-touch devices
    const hero = document.getElementById('hero');
    if (hero && !isTouchDevice) {
      window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const heroContent = hero.querySelector('.hero-content');
        if (heroContent && scrolled < window.innerHeight) {
          heroContent.style.transform = `translateY(${scrolled * 0.3}px)`;
          heroContent.style.opacity = 1 - (scrolled / window.innerHeight) * 0.8;
        }
      }, { passive: true });
    }
