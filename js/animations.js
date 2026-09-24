/**
 * Scroll-based animations and effects
 */
import { utils } from './utils.js';

class Animations {
  constructor() {
    this.observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -80px 0px'
    };

    this.init();
  }

  init() {
    this.setupIntersectionObserver();
    this.setupParallax();
  }

  setupIntersectionObserver() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, this.observerOptions);

    // Observe fade-in elements
    document.querySelectorAll('.fade-in, .project-card').forEach(el => {
      observer.observe(el);
    });
  }

  setupParallax() {
    const hero = document.getElementById('hero');
    if (!hero) return;

    const heroContent = hero.querySelector('.hero-content');
    if (!heroContent) return;

    // Only on non-touch devices
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      return;
    }

    const handleScroll = utils.throttle(() => {
      const scrolled = window.pageYOffset;
      if (scrolled < window.innerHeight) {
        heroContent.style.transform = `translateY(${scrolled * 0.3}px)`;
        heroContent.style.opacity = 1 - (scrolled / window.innerHeight) * 0.8;
      }
    }, 16);

    window.addEventListener('scroll', handleScroll, { passive: true });
  }
}

export default Animations;
