/**
 * Utility functions for the portfolio
 */

export const utils = {
  /**
   * Debounce function to limit execution rate
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * Throttle function to limit execution rate
   */
  throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },

  /**
   * Check if element is in viewport
   */
  isInViewport(element, offset = 0) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top <= (window.innerHeight || document.documentElement.clientHeight) - offset &&
      rect.bottom >= offset
    );
  },

  /**
   * Smooth scroll to element
   */
  smoothScrollTo(target, offset = 0) {
    const element = typeof target === 'string' ? document.querySelector(target) : target;
    if (!element) return;

    const navHeight = document.querySelector('.navbar')?.offsetHeight || 0;
    const targetPosition = element.getBoundingClientRect().top + window.pageYOffset - navHeight - offset;

    window.scrollTo({
      top: targetPosition,
      behavior: 'smooth'
    });
  },

  /**
   * Get query string parameter
   */
  getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
  },

  /**
   * Set query string parameter
   */
  setQueryParam(param, value) {
    const url = new URL(window.location);
    url.searchParams.set(param, value);
    window.history.pushState({}, '', url);
  },

  /**
   * Local storage helpers
   */
  storage: {
    get(key, defaultValue = null) {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
      } catch {
        return defaultValue;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        // Ignore storage errors
      }
    },
    remove(key) {
      try {
        localStorage.removeItem(key);
      } catch {
        // Ignore storage errors
      }
    }
  }
};
