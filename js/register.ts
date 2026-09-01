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

    if (!email.endsWith('@stud.noroff.no')) {
      if (errorBox)
        errorBox.textContent = 'Email-address must end with @stud.noroff.no';
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
