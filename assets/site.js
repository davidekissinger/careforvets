(() => {
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
  }
  document.querySelectorAll('.site-nav a').forEach(a => a.addEventListener('click', () => {
    if (window.innerWidth <= 900 && nav) {
      nav.classList.remove('open');
      toggle?.setAttribute('aria-expanded','false');
    }
  }));
  const year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
})();
