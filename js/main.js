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
    document.querySelectorAll('main section[id]:not(.rail-tools)').forEach((section) => observer.observe(section));
  };

  // On wide screens the profile column is pinned but taller than the screen. It rides along with the page until its end
  // shows and comes back the same way, so the card greets you and the tools under the graph can still be reached.
  const initRail = () => {
    const column = document.querySelector('.profile-column');
    const hero = document.querySelector('.hero');
    if (!column || !hero) return;
    const wide = window.matchMedia('(min-width: 821px)');
    const heroTop = () => hero.getBoundingClientRect().top + window.scrollY;
    const room = () => Math.max(0, column.offsetTop + column.offsetHeight + 24 - window.innerHeight);
    // Measured from the hero on every scroll: the title above it grows after load, so a stored position goes stale.
    let offset = 0;
    let last = 0;
    const update = () => {
      const past = Math.max(0, window.scrollY - heroTop());
      offset = wide.matches && past ? Math.min(room(), Math.max(0, offset + past - last)) : 0;
      last = past;
      column.style.transform = offset ? `translateY(${-offset}px)` : '';
    };
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    // A link can't scroll to something pinned, so the Tools link and keyboard focus move the page by the difference instead.
    document.querySelector('.nav-link[href="#tools"]')?.addEventListener('click', (event) => {
      if (!wide.matches) return;
      event.preventDefault();
      window.scrollTo({ top: Math.max(window.scrollY, heroTop()) + room() - offset, behavior: 'smooth' });
    });
    column.addEventListener('focusin', (event) => {
      if (!wide.matches) return;
      const box = event.target.getBoundingClientRect();
      const below = box.bottom + 24 - window.innerHeight;
      const above = 96 - box.top;
      if (below > 0) window.scrollBy({ top: below, behavior: 'instant' });
      else if (above > 0) window.scrollBy({ top: -above, behavior: 'instant' });
    });
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
    if (!root || !window.GlassIcons) return;
    // Four across in whatever width the column has.
    const gap = 30;
    const size = Math.min(50, Math.floor((root.clientWidth - gap * 3) / 4));
    GlassIcons(root, { size, gap, columns: 4, labels: 'always' });
  };

  // GitHub contributions: the year comes from GitHub's calendar (as JSON, since the ghchart image tells browsers to keep
  // it for a day, so that image is only the fallback). The calendar stops at today's UTC date but files commits under
  // the committer's own date, so anything committed after midnight here stays off it until 8am. The last few days are
  // therefore topped up from the live commits API, in the owner's time zone.
  const GITHUB_USER = 'HANSUE1';
  const GITHUB_TIME_ZONE = 'Asia/Manila';
  const GITHUB_RECENT_DAYS = 3;

  const getJson = async (url) => {
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error(url + ' returned ' + response.status);
    return response.json();
  };

  const ownerDate = (when) => new Date(when).toLocaleDateString('en-CA', { timeZone: GITHUB_TIME_ZONE }); // YYYY-MM-DD
  const nextDate = (date) => new Date(Date.parse(date + 'T00:00:00Z') + 864e5).toISOString().slice(0, 10);

  // Commits per day across recently pushed repos. Default branches and non-forks only, as GitHub itself counts them.
  const fetchRecentCommits = async () => {
    const since = new Date(Date.now() - GITHUB_RECENT_DAYS * 864e5).toISOString();
    const repos = await getJson('https://api.github.com/users/' + GITHUB_USER + '/repos?sort=pushed&per_page=30');
    const active = repos.filter((repo) => !repo.fork && repo.pushed_at >= since);
    const lists = await Promise.all(active.map((repo) => getJson('https://api.github.com/repos/' + repo.full_name + '/commits?per_page=100&author=' + GITHUB_USER + '&since=' + since)));
    const counts = {};
    lists.flat().forEach(({ commit }) => {
      const day = ownerDate(commit.author.date);
      counts[day] = (counts[day] || 0) + 1;
    });
    return counts;
  };

  // Adds the days the calendar hasn't reached, then keeps the higher count per day: the calendar also counts issues and
  // pull requests, and taking the higher rather than the sum means nothing doubles once GitHub catches up.
  const withRecentCommits = (calendar, recent) => {
    const days = [...calendar];
    const today = ownerDate(Date.now());
    for (let date = nextDate(days.at(-1).date); date <= today; date = nextDate(date)) days.push({ date, count: 0, level: 0 });
    // GitHub's shading is relative to the year's busiest days, so reuse the level of days with a similar count.
    const levelFor = (count) => Math.max(1, ...calendar.filter((day) => day.count <= count).map((day) => day.level));
    return days.map((day) => {
      const count = recent[day.date] || 0;
      return count > day.count ? { ...day, count, level: levelFor(count) } : day;
    });
  };

  // The graph previews the last two months and this one. The days still to come stay as blanks, so its shape holds all month.
  const recentMonths = (days) => {
    const [year, month] = ownerDate(Date.now()).split('-').map(Number);
    const isoDate = (monthIndex, day) => new Date(Date.UTC(year, monthIndex, day)).toISOString().slice(0, 10);
    const from = isoDate(month - 3, 1);
    const to = isoDate(month, 0);
    const shown = days.filter((day) => day.date >= from);
    for (let date = nextDate(shown.at(-1).date); date <= to; date = nextDate(date)) shown.push({ date, count: 0, level: 'none' });
    return shown;
  };

  const renderGithubGraph = (graph, days) => {
    const make = (tag, className, text) => {
      const el = document.createElement(tag);
      if (className) el.className = className;
      if (text) el.textContent = text;
      return el;
    };
    // Dates are calendar days, so read and print them in UTC or they shift a day in some time zones.
    const parse = (date) => new Date(date + 'T00:00:00Z');
    const format = (date, options) => parse(date).toLocaleDateString('en-US', { timeZone: 'UTC', ...options });
    const plural = (count) => count + (count === 1 ? ' contribution' : ' contributions');

    const firstRow = parse(days[0].date).getUTCDay();
    const weeks = Math.ceil((firstRow + days.length) / 7);
    const cells = make('span', 'github-cells');
    const months = make('span', 'github-months');
    graph.style.setProperty('--weeks', weeks);

    days.forEach((day, i) => {
      const cell = make('span', 'github-cell');
      cell.dataset.level = day.level;
      if (day.level !== 'none') cell.dataset.tip = plural(day.count) + ' on ' + format(day.date, { month: 'short', day: 'numeric', year: 'numeric' });
      if (i === 0) cell.style.gridRowStart = firstRow + 1;
      cells.append(cell);

      // Label each month over the week it starts in.
      if (parse(day.date).getUTCDate() === 1) {
        const label = make('span', '', format(day.date, { month: 'short' }));
        label.style.gridColumnStart = Math.floor((firstRow + i) / 7) + 1;
        months.append(label);
      }
    });

    const total = days.reduce((sum, day) => sum + day.count, 0);
    const latest = days.findLast((day) => day.count > 0);
    const range = format(days[0].date, { month: 'short' }) + '–' + format(days.at(-1).date, { month: 'short' });
    const summary = plural(total) + ' in ' + range + (latest ? ', latest ' + format(latest.date, { month: 'short', day: 'numeric' }) : '');
    const caption = make('span', '', summary);
    const legend = make('span', 'github-legend');
    legend.setAttribute('aria-hidden', 'true');
    legend.append(make('span', '', 'Less'));
    [0, 1, 2, 3, 4].forEach((level) => {
      const swatch = make('span', 'github-cell');
      swatch.dataset.level = level;
      legend.append(swatch);
    });
    legend.append(make('span', '', 'More'));
    const foot = make('span', 'github-foot');
    foot.append(caption, legend);

    // The caption doubles as the hover readout, so nothing can spill past the edge of the narrow column.
    cells.addEventListener('mouseover', ({ target }) => { caption.textContent = target.dataset.tip || summary; });
    cells.addEventListener('mouseleave', () => { caption.textContent = summary; });
    cells.setAttribute('aria-hidden', 'true');
    months.setAttribute('aria-hidden', 'true');
    graph.replaceChildren(months, cells, foot);
  };

  const initGithubGraph = async () => {
    const graph = document.querySelector('#github-graph');
    if (!graph) return;
    try {
      // Commits are only a top-up: if they fail (say GitHub's 60 requests an hour per visitor), show the calendar alone.
      const [{ contributions }, recent] = await Promise.all([
        getJson('https://github-contributions-api.jogruber.de/v4/' + GITHUB_USER + '?y=last'),
        fetchRecentCommits().catch(() => null)
      ]);
      renderGithubGraph(graph, recentMonths(recent ? withRecentCommits(contributions, recent) : contributions));
    } catch {
      // The date in the URL gets round the image's day-long browser cache. If this fails too, drop the block.
      const image = new Image(663, 104);
      image.alt = 'GitHub contribution graph for ' + GITHUB_USER;
      image.onerror = () => graph.closest('a').remove();
      image.src = 'https://ghchart.rshah.org/' + GITHUB_USER + '?d=' + new Date().toISOString().slice(0, 10);
      graph.replaceChildren(image);
      graph.style.aspectRatio = 'auto';
    }
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
        const fade = gsap.from('.hero-main, .profile-column', { autoAlpha: 0, duration: 0.4, clearProps: 'opacity,visibility', paused: Boolean(window.splashActive) });
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
        .from('.profile-card', { autoAlpha: 0, y: 24, duration: 0.9, clearProps: 'transform' })
        .from('.profile-photo', { clipPath: 'inset(100% 0 0 0 round 14px)', duration: 1.1, clearProps: 'clipPath' }, '<0.1')
        .from('.hero-github', { autoAlpha: 0, y: 16, duration: 0.8, clearProps: 'transform' }, '<0.15');
      const hero = gsap.timeline({ defaults: { ease }, paused: true });
      afterIntro(() => {
        afterTitle(() => card.play());
        ScrollTrigger.create({ trigger: '.hero-main', start: 'top 85%', once: true, onEnter: () => hero.play() });
      });
      hero
        .from('.hero-title span', { yPercent: 105, clipPath: 'inset(0 0 100% 0)', duration: 1, stagger: 0.12, clearProps: 'transform,clipPath' })
        .from('.hero-intro', { autoAlpha: 0, y: 16, duration: 0.8 }, '<0.35')
        .to(counters, {
          value: (i) => counters[i].target,
          duration: 1.6,
          ease: 'power3.out',
          stagger: 0.12,
          onUpdate() { counters.forEach((c) => { c.el.textContent = c.prefix + Math.round(c.value); }); }
        }, '<0.1');

      // "Trace it." stays dark until light crosses it: one sweep as it lands, then wherever the mouse goes.
      const traced = document.querySelector('.hero-title .muted-title');
      if (traced) {
        const light = { x: -170, y: 0, r: 0 };
        const paintLight = () => {
          traced.style.setProperty('--trace-x', light.x + 'px');
          traced.style.setProperty('--trace-y', light.y + 'px');
          traced.style.setProperty('--trace-r', light.r + 'px');
        };
        const followX = gsap.quickTo(light, 'x', { duration: 0.35, ease: 'power3', onUpdate: paintLight });
        const followY = gsap.quickTo(light, 'y', { duration: 0.35, ease: 'power3', onUpdate: paintLight });
        hero
          .to(light, { r: 180, duration: 0.25, onUpdate: paintLight }, 0.9)
          .fromTo(light, { x: -170, y: () => traced.offsetHeight / 2 }, { x: () => traced.offsetWidth + 170, duration: 1.4, ease: 'power1.inOut', onUpdate: paintLight }, 0.9)
          .to(light, { r: 0, duration: 0.3, onUpdate: paintLight });
        let lit = false;
        window.addEventListener('pointermove', (event) => {
          if (event.pointerType !== 'mouse' || hero.isActive()) return;
          const box = traced.getBoundingClientRect();
          const x = event.clientX - box.left;
          const y = event.clientY - box.top;
          const near = x > -170 && x < box.width + 170 && y > -130 && y < box.height + 130;
          if (near) { followX(x, lit ? undefined : x); followY(y, lit ? undefined : y); }
          if (near === lit) return;
          lit = near;
          gsap.to(light, { r: near ? 180 : 0, duration: 0.3, overwrite: 'auto', onUpdate: paintLight });
        }, { passive: true });
      }

      // Title → portfolio: a plain cross-fade tied to scroll. The dev title fades out as its last screen scrolls off
      // and the hero fades in as it arrives; scrolling back up reverses both.
      if (document.querySelector('#name-portal')) {
        // immediateRender off: an inline opacity:1 written now would override the CSS that hides the title under the splash.
        gsap.fromTo('#name-portal', { opacity: 1 }, {
          opacity: 0, ease: 'none', immediateRender: false,
          scrollTrigger: { trigger: '#name-portal', start: 'bottom 85%', end: 'bottom 30%', scrub: true }
        });
        gsap.fromTo('.hero-main', { opacity: 0 }, {
          opacity: 1, ease: 'none',
          scrollTrigger: { trigger: '.hero', start: 'top 80%', end: 'top 25%', scrub: true }
        });
      }

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
  initRail();
  initBackToTop();
  initArticleDialog();
  initContactForm();
  initToolIcons();
  initGithubGraph();
  initProfileCard();
  initMotion();
})();
