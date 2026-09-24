/**
 * Navigation functionality
 */
import { utils } from './utils.js';

class Navigation {
  constructor() {
    this.navbar = document.querySelector('.navbar');
    this.backToTop = document.querySelector('.back-to-top');
    this.scrollProgress = document.querySelector('.scroll-progress');
    this.lastScroll = 0;
    this.ticking = false;

    this.init();
  }

  init() {
    if (!this.navbar) return;

    this.bindEvents();
    this.updateOnScroll();
  }

  bindEvents() {
    window.addEventListener('scroll', () => {
      if (!this.ticking) {
        window.requestAnimationFrame(() => {
          this.updateOnScroll();
          this.ticking = false;
        });
        this.ticking = true;
      }
    }, { passive: true });

    // Back to top button
    if (this.backToTop) {
      this.backToTop.addEventListener('click', () => {
        utils.smoothScrollTo('body');
      });
    }

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        const href = anchor.getAttribute('href');
        if (href === '#') return;

        e.preventDefault();
        utils.smoothScrollTo(href);
      });
    });
  }

  updateOnScroll() {
    const currentScroll = window.pageYOffset;

    // Navbar background
    if (currentScroll > 50) {
      this.navbar.classList.add('scrolled');
    } else {
      this.navbar.classList.remove('scrolled');
    }

    // Back to top visibility
    if (this.backToTop) {
      if (currentScroll > 500) {
        this.backToTop.classList.add('visible');
      } else {
        this.backToTop.classList.remove('visible');
      }
    }

    // Scroll progress
    if (this.scrollProgress) {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (currentScroll / docHeight) * 100;
      this.scrollProgress.style.width = `${scrollPercent}%`;
    }

    this.lastScroll = currentScroll;
  }
}

export default Navigation;
