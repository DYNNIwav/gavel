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
      const media = listing.media?.[0];
      if (media) {
        const image = document.createElement('img');
        image.src = media.url;
        image.alt = media.alt || listing.title;
        image.addEventListener('error', () => {
          image.remove();
        });
        card.appendChild(image);
      }
      const title = document.createElement('h3');
      title.textContent = listing.title;
      const seller = document.createElement('p');
      seller.textContent = listing.seller.name;
      const bids = document.createElement('p');
      bids.textContent = `${listing.bids.length} bids`;
      card.append(title, seller, bids);
      listingsContainer.appendChild(card);
    }
  }
} catch (error) {
  console.error(error);
}
