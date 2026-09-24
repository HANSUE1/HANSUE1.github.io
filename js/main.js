/**
 * Portfolio Main Application
 * Entry point for initializing all modules
 */

import Navigation from './navigation.js';
import Animations from './animations.js';
import Projects from './projects.js';
import ContactForm from './contact.js';

/**
 * Initialize the application
 */
function init() {
  addScrollProgress();
  addBackToTop();
  initTheme();

  new Navigation();
  new Animations();
  new Projects();
  new ContactForm();

  console.log('Portfolio initialized successfully');
}

/**
 * Initialize theme toggle
 */
function initTheme() {
  const toggle = document.getElementById('themeToggle');
  if (!toggle) return;

  const savedTheme = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = savedTheme || (prefersDark ? 'dark' : 'light');

  document.documentElement.setAttribute('data-theme', theme);

  toggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  });
}

/**
 * Add scroll progress indicator
 */
function addScrollProgress() {
  const progress = document.createElement('div');
  progress.className = 'scroll-progress';
  document.body.prepend(progress);
}

/**
 * Add back to top button
 */
function addBackToTop() {
  const button = document.createElement('button');
  button.className = 'back-to-top';
  button.setAttribute('aria-label', 'Back to top');
  button.innerHTML = `
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"/>
    </svg>
  `;
  document.body.appendChild(button);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
