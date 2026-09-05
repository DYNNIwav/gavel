import { apiRequest } from './api.ts';
import type { ApiResponse, Listing } from './types.ts';

const listingsContainer = document.querySelector<HTMLElement>('#listings');
const searchForm = document.querySelector<HTMLFormElement>('#search-form');
const searchInput = document.querySelector<HTMLInputElement>('#search-input');
const sortSelect = document.querySelector<HTMLSelectElement>('#sort-select');
const tagSelect = document.querySelector<HTMLSelectElement>('#tag-select');

let currentQuery = '';
let currentTag = '';
let currentSort = 'created';
let currentSortOrder = 'desc';

function formatEndsAt(dateString: string): string {
  const diffMs = new Date(dateString).getTime() - Date.now();
  if (diffMs <= 0) return 'Ended';

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 24) {
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m left`;
  }
  const days = Math.floor(hours / 24);
  return `${days}d left`;
}

function renderListings(listings: Listing[]): void {
  if (!listingsContainer) return;
  listingsContainer.textContent = '';

  if (listings.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'No listings found.';
    listingsContainer.appendChild(empty);
    return;
  }

  for (const listing of listings) {
    const card = document.createElement('a');
    card.href = `/listing/?id=${listing.id}`;
    card.className = 'listing-card';

    const media = listing.media?.[0];
    if (media?.url) {
      const image = document.createElement('img');
      image.src = media.url;
      image.alt = media.alt || listing.title;
      image.addEventListener('error', () => {
        image.remove();
      });
      card.appendChild(image);
    }

    const body = document.createElement('div');
    body.className = 'listing-card-body';

    const title = document.createElement('h3');
    title.textContent = listing.title;

    const seller = document.createElement('p');
    seller.className = 'seller';
    seller.textContent = `Listed by ${listing.seller?.name ?? 'Unknown'}`;

    const meta = document.createElement('div');
    meta.className = 'listing-meta-row';

    let highest = 0;
    for (const bid of listing.bids ?? []) {
      if (bid.amount > highest) {
        highest = bid.amount;
      }
    }

    const bids = document.createElement('span');
    bids.className = 'bids';
    bids.textContent = highest ? `${highest} credits` : 'No bids';

    const ends = document.createElement('span');
    ends.className = 'ends';
    ends.textContent = formatEndsAt(listing.endsAt);

    meta.append(bids, ends);
    body.append(title, seller, meta);
    card.appendChild(body);
    listingsContainer.appendChild(card);
  }
}

async function fetchListings(): Promise<void> {
  if (!listingsContainer) return;
  listingsContainer.innerHTML = '<p class="empty-state">Loading listings...</p>';

  try {
    let endpoint = '';
    if (currentQuery.trim()) {
      endpoint = `/auction/listings/search?q=${encodeURIComponent(currentQuery.trim())}&_seller=true&_bids=true&sort=${currentSort}&sortOrder=${currentSortOrder}`;
    } else if (currentTag) {
      endpoint = `/auction/listings?_tag=${encodeURIComponent(currentTag)}&_active=true&_seller=true&_bids=true&sort=${currentSort}&sortOrder=${currentSortOrder}`;
    } else {
      endpoint = `/auction/listings?limit=24&_active=true&_seller=true&_bids=true&sort=${currentSort}&sortOrder=${currentSortOrder}`;
    }

    const result = await apiRequest<ApiResponse<Listing[]>>(endpoint);
    renderListings(result.data);
  } catch (error) {
    console.error('Failed to fetch listings:', error);
    listingsContainer.innerHTML = '<p class="field-error">Could not load listings. Please try again later.</p>';
  }
}

searchForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  currentQuery = searchInput?.value ?? '';
  fetchListings();
});

sortSelect?.addEventListener('change', () => {
  const value = sortSelect.value;
  if (value === 'created-desc') {
    currentSort = 'created';
    currentSortOrder = 'desc';
  } else if (value === 'created-asc') {
    currentSort = 'created';
    currentSortOrder = 'asc';
  } else if (value === 'endsAt-asc') {
    currentSort = 'endsAt';
    currentSortOrder = 'asc';
  }
  fetchListings();
});

tagSelect?.addEventListener('change', () => {
  currentTag = tagSelect.value;
  if (searchInput) searchInput.value = '';
  currentQuery = '';
  fetchListings();
});

fetchListings();

