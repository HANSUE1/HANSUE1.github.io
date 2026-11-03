// Page behaviour. Each init* function owns one feature and returns early if its markup is missing.
// Wrapped in a function so these names stay private: top-level consts in a classic script share one
// global scope with every other script, and a repeated name would stop the later script from running.
(() => {
  const CONTACT_EMAIL = 'hans.rjj12@gmail.com';

  // The splash (js/splash.js) covers the page on the first visit of a session. Hero motion waits for it to
  // start fading out; if there's no splash, or it already left while GSAP was downloading, run right away.
  const afterIntro = (run) => {
    if (window.splashActive) document.addEventListener('intro:done', run, { once: true });
    else run();
  };

  // Count-ups rewrite their text every frame; screen readers get the final value from a hidden copy instead.
  const freezeForScreenReaders = (el) => {
    const real = document.createElement('span');
    real.className = 'sr-only';
    real.textContent = el.textContent;
    el.before(real);
    el.setAttribute('aria-hidden', 'true');
  };

  // Nav: mark the link for the section crossing the upper-middle band of the viewport. A section without a
  // nav link keeps the previous highlight instead of clearing every link.
  const initNavHighlight = () => {
    const links = [...document.querySelectorAll('.nav-link')];
    const linkFor = (id) => links.find((link) => link.hash === '#' + id);
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const current = entry.isIntersecting && linkFor(entry.target.id);
        if (!current) return;
        links.forEach((link) => {
          if (link === current) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-25% 0px -65% 0px' });
    document.querySelectorAll('main section[id]').forEach((section) => observer.observe(section));
  };

  const initBackToTop = () => {
    const button = document.querySelector('.back-to-top');
    if (!button) return;
    const update = () => button.classList.toggle('is-visible', window.scrollY > 500);
    window.addEventListener('scroll', update, { passive: true });
    update();
    button.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  };

  // Article dialog: title and meta come from the card itself; only the full copy lives in data-copy.
  const initArticleDialog = () => {
    const dialog = document.querySelector('#article-dialog');
    if (!dialog) return;
    const field = (id) => dialog.querySelector('#' + id);

    document.querySelectorAll('.thought-card').forEach((card) => {
      card.addEventListener('click', () => {
        const [date, time] = card.querySelectorAll('.thought-meta span');
        field('dialog-title').textContent = card.querySelector('strong').textContent;
        field('dialog-date').textContent = date.textContent;
        field('dialog-time').textContent = time.textContent;
        field('dialog-copy').textContent = card.dataset.copy;
        dialog.showModal();
      });
    });

    dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
    dialog.querySelector('.dialog-contact').addEventListener('click', () => dialog.close());
    // The dialog's own padding is also event.target === dialog, so compare against its box to detect backdrop clicks.
    dialog.addEventListener('click', ({ target, clientX: x, clientY: y }) => {
      if (target !== dialog) return;
      const box = dialog.getBoundingClientRect();
      if (x < box.left || x > box.right || y < box.top || y > box.bottom) dialog.close();
    });
  };

  // Contact form: no backend, so it prepares an email in the visitor's mail app, with a direct address as fallback.
  const initContactForm = () => {
    const form = document.querySelector('#contact-form');
    const feedback = document.querySelector('#form-feedback');
    if (!form || !feedback) return;
    let fallbackTimer;

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const values = new FormData(form);
      const subject = 'Portfolio inquiry from ' + values.get('name');
      const body = [
        'Name: ' + values.get('name'),
        'Email: ' + values.get('email'),
        'Topic: ' + values.get('topic'),
        '',
        values.get('message')
      ].join('\n');

      feedback.textContent = 'Opening your email app…';
      feedback.classList.add('is-visible');
      window.location.href = 'mailto:' + CONTACT_EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);

      clearTimeout(fallbackTimer);
      fallbackTimer = setTimeout(() => {
        const direct = document.createElement('a');
        direct.href = 'mailto:' + CONTACT_EMAIL;
        direct.textContent = CONTACT_EMAIL;
        feedback.replaceChildren("If your email app didn't open, email me directly at ", direct, '.');
      }, 5000);
    });
  };

  // Tools: glass icons play their own entrance when scrolled into view, so GSAP leaves them alone.
  const initToolIcons = () => {
    const root = document.querySelector('#tool-icons');
    if (root && window.GlassIcons) GlassIcons(root, { size: 72, gap: 48, columns: 4, labels: 'always' });
  };

  // Projects: one glass folder holding every project card's screenshot, each file linking to its repository.
  // Built from the cards themselves, so a new project only has to be added once.
  const initProjectFolder = () => {
    const root = document.querySelector('#project-folder');
    if (!root || !window.GlassFolder) return;
    const files = [...document.querySelectorAll('.project-card')].map((card) => ({
      name: card.querySelector('h3').textContent,
      meta: card.querySelector('.project-tags li')?.textContent,
      image: card.querySelector('.project-image img').getAttribute('src'),
      href: card.href
    }));
    GlassFolder(root, {
      label: 'Project files',
      tone: 'dark',
      art: 'ember',
      seed: 7,
      width: 'fit',
      action: 'more',
      files,
      menu: [{ label: 'All repositories on GitHub', onSelect: () => window.open('https://github.com/HANSUE1?tab=repositories', '_blank', 'noopener') }]
    });
  };

  // Profile card: React Bits ReflectiveCard. Width comes from the page CSS and height from its content; no video,
  // so it reflects the built-in soft studio. Started after the splash so its light sweep is actually seen.
  const initProfileCard = () => {
    const card = document.querySelector('#profile-card');
    if (!card || !window.ReflectiveCard) return;
    afterIntro(() => ReflectiveCard(card, { width: '100%', height: 'auto', statusColor: '#c8ff34', tiltStrength: 10 }));
  };

  // Motion: one authored hero entrance, then lists settle in as they arrive.
  // Content is visible by default; GSAP only animates *from* an offset state, so without GSAP the page is static.
  const initMotion = () => {
    if (!window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);
    const ease = 'expo.out';

    gsap.matchMedia().add({
      motion: '(prefers-reduced-motion: no-preference)',
      reduced: '(prefers-reduced-motion: reduce)'
    }, ({ conditions }) => {
      if (conditions.reduced) {
        // Paused like the full entrance, otherwise the fade finishes unseen under the splash.
        const fade = gsap.from('.hero-main, .profile-card', { autoAlpha: 0, duration: 0.4, clearProps: 'opacity,visibility', paused: Boolean(window.splashActive) });
        afterIntro(() => fade.play());
        return;
      }

      // Count up plain numbers like "+10"; leave ordinals like "3rd" as written ("1rd" would read wrong).
      const counters = gsap.utils.toArray('.stat strong').flatMap((el) => {
        const [, prefix, digits] = el.textContent.match(/^(\D*)(\d+)$/) || [];
        if (!digits) return [];
        freezeForScreenReaders(el);
        el.textContent = prefix + '0';
        return { el, prefix, target: parseInt(digits, 10), value: 0 };
      });

      // Built now (paused during the splash) so the from() states hide the hero before the splash lifts.
      const hero = gsap.timeline({ defaults: { ease }, paused: Boolean(window.splashActive) });
      afterIntro(() => hero.play());
      hero
        .from('.profile-card', { autoAlpha: 0, y: 24, duration: 0.9, clearProps: 'transform' })
        .from('.profile-photo', { clipPath: 'inset(100% 0 0 0 round 14px)', duration: 1.1, clearProps: 'clipPath' }, '<0.1')
        .from('.hero-title span', { yPercent: 105, clipPath: 'inset(0 0 100% 0)', duration: 1, stagger: 0.12, clearProps: 'transform,clipPath' }, 0.15)
        .from('.hero-intro', { autoAlpha: 0, y: 16, duration: 0.8 }, '<0.35')
        .from('.hero-github', { autoAlpha: 0, y: 16, duration: 0.8, clearProps: 'transform' }, '<0.15')
        .to(counters, {
          value: (i) => counters[i].target,
          duration: 1.6,
          ease: 'power3.out',
          stagger: 0.12,
          onUpdate() { counters.forEach((c) => { c.el.textContent = c.prefix + Math.round(c.value); }); }
        }, '<0.1')
        .from('.focus-card', { autoAlpha: 0, y: 30, duration: 0.9, stagger: 0.1, clearProps: 'transform' }, '<0.15');

      // Soft skills: once per row, the meter lights up tick by tick while its percentage counts up.
      gsap.utils.toArray('.skill').forEach((skill) => {
        const meter = skill.querySelector('.skill-meter');
        const label = skill.querySelector('.skill-value');
        const target = parseFloat(skill.style.getPropertyValue('--value')) || 0;
        const level = { value: 0 };
        const draw = () => {
          meter.style.setProperty('--fill', Math.round(level.value / 5) * 5);
          label.textContent = Math.round(level.value) + '%';
        };
        freezeForScreenReaders(label);
        draw();
        gsap.timeline({ scrollTrigger: { trigger: skill, start: 'top 88%', once: true } })
          .from(skill.querySelector('p'), { opacity: 0, y: 14, duration: 0.8, ease })
          .to(level, { value: target, duration: 1.5, ease: 'power2.out', onUpdate: draw, onComplete: () => meter.style.removeProperty('--fill') }, 0.1);
      });

      // Opacity only (not autoAlpha): visibility:hidden would make unrevealed links and form fields unreachable by Tab.
      const lists = '.project-card, .experience-item, .thought-card, .contact-form > *';
      gsap.set(lists, { opacity: 0, y: 28 });
      ScrollTrigger.batch(lists, {
        start: 'top 90%',
        once: true,
        onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 0.8, ease, stagger: { each: 0.08, amount: 0.3 }, clearProps: 'transform' })
      });
    });
  };

  initNavHighlight();
  initBackToTop();
  initArticleDialog();
  initContactForm();
  initToolIcons();
  initProjectFolder();
  initProfileCard();
  initMotion();
})();
