/**
 * Scroll-based animations and effects
 */

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

    document.querySelectorAll('.fade-in, .project-card').forEach(el => {
      observer.observe(el);
    });
  }

  setupParallax() {
    const hero = document.getElementById('hero');
    if (!hero) return;

    const heroContent = hero.querySelector('.hero-content');
    if (!heroContent) return;

    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
      return;
    }

    heroContent.style.willChange = 'transform, opacity';
    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        const scrolled = window.pageYOffset;
        if (scrolled < window.innerHeight) {
          const progress = scrolled / window.innerHeight;
          heroContent.style.transform = `translate3d(0, ${scrolled * 0.3}px, 0)`;
          heroContent.style.opacity = `${1 - progress * 0.8}`;
        }
        ticking = false;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
  }
}

export default Animations;
