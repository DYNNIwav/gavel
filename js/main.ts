import { apiRequest } from './api.ts';

try {
  const result = await apiRequest('/auction/listings?limit=1');
  console.log(result);
} catch (error) {
  console.error(error);
}

console.log('still alive');
