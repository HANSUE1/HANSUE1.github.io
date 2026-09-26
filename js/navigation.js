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
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        const href = anchor.getAttribute('href');
        if (href === '#') return;

        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          const navHeight = this.navbar?.offsetHeight || 0;
          const top = target.getBoundingClientRect().top + window.pageYOffset - navHeight;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      });
    });
  }

  updateOnScroll() {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 50) {
      this.navbar.classList.add('scrolled');
    } else {
      this.navbar.classList.remove('scrolled');
    }

    if (this.backToTop) {
      if (currentScroll > 500) {
        this.backToTop.classList.add('visible');
      } else {
        this.backToTop.classList.remove('visible');
      }
    }

    if (this.scrollProgress) {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = docHeight > 0 ? (currentScroll / docHeight) * 100 : 0;
      this.scrollProgress.style.width = `${scrollPercent}%`;
    }

    this.lastScroll = currentScroll;
  }
}

export default Navigation;
