const API_BASE = 'https://v2.api.noroff.dev';

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.errors?.[0]?.message ?? 'Something went wrong');
  }
  return data;
}
