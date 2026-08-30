const API_BASE = 'https://v2.api.noroff.dev';

export async function apiRequest(endpoint: string) {
  const response = await fetch(`${API_BASE}${endpoint}`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.errors?.[0]?.message ?? 'Something went wrong');
  }
  return data;
}
