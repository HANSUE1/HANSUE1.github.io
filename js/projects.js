/**
 * Projects data and filtering
 */
class Projects {
  constructor() {
    this.container = document.querySelector('.projects-grid');
    this.filterButtons = document.querySelectorAll('.filter-btn');
    this.currentFilter = 'all';
    this.projects = [];

    this.init();
  }

  async init() {
    if (!this.container) return;

    try {
      const response = await fetch('data/projects.json');
      this.projects = await response.json();
    } catch (error) {
      console.error('Failed to load projects:', error);
      this.projects = [];
    }

    this.renderProjects(this.projects);
    this.setupFilters();
  }

  renderProjects(projectsToRender) {
    this.container.innerHTML = projectsToRender.map((project, index) => `
      <article class="project-card card fade-in stagger-${(index % 6) + 1}" data-category="all">
        <div class="project-image" style="background: ${project.gradient}">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="${project.icon}"/>
          </svg>
        </div>
        <div class="project-content">
          <h3 class="project-title">${project.title}</h3>
          <p class="project-description">${project.description}</p>
          <div class="project-tags">
            ${project.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
          </div>
        </div>
      </article>
    `).join('');

    // Re-observe new elements for animations
    setTimeout(() => {
      document.querySelectorAll('.project-card.fade-in').forEach(el => {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
              observer.unobserve(entry.target);
            }
          });
        }, { threshold: 0.1, rootMargin: '0px 0px -80px 0px' });
        observer.observe(el);
      });
    }, 100);
  }

  setupFilters() {
    this.filterButtons.forEach(button => {
      button.addEventListener('click', () => {
        const filter = button.dataset.filter;
        this.currentFilter = filter;

        // Update active button
        this.filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        // Filter projects
        if (filter === 'all') {
          this.renderProjects(this.projects);
        } else {
          const filtered = this.projects.filter(project => 
            project.tags.some(tag => tag.toLowerCase().includes(filter.toLowerCase()))
          );
          this.renderProjects(filtered);
        }
      });
    });
  }
}

export default Projects;
