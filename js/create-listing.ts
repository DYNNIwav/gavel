import { apiRequest } from './api.ts';
import { KEYS } from './storage.ts';
import type { ApiResponse, Listing } from './types.ts';

const form = document.querySelector<HTMLFormElement>('#create-listing-form');
const errorBox = document.querySelector<HTMLElement>('#form-error');
const submitBtn = document.querySelector<HTMLButtonElement>('#submit-btn');

const token = localStorage.getItem(KEYS.token);
if (!token) {
  window.location.href = '/account/login.html';
}

if (form) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (errorBox) errorBox.textContent = '';

    const data = new FormData(form);
    const title = String(data.get('title') ?? '').trim();
    const description = String(data.get('description') ?? '').trim();
    const endsAtRaw = String(data.get('endsAt') ?? '').trim();
    const tagsRaw = String(data.get('tags') ?? '').trim();
    const mediaUrl = String(data.get('mediaUrl') ?? '').trim();

    if (!title) {
      if (errorBox) errorBox.textContent = 'Please enter a title.';
      return;
    }

    if (!endsAtRaw) {
      if (errorBox) errorBox.textContent = 'Please select an auction end date.';
      return;
    }

    const endsAt = new Date(endsAtRaw);
    if (isNaN(endsAt.getTime()) || endsAt.getTime() <= Date.now()) {
      if (errorBox) {
        errorBox.textContent = 'The auction end date must be in the future.';
      }
      return;
    }

    const payload: {
      title: string;
      endsAt: string;
      description?: string;
      tags?: string[];
      media?: { url: string; alt: string }[];
    } = {
      title,
      endsAt: endsAt.toISOString(),
    };

    if (description) {
      payload.description = description;
    }

    if (tagsRaw) {
      payload.tags = tagsRaw
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);
    }

    if (mediaUrl) {
      payload.media = [{ url: mediaUrl, alt: title }];
    }

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating listing...';
      }

      const response = await apiRequest<ApiResponse<Listing>>('/auction/listings', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      window.location.href = `/listing/?id=${response.data.id}`;
    } catch (error) {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create listing';
      }
      if (errorBox) {
        errorBox.textContent =
          error instanceof Error ? error.message : 'Could not create listing.';
      }
    }
  });
}
