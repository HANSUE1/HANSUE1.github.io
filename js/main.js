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
  // Stages: landing page (splash) → dev title (#name-portal, the HANS GlyphPortal) → portfolio. While the title
  // still covers most of the screen, html.title-stage hides the portfolio's chrome (nav, pinned profile card,
  // back-to-top); as it scrolls off, the class drops and 'title:leave' lets the card play its entrance.
  const initTitleStage = () => {
    const title = document.querySelector('#name-portal');
    if (!title) return;
    const root = document.documentElement;
    const update = () => {
      const onStage = title.getBoundingClientRect().bottom > window.innerHeight * 0.5;
      if (root.classList.contains('title-stage') === onStage) return;
      root.classList.toggle('title-stage', onStage);
      if (!onStage) document.dispatchEvent(new Event('title:leave'));
    };
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  };

  // Runs once the dev title has scrolled off (or right away when there is none, or it is already gone).
  const afterTitle = (run) => {
    if (document.documentElement.classList.contains('title-stage')) document.addEventListener('title:leave', run, { once: true });
    else run();
  };

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

  // Profile card: React Bits ReflectiveCard. Width comes from the page CSS and height from its content; no video,
  // so it reflects the built-in soft studio. Started after the splash so its light sweep is actually seen.
  const initProfileCard = () => {
    const card = document.querySelector('#profile-card');
    if (!card || !window.ReflectiveCard) return;
    afterIntro(() => afterTitle(() => ReflectiveCard(card, { width: '100%', height: 'auto', statusColor: '#c8ff34', tiltStrength: 10 })));
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

      // Built now (paused) so the from() states hide them before the splash lifts. The card plays as the splash
      // leaves; the hero text sits below the opening name title, so it plays when it scrolls into view.
      const card = gsap.timeline({ defaults: { ease }, paused: true })
        // fromTo, not from: while the title stage hides the card, from() would capture opacity 0 as its end state.
        .fromTo('.profile-card', { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.9, clearProps: 'transform' })
        .from('.profile-photo', { clipPath: 'inset(100% 0 0 0 round 14px)', duration: 1.1, clearProps: 'clipPath' }, '<0.1');
      const hero = gsap.timeline({ defaults: { ease }, paused: true });
      afterIntro(() => {
        afterTitle(() => card.play());
        ScrollTrigger.create({ trigger: '.hero-main', start: 'top 85%', once: true, onEnter: () => hero.play() });
      });
      hero
        .from('.hero-title span', { yPercent: 105, clipPath: 'inset(0 0 100% 0)', duration: 1, stagger: 0.12, clearProps: 'transform,clipPath' })
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

  initTitleStage();
  initNavHighlight();
  initBackToTop();
  initArticleDialog();
  initContactForm();
  initToolIcons();
  initProfileCard();
  initMotion();
})();
