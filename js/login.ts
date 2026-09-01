import type { ApiResponse, AuthProfile } from './types.ts';
import { apiRequest } from './api.ts';

const loginForm = document.querySelector<HTMLFormElement>('#login-form');
const errorBox = document.querySelector('#form-error');

if (loginForm) {
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (errorBox) errorBox.textContent = '';

    const data = new FormData(loginForm);
    const email = String(data.get('email') ?? '').trim();
    const password = String(data.get('password') ?? '').trim();

    try {
      const response = await apiRequest<ApiResponse<AuthProfile>>(
        '/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        },
      );

      localStorage.setItem('gavel_token', response.data.accessToken);
      localStorage.setItem('gavel_username', response.data.name);
      if (!localStorage.getItem('gavel_api_key')) {
        const keyResponse = await apiRequest<ApiResponse<{ key: string }>>(
          '/auth/create-api-key',
          {
            method: 'POST',
            body: JSON.stringify({ name: 'Gavel key' }),
          },
        );
        localStorage.setItem('gavel_api_key', keyResponse.data.key);
      }
      window.location.href = '/';
    } catch (error) {
      if (errorBox) {
        errorBox.textContent =
          error instanceof Error ? error.message : 'Could not log in';
      }
    }
  });
}
