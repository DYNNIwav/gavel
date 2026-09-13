import { apiRequest } from './api.ts';

const registerForm = document.querySelector<HTMLFormElement>('#register-form');
const errorBox = document.querySelector('#form-error');

if (registerForm) {
  registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (errorBox) errorBox.textContent = '';

    const data = new FormData(registerForm);
    const name = String(data.get('name') ?? '').trim();
    const email = String(data.get('email') ?? '').trim();
    const password = String(data.get('password') ?? '').trim();

    if (!name || !/^[a-zA-Z0-9_]+$/.test(name)) {
      if (errorBox)
        errorBox.textContent =
          'Username can only contain letters, numbers, and underscores.';
      return;
    }

    if (!email.endsWith('@stud.noroff.no')) {
      if (errorBox)
        errorBox.textContent = 'Email address must end with @stud.noroff.no';
      return;
    }

    if (password.length < 8) {
      if (errorBox)
        errorBox.textContent = 'Password must be at least 8 characters long.';
      return;
    }

    try {
      await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password }),
      });
      window.location.href = '/account/login.html';
    } catch (error) {
      if (errorBox) {
        errorBox.textContent =
          error instanceof Error
            ? error.message
            : 'Could not create an account';
      }
    }
  });
}
