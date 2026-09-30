/**
 * Contact form handling
 */
class ContactForm {
  constructor() {
    this.form = document.getElementById('contact-form');
    this.feedback = document.getElementById('form-feedback');
    this.submitBtn = document.getElementById('submitBtn');

    if (this.form) {
      this.init();
    }
  }

  init() {
    this.form.addEventListener('submit', (e) => this.handleSubmit(e));
    this.setupValidation();
  }

  setupValidation() {
    const inputs = this.form.querySelectorAll('input, textarea');
    inputs.forEach(input => {
      input.addEventListener('blur', () => this.validateField(input));
      input.addEventListener('input', () => this.clearError(input));
    });
  }

  validateField(field) {
    const value = field.value.trim();
    let error = '';

    if (field.hasAttribute('required') && !value) {
      error = 'This field is required';
    } else if (field.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        error = 'Please enter a valid email address';
      }
    }

    if (error) {
      this.showFieldError(field, error);
      return false;
    } else {
      this.clearError(field);
      return true;
    }
  }

  showFieldError(field, message) {
    field.classList.add('error');
    field.style.borderColor = 'var(--color-error)';
    
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) existingError.remove();

    const errorEl = document.createElement('span');
    errorEl.className = 'field-error';
    errorEl.textContent = message;
    errorEl.style.cssText = 'color: var(--color-error); font-size: var(--text-xs); margin-top: var(--space-1); display: block;';
    field.parentNode.appendChild(errorEl);
  }

  clearError(field) {
    field.classList.remove('error');
    field.style.borderColor = '';
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) existingError.remove();
  }

  async handleSubmit(e) {
    e.preventDefault();

    // Validate all fields
    const inputs = this.form.querySelectorAll('input[required], textarea[required]');
    let isValid = true;
    inputs.forEach(input => {
      if (!this.validateField(input)) isValid = false;
    });

    if (!isValid) {
      this.showFeedback('Please fix the errors above', 'error');
      return;
    }

    this.submitBtn.disabled = true;
    this.submitBtn.querySelector('span').textContent = 'Opening Email...';

    const formData = new FormData(this.form);
    const subject = `Portfolio inquiry from ${formData.get('name')}`;
    const body = [
      `Name: ${formData.get('name')}`,
      `Email: ${formData.get('email')}`,
      '',
      formData.get('message')
    ].join('\n');

    this.showFeedback('Opening your email app...', 'success');
    window.location.href = `mailto:hans.rjj12@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    this.submitBtn.disabled = false;
    this.submitBtn.querySelector('span').textContent = 'Send Message';
  }

  showFeedback(message, type) {
    this.feedback.textContent = message;
    this.feedback.className = `form-feedback ${type}`;
    this.feedback.style.display = 'block';
  }

  hideFeedback() {
    this.feedback.style.display = 'none';
    this.feedback.className = 'form-feedback';
  }
}

export default ContactForm;
