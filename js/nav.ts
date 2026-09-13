import { KEYS } from './storage.ts';
import { apiRequest } from './api.ts';
import type { ApiResponse, Profile } from './types.ts';

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
    addLink('/listing/create.html', 'New listing');
    addLink('/watchlist/', 'Watchlist');
    const loggedIn = document.createElement('a');
    loggedIn.href = '/account/profile.html';
    loggedIn.className = 'nav-user nav-link';
    loggedIn.textContent = username;
    loggedIn.setAttribute('aria-label', `Your profile, ${username}`);
    if (window.location.pathname === '/account/profile.html') {
      loggedIn.setAttribute('aria-current', 'page');
    }
    navLinks.appendChild(loggedIn);

    const creditsBadge = document.createElement('span');
    creditsBadge.className = 'nav-credits';
    creditsBadge.setAttribute('aria-label', 'Your available credits');

    const stored = localStorage.getItem(KEYS.credits);
    const cachedCredits = stored === null ? NaN : Number(stored);
    const hasCached = Number.isFinite(cachedCredits);

    if (hasCached) {
      creditsBadge.textContent = `${cachedCredits.toLocaleString()} credits`;
    }
    navLinks.appendChild(creditsBadge);

    apiRequest<ApiResponse<Profile>>(
      `/auction/profiles/${encodeURIComponent(username)}`,
    )
      .then((res) => {
        const { credits } = res.data;
        localStorage.setItem(KEYS.credits, String(credits));
        creditsBadge.textContent = `${credits.toLocaleString()} credits`;
      })
      .catch((err) => {
        console.warn('Could not load credit balance in navbar:', err);
        if (!hasCached) {
          creditsBadge.remove();
        }
      });

    const logout = document.createElement('button');
    logout.type = 'button';
    logout.className = 'nav-link nav-logout';
    logout.textContent = 'Log out';
    logout.addEventListener('click', () => {
      localStorage.removeItem(KEYS.token);
      localStorage.removeItem(KEYS.username);
      localStorage.removeItem(KEYS.apiKey);
      localStorage.removeItem(KEYS.credits);
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

function initGrain(): void {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const size = 128;
  canvas.width = size;
  canvas.height = size;

  const imageData = ctx.createImageData(size, size);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const v = Math.random() * 255;
    data[i] = v;
    data[i + 1] = v;
    data[i + 2] = v;
    data[i + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);

  document.body.style.setProperty('--grain', `url(${canvas.toDataURL()})`);
}

initGrain();
