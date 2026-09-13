import { apiRequest } from './api.ts';
import { KEYS } from './storage.ts';
import { showToast } from './toast.ts';
import type { ApiResponse, Listing } from './types.ts';

const grid = document.querySelector<HTMLElement>('#watchlist-grid');

export function getWatchlist(): string[] {
  try {
    const raw = localStorage.getItem(KEYS.watchlist);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveWatchlist(ids: string[]): void {
  localStorage.setItem(KEYS.watchlist, JSON.stringify(ids));
}

export function toggleWatchlist(id: string): boolean {
  const current = getWatchlist();
  const index = current.indexOf(id);
  if (index > -1) {
    current.splice(index, 1);
    saveWatchlist(current);
    showToast('Removed from watchlist.', 'info');
    return false;
  } else {
    current.push(id);
    saveWatchlist(current);
    showToast('Saved to watchlist.', 'success');
    return true;
  }
}

export function isWatchlisted(id: string): boolean {
  return getWatchlist().includes(id);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

async function loadWatchlist(): Promise<void> {
  if (!grid) return;

  const ids = getWatchlist();
  if (ids.length === 0) {
    grid.innerHTML =
      '<p class="empty-state">Your watchlist is empty. Go explore the listings and save something worth bidding on!</p>';
    return;
  }

  grid.innerHTML = '<p class="empty-state">Loading your saved items...</p>';

  const results = await Promise.allSettled(
    ids.map((id) =>
      apiRequest<ApiResponse<Listing>>(
        `/auction/listings/${id}?_seller=true&_bids=true`,
      ),
    ),
  );

  const validListings: Listing[] = [];
  for (const res of results) {
    if (res.status === 'fulfilled') {
      validListings.push(res.value.data);
    }
  }

  grid.textContent = '';

  if (validListings.length === 0) {
    grid.innerHTML =
      '<p class="empty-state">Could not find any of your saved listings. They may have been deleted.</p>';
    return;
  }

  for (const item of validListings) {
    const card = document.createElement('article');
    card.className = 'listing-card';

    const link = document.createElement('a');
    link.href = `/listing/?id=${item.id}`;
    link.className = 'watchlist-card-link';

    const img = document.createElement('img');
    img.src =
      item.media?.[0]?.url ||
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600';
    img.alt = item.media?.[0]?.alt || item.title;
    img.addEventListener('error', () => {
      img.src =
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600';
    });

    const body = document.createElement('div');
    body.className = 'listing-card-body';

    const title = document.createElement('h3');
    title.textContent = item.title;

    const seller = document.createElement('p');
    seller.className = 'seller';
    seller.textContent = `Listed by ${item.seller?.name ?? 'Unknown'}`;

    const meta = document.createElement('div');
    meta.className = 'listing-meta-row';

    let highest = 0;
    if (item.bids && item.bids.length > 0) {
      highest = Math.max(...item.bids.map((b) => b.amount));
    }

    const bids = document.createElement('span');
    bids.className = 'bids';
    bids.textContent = highest ? `${highest} credits` : 'No bids';

    const ends = document.createElement('span');
    ends.className = 'ends';
    ends.textContent = `Ends ${formatDate(item.endsAt)}`;

    meta.append(bids, ends);
    body.append(title, seller, meta);
    link.append(img, body);

    const actionRow = document.createElement('div');
    actionRow.className = 'watchlist-card-actions';

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn btn-secondary btn-block';
    removeBtn.textContent = 'Remove from watchlist';
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleWatchlist(item.id);
      loadWatchlist();
    });

    actionRow.appendChild(removeBtn);
    card.append(link, actionRow);
    grid.appendChild(card);
  }
}

if (grid) {
  loadWatchlist();
}
