import { apiRequest } from './api.ts';

const listingsContainer = document.querySelector('#listings');

try {
  const result = await apiRequest(
    '/auction/listings?limit=12&sort=created&sortOrder=desc&_active=true&_seller=true&_bids=true',
  );

  if (listingsContainer) {
    listingsContainer.textContent = '';
    for (const listing of result.data) {
      const card = document.createElement('div');
      card.textContent = listing.title;
      listingsContainer.appendChild(card);
    }
  }
} catch (error) {
  console.error(error);
}
