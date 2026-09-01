import { KEYS } from './storage.ts';

const navLinks = document.querySelector('#nav-links');
const navToggle = document.querySelector('#nav-toggle');
const username = localStorage.getItem(KEYS.username);

function addLink(href: string, label: string): void {
  const link = document.createElement('a');
  link.href = href;
  link.textContent = label;
  link.className = 'nav-link';
  if (window.location.pathname === href) {
    link.setAttribute('aria-current', 'page');
  }
  navLinks?.appendChild(link);
}

if (navLinks) {
  addLink('/', 'Listings');

  if (username) {
    const loggedIn = document.createElement('span');
    loggedIn.className = 'nav-user';
    loggedIn.textContent = username;
    navLinks.appendChild(loggedIn);

    const logout = document.createElement('button');
    logout.type = 'button';
    logout.className = 'nav-link';
    logout.textContent = 'Log out';
    logout.addEventListener('click', () => {
      localStorage.removeItem(KEYS.token);
      localStorage.removeItem(KEYS.username);
      localStorage.removeItem(KEYS.apiKey);
      window.location.href = '/';
    });
    navLinks.appendChild(logout);
  } else {
    addLink('/account/login.html', 'Log in');

    const register = document.createElement('a');
    register.href = '/account/register.html';
    register.textContent = 'Register';
    register.className = 'btn btn-primary nav-cta';
    navLinks.appendChild(register);
  }
}

navToggle?.addEventListener('click', () => {
  const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
  navToggle.setAttribute('aria-expanded', String(!isOpen));
  navLinks?.classList.toggle('is-open', !isOpen);
});
