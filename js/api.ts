import { KEYS } from './storage.ts';

const API_BASE = 'https://v2.api.noroff.dev';

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem(KEYS.token);
  const apiKey = localStorage.getItem(KEYS.apiKey);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (apiKey) headers['X-Noroff-API-Key'] = apiKey;

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: { ...headers, ...options.headers },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.errors?.[0]?.message ?? 'Something went wrong');
  }
  return data;
}
