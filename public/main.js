// Scroll Reveal
document.addEventListener('DOMContentLoaded', () => {
  const reveals = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });
  reveals.forEach(el => observer.observe(el));

  // Nav scroll effect
  const nav = document.querySelector('nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.style.boxShadow = window.scrollY > 50 ? '0 4px 40px rgba(0,0,0,0.5)' : 'none';
    });
  }

  // Active nav link
  const path = window.location.pathname;
  document.querySelectorAll('.nav-links a').forEach(a => {
    if (a.getAttribute('href') === path || (path.startsWith('/blog') && a.getAttribute('href') === '/blog.html')) {
      a.classList.add('active');
    }
  });
});

// Form submit handler
function handleFormSubmit(btn) {
  const original = btn.textContent;
  btn.textContent = '✓ Gönderildi!';
  btn.style.background = '#4ade80';
  setTimeout(() => { btn.textContent = original; btn.style.background = ''; }, 3000);
}
