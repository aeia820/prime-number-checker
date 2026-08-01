const menu = document.querySelector('.floating-guide-menu');
const toggle = document.querySelector('.menu-toggle');
const links = document.querySelectorAll('.floating-menu-links a');

function setMenu(open) {
  menu.dataset.open = String(open);
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? '解説メニューを閉じる' : '解説メニューを開く');
}

toggle.addEventListener('click', () => setMenu(menu.dataset.open !== 'true'));
links.forEach((link) => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('click', (event) => {
  if (!menu.contains(event.target)) setMenu(false);
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') { setMenu(false); toggle.focus(); }
});
