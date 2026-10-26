const navigationLinks = [...document.querySelectorAll('.nav-link')];
const pageSections = [...document.querySelectorAll('main section[id]')];
const backToTop = document.querySelector('.back-to-top');

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    navigationLinks.forEach((link) => {
      const active = link.hash === '#' + entry.target.id;
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  });
}, { rootMargin: '-25% 0px -65% 0px' });

pageSections.forEach((section) => sectionObserver.observe(section));

const updateBackToTop = () => {
  backToTop?.classList.toggle('is-visible', window.scrollY > 500);
};

window.addEventListener('scroll', updateBackToTop, { passive: true });
updateBackToTop();

backToTop?.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

const articleDialog = document.querySelector('#article-dialog');
const dialogTitle = document.querySelector('#dialog-title');
const dialogDate = document.querySelector('#dialog-date');
const dialogTime = document.querySelector('#dialog-time');
const dialogCopy = document.querySelector('#dialog-copy');

document.querySelectorAll('.thought-card').forEach((card) => {
  card.addEventListener('click', () => {
    dialogTitle.textContent = card.dataset.title;
    dialogDate.textContent = card.dataset.date;
    dialogTime.textContent = card.dataset.time;
    dialogCopy.textContent = card.dataset.copy;
    articleDialog.showModal();
  });
});

document.querySelector('.dialog-close')?.addEventListener('click', () => articleDialog.close());
articleDialog?.addEventListener('click', (event) => {
  if (event.target === articleDialog) articleDialog.close();
});
document.querySelector('.dialog-contact')?.addEventListener('click', () => articleDialog.close());

const contactForm = document.querySelector('#contact-form');
const formFeedback = document.querySelector('#form-feedback');

contactForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!contactForm.reportValidity()) return;

  const values = new FormData(contactForm);
  const subject = 'Portfolio inquiry from ' + values.get('name');
  const body = [
    'Name: ' + values.get('name'),
    'Email: ' + values.get('email'),
    'Budget: ' + values.get('budget'),
    '',
    values.get('message')
  ].join('\n');

  // shortcut: placeholder inbox, replace with the real address before deploying.
  const mailtoLink = 'mailto:your@email.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);

  formFeedback.textContent = 'Opening your email app…';
  formFeedback.classList.add('is-visible');
  window.location.href = mailtoLink;

  setTimeout(() => {
    formFeedback.textContent = "If your email app didn't open, copy your message and email me directly.";
  }, 5000);
});

// Spotlight glow: feed the pointer position to each .glow card (mouse/trackpad only).
const glowCards = [...document.querySelectorAll('.glow')];
if (glowCards.length && matchMedia('(hover: hover)').matches) {
  document.addEventListener('pointermove', ({ clientX: x, clientY: y }) => {
    const xp = (x / window.innerWidth).toFixed(2);
    glowCards.forEach(({ style }) => {
      style.setProperty('--x', x);
      style.setProperty('--y', y);
      style.setProperty('--xp', xp);
    });
  }, { passive: true });
}

// Motion: one authored hero entrance, then lists settle in as they arrive.
// Content is visible by default; GSAP only animates *from* an offset state.
if (window.gsap && window.ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);
  const ease = 'expo.out';

  gsap.matchMedia().add({
    motion: '(prefers-reduced-motion: no-preference)',
    reduced: '(prefers-reduced-motion: reduce)'
  }, ({ conditions }) => {
    if (conditions.reduced) {
      gsap.from('.hero-main, .profile-card', { autoAlpha: 0, duration: 0.4, clearProps: 'all' });
      return;
    }

    const counters = gsap.utils.toArray('.stat strong').map((el) => {
      const target = parseInt(el.textContent.replace(/\D/g, ''), 10);
      el.textContent = '+0';
      return { el, target, value: 0 };
    });

    gsap.timeline({ defaults: { ease } })
      .from('.profile-card', { autoAlpha: 0, y: 24, duration: 0.9, clearProps: 'transform' })
      .from('.portrait', { clipPath: 'inset(100% 0 0 0 round 16px)', duration: 1.1, clearProps: 'clipPath' }, '<0.1')
      .from('.orbit path', { strokeDashoffset: 320, autoAlpha: 0, duration: 1.4, stagger: 0.2 }, '<0.3')
      .from('.hero-title span', { yPercent: 105, clipPath: 'inset(0 0 100% 0)', duration: 1, stagger: 0.12, clearProps: 'transform,clipPath' }, 0.15)
      .from('.hero-intro', { autoAlpha: 0, y: 16, duration: 0.8 }, '<0.35')
      .to(counters, {
        value: (i) => counters[i].target,
        duration: 1.6,
        ease: 'power3.out',
        stagger: 0.12,
        onUpdate() { counters.forEach((c) => { c.el.textContent = '+' + Math.round(c.value); }); }
      }, '<0.1')
      .from('.focus-card', { autoAlpha: 0, y: 30, duration: 0.9, stagger: 0.1, clearProps: 'transform' }, '<0.15');

    const lists = '.project-card, .experience-item, .tool-card, .thought-card, .contact-form > *';
    gsap.set(lists, { autoAlpha: 0, y: 28 });
    ScrollTrigger.batch(lists, {
      start: 'top 90%',
      once: true,
      onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.8, ease, stagger: { each: 0.08, amount: 0.3 }, clearProps: 'transform' })
    });
  });
}
