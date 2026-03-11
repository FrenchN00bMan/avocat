const burger = document.getElementById('burger');
const nav = document.getElementById('mainNav');

if (burger && nav) {
  burger.addEventListener('click', () => {
    nav.classList.toggle('open');
    burger.classList.toggle('open');
  });
}

const normalizePath = (value) => {
  if (!value) return '/';
  return value.length > 1 ? value.replace(/\/+$/, '') : value;
};

const currentPath = normalizePath(window.location.pathname);
document.querySelectorAll('.main-nav a').forEach((link) => {
  const href = normalizePath(link.getAttribute('href'));
  if (href === currentPath) {
    link.classList.add('active');
  }
});

const revealEls = document.querySelectorAll('.why-item, .domain-item, .practice-card, .article-card, .blog-card');
if ('IntersectionObserver' in window && revealEls.length) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  revealEls.forEach((element, index) => {
    element.style.opacity = '0';
    element.style.transform = 'translateY(16px)';
    element.style.transition = `opacity 0.5s ease ${index * 0.05}s, transform 0.5s ease ${index * 0.05}s`;
    observer.observe(element);
  });
}
