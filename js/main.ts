import { apiRequest } from './api.ts';
import { paintCountdown, watchCountdowns } from './countdown.ts';
import { showToast } from './toast.ts';
import type { ApiResponse, Listing } from './types.ts';

const listingsContainer = document.querySelector<HTMLElement>('#listings');
const searchForm = document.querySelector<HTMLFormElement>('#search-form');
const searchInput = document.querySelector<HTMLInputElement>('#search-input');
const sortSelect = document.querySelector<HTMLSelectElement>('#sort-select');
const tagSelect = document.querySelector<HTMLSelectElement>('#tag-select');
const loadMoreRow = document.querySelector<HTMLElement>('#load-more-row');
const loadMoreBtn = document.querySelector<HTMLButtonElement>('#load-more');

const PAGE_SIZE = 24;

const urlParams = new URLSearchParams(window.location.search);
let currentQuery = '';
let currentTag = urlParams.get('tag') ?? '';
if (currentTag && tagSelect) {
  tagSelect.value = currentTag;
}
let currentSort = 'created';
let currentSortOrder = 'desc';
let nextPage: number | null = null;

function buildEndpoint(page: number): string {
  const shared = `limit=${PAGE_SIZE}&page=${page}&_seller=true&_bids=true&sort=${currentSort}&sortOrder=${currentSortOrder}`;

  if (currentQuery.trim()) {
    return `/auction/listings/search?q=${encodeURIComponent(currentQuery.trim())}&${shared}`;
  }

  if (currentTag) {
    return `/auction/listings?_tag=${encodeURIComponent(currentTag)}&_active=true&${shared}`;
  }

  return `/auction/listings?_active=true&${shared}`;
}

function createListingCard(listing: Listing): HTMLAnchorElement {
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
  ends.className = 'ends countdown';
  ends.dataset.endsAt = listing.endsAt;
  paintCountdown(ends);

  meta.append(bids, ends);
  body.append(title, seller, meta);
  card.appendChild(body);

  return card;
}

function renderListings(listings: Listing[], append: boolean): void {
  if (!listingsContainer) return;

  if (!append) {
    listingsContainer.textContent = '';

    if (listings.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'empty-state';
      empty.textContent = 'No listings found.';
      listingsContainer.appendChild(empty);
      return;
    }
  }

  const cards = listings.map(createListingCard);
  listingsContainer.append(...cards);

  if (append && cards[0]) {
    cards[0].focus();
  }
}

function updateLoadMore(): void {
  if (!loadMoreRow || !loadMoreBtn) return;

  loadMoreBtn.disabled = false;
  loadMoreBtn.textContent = 'Load more listings';
  loadMoreRow.hidden = nextPage === null;
}

async function fetchListings(page = 1): Promise<void> {
  if (!listingsContainer) return;

  const append = page > 1;

  if (append) {
    if (loadMoreBtn) {
      loadMoreBtn.disabled = true;
      loadMoreBtn.textContent = 'Loading...';
    }
  } else {
    nextPage = null;
    updateLoadMore();
    listingsContainer.innerHTML =
      '<p class="empty-state">Loading listings...</p>';
  }

  try {
    const result = await apiRequest<ApiResponse<Listing[]>>(
      buildEndpoint(page),
    );
    nextPage = result.meta.nextPage;
    renderListings(result.data, append);
    updateLoadMore();
  } catch (error) {
    console.error('Failed to fetch listings:', error);
    if (append) {
      showToast('Could not load more listings.', 'error');
      updateLoadMore();
    } else {
      listingsContainer.innerHTML =
        '<p class="field-error">Could not load listings. Please try again later.</p>';
    }
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
  const url = new URL(window.location.href);
  if (currentTag) {
    url.searchParams.set('tag', currentTag);
  } else {
    url.searchParams.delete('tag');
  }
  window.history.replaceState({}, '', url.toString());
  fetchListings();
});

loadMoreBtn?.addEventListener('click', () => {
  if (nextPage) {
    fetchListings(nextPage);
  }
});

fetchListings();
watchCountdowns();
