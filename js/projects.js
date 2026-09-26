/**
 * Projects data and filtering
 */
class Projects {
  constructor() {
    this.container = document.querySelector('.projects-grid');
    this.filterButtons = document.querySelectorAll('.filter-btn');
    this.currentFilter = 'all';
    this.projects = [
      {
        id: 1,
        title: "E-Commerce Platform",
        description: "A full-featured online store with payment integration, inventory management, and admin dashboard.",
        tags: ["React", "Node.js", "MongoDB"],
        gradient: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
        icon: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      },
      {
        id: 2,
        title: "Mobile Banking App",
        description: "A secure mobile banking application with biometric authentication and real-time transaction tracking.",
        tags: ["React Native", "Firebase", "TypeScript"],
        gradient: "linear-gradient(135deg, #a855f7 0%, #ec4899 100%)",
        icon: "M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
      },
      {
        id: 3,
        title: "Analytics Dashboard",
        description: "Interactive data visualization dashboard with real-time analytics and customizable reports.",
        tags: ["Vue.js", "D3.js", "PostgreSQL"],
        gradient: "linear-gradient(135deg, #10b981 0%, #14b8a6 100%)",
        icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      },
      {
        id: 4,
        title: "Content Management System",
        description: "A headless CMS with a beautiful admin interface, media library, and API-first architecture.",
        tags: ["Next.js", "GraphQL", "Prisma"],
        gradient: "linear-gradient(135deg, #f97316 0%, #ef4444 100%)",
        icon: "M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9a2 2 0 00-2 2v1"
      },
      {
        id: 5,
        title: "Social Media Platform",
        description: "A modern social platform with real-time messaging, content sharing, and community features.",
        tags: ["React", "Socket.io", "Redis"],
        gradient: "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)",
        icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
      },
      {
        id: 6,
        title: "AI-Powered Chatbot",
        description: "An intelligent chatbot using natural language processing for customer support automation.",
        tags: ["Python", "TensorFlow", "FastAPI"],
        gradient: "linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)",
        icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
      }
    ];

    this.init();
  }

  init() {
    if (!this.container) return;

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
