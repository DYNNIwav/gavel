import { apiRequest } from './api.ts';
import { KEYS } from './storage.ts';
import type { ApiResponse, Listing } from './types.ts';

const params = new URLSearchParams(window.location.search);
const listingId = params.get('id');
const container = document.querySelector<HTMLElement>('#listing');

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

async function loadListing(): Promise<void> {
  if (!container) return;

  if (!listingId) {
    container.innerHTML = '<p class="empty-state">Listing not found.</p>';
    return;
  }

  try {
    const result = await apiRequest<ApiResponse<Listing>>(
      `/auction/listings/${listingId}?_seller=true&_bids=true`,
    );
    const listing = result.data;

    document.title = `${listing.title} - Gavel`;
    container.textContent = '';

    const header = document.createElement('div');
    header.className = 'listing-header';

    const title = document.createElement('h1');
    title.textContent = listing.title;
    header.appendChild(title);

    const meta = document.createElement('p');
    meta.className = 'listing-meta';
    meta.textContent = `Listed by ${listing.seller?.name ?? 'Unknown seller'} · Ends ${formatDate(listing.endsAt)}`;
    header.appendChild(meta);

    container.appendChild(header);

    if (listing.media && listing.media.length > 0) {
      const gallery = document.createElement('div');
      gallery.className = 'listing-gallery';

      for (const media of listing.media) {
        const img = document.createElement('img');
        img.src = media.url;
        img.alt = media.alt || listing.title;
        img.addEventListener('error', () => {
          img.remove();
        });
        gallery.appendChild(img);
      }
      container.appendChild(gallery);
    }

    if (listing.description) {
      const desc = document.createElement('div');
      desc.className = 'listing-description';
      const p = document.createElement('p');
      p.textContent = listing.description;
      desc.appendChild(p);
      container.appendChild(desc);
    }

    const bidsSection = document.createElement('section');
    bidsSection.className = 'bids-section';

    const bidsHeading = document.createElement('h2');
    bidsHeading.textContent = 'Bids';
    bidsSection.appendChild(bidsHeading);

    let highest = 0;
    const sortedBids = [...(listing.bids ?? [])].sort((a, b) => b.amount - a.amount);
    if (sortedBids.length > 0) {
      highest = sortedBids[0].amount;
    }

    const currentBid = document.createElement('p');
    currentBid.className = 'current-bid';
    currentBid.textContent = highest ? `Current highest bid: ${highest} credits` : 'No bids placed yet';
    bidsSection.appendChild(currentBid);

    const token = localStorage.getItem(KEYS.token);
    const isEnded = new Date(listing.endsAt).getTime() <= Date.now();

    if (isEnded) {
      const endedMsg = document.createElement('p');
      endedMsg.className = 'auction-ended';
      endedMsg.textContent = 'This auction has ended.';
      bidsSection.appendChild(endedMsg);
    } else if (token) {
      const bidForm = document.createElement('form');
      bidForm.className = 'bid-form';

      const inputGroup = document.createElement('div');
      inputGroup.className = 'form-group';

      const label = document.createElement('label');
      label.htmlFor = 'bid-amount';
      label.textContent = 'Place a bid';

      const input = document.createElement('input');
      input.type = 'number';
      input.id = 'bid-amount';
      input.min = String(highest + 1);
      input.placeholder = `Min: ${highest + 1}`;
      input.required = true;

      const bidError = document.createElement('p');
      bidError.className = 'field-error';

      const submitBtn = document.createElement('button');
      submitBtn.type = 'submit';
      submitBtn.className = 'btn btn-primary';
      submitBtn.textContent = 'Submit bid';

      inputGroup.append(label, input, bidError);
      bidForm.append(inputGroup, submitBtn);

      bidForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        bidError.textContent = '';
        const amount = Number(input.value);

        if (!amount || amount <= highest) {
          bidError.textContent = `Bid must be higher than ${highest}`;
          return;
        }

        try {
          submitBtn.disabled = true;
          submitBtn.textContent = 'Placing bid...';
          await apiRequest(`/auction/listings/${listingId}/bids`, {
            method: 'POST',
            body: JSON.stringify({ amount }),
          });
          await loadListing();
        } catch (err: unknown) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Submit bid';
          if (err instanceof Error) {
            bidError.textContent = err.message;
          } else {
            bidError.textContent = 'Failed to place bid.';
          }
        }
      });

      bidsSection.appendChild(bidForm);
    } else {
      const loginPrompt = document.createElement('p');
      loginPrompt.className = 'login-prompt';
      loginPrompt.innerHTML = '<a href="/account/login.html">Log in</a> to place a bid on this listing.';
      bidsSection.appendChild(loginPrompt);
    }

    if (sortedBids.length > 0) {
      const bidList = document.createElement('ul');
      bidList.className = 'bid-history';

      for (const bid of sortedBids) {
        const item = document.createElement('li');
        item.textContent = `${bid.amount} credits · ${formatDate(bid.created)}`;
        bidList.appendChild(item);
      }
      bidsSection.appendChild(bidList);
    }

    container.appendChild(bidsSection);
  } catch (error) {
    console.error('Failed to load listing:', error);
    container.innerHTML = '<p class="field-error">Could not load this listing.</p>';
  }
}

loadListing();
