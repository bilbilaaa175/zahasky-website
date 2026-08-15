document.addEventListener('DOMContentLoaded', () => {
  const menuToggle = document.getElementById('mobile-menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  const iconOpen = document.getElementById('icon-open');
  const iconClose = document.getElementById('icon-close');

  if (!menuToggle || !mobileMenu || !iconOpen || !iconClose) return;

  menuToggle.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('is-open');
    mobileMenu.classList.toggle('hidden');
    mobileMenu.classList.toggle('flex');
    iconOpen.classList.toggle('hidden');
    iconClose.classList.toggle('hidden');
    menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  mobileMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      mobileMenu.classList.add('hidden');
      mobileMenu.classList.remove('flex', 'is-open');
      iconOpen.classList.remove('hidden');
      iconClose.classList.add('hidden');
      menuToggle.setAttribute('aria-expanded', 'false');
    });
  });
});
