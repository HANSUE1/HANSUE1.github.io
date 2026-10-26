const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });

document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));
const pageSections = [...document.querySelectorAll('main section[id]')];
const profileCard = document.querySelector('.profile-card');
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

const updateProfileRail = () => {
  if (profileCard) profileCard.classList.remove('is-pinned');
};

const updateBackToTop = () => {
  if (backToTop) {
    backToTop.classList.toggle('is-visible', window.scrollY > 500);
  }
};

window.addEventListener('scroll', () => {
  updateProfileRail();
  updateBackToTop();
}, { passive: true });

window.addEventListener('resize', updateProfileRail, { passive: true });
updateProfileRail();
updateBackToTop();

if (backToTop) {
  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

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

  const mailtoLink = 'mailto:your@email.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  
  formFeedback.textContent = 'Opening your email app...';
  formFeedback.classList.add('is-visible');
  
  window.location.href = mailtoLink;
  
  setTimeout(() => {
    formFeedback.textContent = 'If your email app did not open, please copy the details and email directly.';
    formFeedback.classList.remove('is-visible');
  }, 5000);
});
