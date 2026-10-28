const CONTACT_EMAIL = 'hans.rjj12@gmail.com';

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

// Article dialog: title and meta come from the card itself; only the full copy lives in data-copy.
const articleDialog = document.querySelector('#article-dialog');
const dialogTitle = document.querySelector('#dialog-title');
const dialogDate = document.querySelector('#dialog-date');
const dialogTime = document.querySelector('#dialog-time');
const dialogCopy = document.querySelector('#dialog-copy');

document.querySelectorAll('.thought-card').forEach((card) => {
  card.addEventListener('click', () => {
    const [date, time] = card.querySelectorAll('.thought-meta span');
    dialogTitle.textContent = card.querySelector('strong').textContent;
    dialogDate.textContent = date.textContent;
    dialogTime.textContent = time.textContent;
    dialogCopy.textContent = card.dataset.copy;
    articleDialog.showModal();
  });
});

document.querySelector('.dialog-close')?.addEventListener('click', () => articleDialog.close());
// The dialog's own padding is also event.target === dialog, so compare against its box to detect backdrop clicks.
articleDialog?.addEventListener('click', ({ target, clientX: x, clientY: y }) => {
  if (target !== articleDialog) return;
  const box = articleDialog.getBoundingClientRect();
  if (x < box.left || x > box.right || y < box.top || y > box.bottom) articleDialog.close();
});
document.querySelector('.dialog-contact')?.addEventListener('click', () => articleDialog.close());

const contactForm = document.querySelector('#contact-form');
const formFeedback = document.querySelector('#form-feedback');
let feedbackTimer;

contactForm?.addEventListener('submit', (event) => {
  event.preventDefault();

  const values = new FormData(contactForm);
  const subject = 'Portfolio inquiry from ' + values.get('name');
  const body = [
    'Name: ' + values.get('name'),
    'Email: ' + values.get('email'),
    'Topic: ' + values.get('topic'),
    '',
    values.get('message')
  ].join('\n');

  const mailtoLink = 'mailto:' + CONTACT_EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);

  formFeedback.textContent = 'Opening your email app…';
  formFeedback.classList.add('is-visible');
  window.location.href = mailtoLink;

  clearTimeout(feedbackTimer);
  feedbackTimer = setTimeout(() => {
    const direct = document.createElement('a');
    direct.href = 'mailto:' + CONTACT_EMAIL;
    direct.textContent = CONTACT_EMAIL;
    formFeedback.replaceChildren("If your email app didn't open, email me directly at ", direct, '.');
  }, 5000);
});

// Spotlight glow: feed the pointer position to each .glow card (mouse/trackpad only), once per frame.
const glowCards = [...document.querySelectorAll('.glow')];
if (glowCards.length && matchMedia('(hover: hover)').matches) {
  let pointer = null;
  document.addEventListener('pointermove', ({ clientX, clientY }) => {
    if (!pointer) requestAnimationFrame(() => {
      const { x, y } = pointer;
      const xp = (x / window.innerWidth).toFixed(2);
      glowCards.forEach(({ style }) => {
        style.setProperty('--x', x);
        style.setProperty('--y', y);
        style.setProperty('--xp', xp);
      });
      pointer = null;
    });
    pointer = { x: clientX, y: clientY };
  }, { passive: true });
}

// Tools: glass icons play their own entrance when scrolled into view, so GSAP leaves them alone.
const toolIcons = document.querySelector('#tool-icons');
if (toolIcons && window.GlassIcons) {
  GlassIcons(toolIcons, { size: 72, gap: 48, columns: 4, labels: 'always' });
}

// Contact: metal ID card that tilts toward the pointer. No video, so it reflects the built-in soft studio.
const contactCard = document.querySelector('#contact-card');
if (contactCard && window.ReflectiveCard) {
  ReflectiveCard(contactCard, { width: 440, height: 260, statusColor: '#c8ff34' });
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
      gsap.from('.hero-main, .profile-card', { autoAlpha: 0, duration: 0.4, clearProps: 'opacity,visibility' });
      return;
    }

    // Count up plain numbers like "+10"; leave ordinals like "3rd" as written ("1rd" would read wrong).
    const counters = gsap.utils.toArray('.stat strong').flatMap((el) => {
      const [, prefix, digits] = el.textContent.match(/^(\D*)(\d+)$/) || [];
      if (!digits) return [];
      el.textContent = prefix + '0';
      return { el, prefix, target: parseInt(digits, 10), value: 0 };
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
        onUpdate() { counters.forEach((c) => { c.el.textContent = c.prefix + Math.round(c.value); }); }
      }, '<0.1')
      .from('.focus-card', { autoAlpha: 0, y: 30, duration: 0.9, stagger: 0.1, clearProps: 'transform' }, '<0.15');

    // Opacity only (not autoAlpha): visibility:hidden would make unrevealed links and form fields unreachable by Tab.
    const lists = '.project-card, .experience-item, .thought-card, .contact-form > *';
    gsap.set(lists, { opacity: 0, y: 28 });
    ScrollTrigger.batch(lists, {
      start: 'top 90%',
      once: true,
      onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 0.8, ease, stagger: { each: 0.08, amount: 0.3 }, clearProps: 'transform' })
    });
  });
}
