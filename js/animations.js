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

}

export default Animations;
