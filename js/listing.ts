import { apiRequest } from './api.ts';
import { paintCountdown, watchCountdowns } from './countdown.ts';
import { KEYS } from './storage.ts';
import { showToast } from './toast.ts';
import type { ApiResponse, Listing, UpdateListingPayload } from './types.ts';
import { isWatchlisted, toggleWatchlist } from './watchlist.ts';

const params = new URLSearchParams(window.location.search);
const listingId = params.get('id');
const container = document.querySelector<HTMLElement>('#listing');
const username = localStorage.getItem(KEYS.username);

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function buildOwnerTools(listing: Listing): HTMLElement {
  const section = document.createElement('details');
  section.className = 'owner-tools';

  const summary = document.createElement('summary');
  summary.textContent = 'Manage this listing';
  section.appendChild(summary);

  const form = document.createElement('form');
  form.className = 'owner-edit-form';

  const formError = document.createElement('p');
  formError.className = 'field-error';

  const titleGroup = document.createElement('div');
  titleGroup.className = 'form-group';
  const titleLabel = document.createElement('label');
  titleLabel.htmlFor = 'edit-title';
  titleLabel.textContent = 'Title';
  const titleInput = document.createElement('input');
  titleInput.type = 'text';
  titleInput.id = 'edit-title';
  titleInput.required = true;
  titleInput.value = listing.title;
  titleGroup.append(titleLabel, titleInput);

  const descGroup = document.createElement('div');
  descGroup.className = 'form-group';
  const descLabel = document.createElement('label');
  descLabel.htmlFor = 'edit-description';
  descLabel.textContent = 'Description';
  const descInput = document.createElement('textarea');
  descInput.id = 'edit-description';
  descInput.rows = 4;
  descInput.value = listing.description ?? '';
  descGroup.append(descLabel, descInput);

  const tagsGroup = document.createElement('div');
  tagsGroup.className = 'form-group';
  const tagsLabel = document.createElement('label');
  tagsLabel.htmlFor = 'edit-tags';
  tagsLabel.textContent = 'Tags';
  const tagsInput = document.createElement('input');
  tagsInput.type = 'text';
  tagsInput.id = 'edit-tags';
  tagsInput.value = listing.tags.join(', ');
  const tagsHint = document.createElement('span');
  tagsHint.className = 'form-hint';
  tagsHint.textContent = 'Separate tags with commas, for example: books, art';
  tagsGroup.append(tagsLabel, tagsInput, tagsHint);

  const mediaGroup = document.createElement('div');
  mediaGroup.className = 'form-group';
  const mediaLabel = document.createElement('label');
  mediaLabel.htmlFor = 'edit-media';
  mediaLabel.textContent = 'Image URL';
  const mediaInput = document.createElement('input');
  mediaInput.type = 'url';
  mediaInput.id = 'edit-media';
  mediaInput.value = listing.media?.[0]?.url ?? '';
  mediaGroup.append(mediaLabel, mediaInput);

  const deadlineNote = document.createElement('p');
  deadlineNote.className = 'form-hint';
  deadlineNote.textContent = `The deadline is fixed once an auction opens. This one ends ${formatDate(listing.endsAt)}.`;

  const saveBtn = document.createElement('button');
  saveBtn.type = 'submit';
  saveBtn.className = 'btn btn-primary';
  saveBtn.textContent = 'Save changes';

  form.append(
    formError,
    titleGroup,
    descGroup,
    tagsGroup,
    mediaGroup,
    deadlineNote,
    saveBtn,
  );

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    formError.textContent = '';

    const title = titleInput.value.trim();
    if (!title) {
      formError.textContent = 'Please enter a title.';
      return;
    }

    const mediaUrl = mediaInput.value.trim();
    const payload: UpdateListingPayload = {
      title,
      description: descInput.value.trim(),
      tags: tagsInput.value
        .split(',')
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean),
      media: mediaUrl ? [{ url: mediaUrl, alt: title }] : [],
    };

    try {
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';
      await apiRequest(`/auction/listings/${listing.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      await loadListing();
      showToast('Listing updated.', 'success');
    } catch (err) {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save changes';
      formError.textContent =
        err instanceof Error ? err.message : 'Could not update listing.';
    }
  });

  const danger = document.createElement('div');
  danger.className = 'owner-danger';

  const dangerNote = document.createElement('p');
  dangerNote.textContent =
    'Deleting removes the listing and its bid history for everyone.';

  const deleteError = document.createElement('p');
  deleteError.className = 'field-error';

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'btn btn-danger';
  deleteBtn.textContent = 'Delete listing';

  deleteBtn.addEventListener('click', async () => {
    const confirmed = window.confirm(
      `Delete "${listing.title}"? This cannot be undone.`,
    );
    if (!confirmed) return;

    try {
      deleteError.textContent = '';
      deleteBtn.disabled = true;
      deleteBtn.textContent = 'Deleting...';
      await apiRequest(`/auction/listings/${listing.id}`, { method: 'DELETE' });
      window.location.href = '/account/profile.html?deleted=1';
    } catch (err) {
      deleteBtn.disabled = false;
      deleteBtn.textContent = 'Delete listing';
      deleteError.textContent =
        err instanceof Error ? err.message : 'Could not delete listing.';
    }
  });

  danger.append(dangerNote, deleteError, deleteBtn);
  section.append(form, danger);

  return section;
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

    const headerMain = document.createElement('div');
    headerMain.className = 'listing-header-main';

    const title = document.createElement('h1');
    title.textContent = listing.title;
    headerMain.appendChild(title);

    const meta = document.createElement('p');
    meta.className = 'listing-meta';
    meta.appendChild(document.createTextNode('Listed by '));

    const sellerName = listing.seller?.name;
    if (sellerName) {
      const sellerLink = document.createElement('a');
      sellerLink.href = `/account/profile.html?name=${encodeURIComponent(sellerName)}`;
      sellerLink.className = 'seller-link';
      sellerLink.textContent = sellerName;
      meta.appendChild(sellerLink);
    } else {
      meta.appendChild(document.createTextNode('Unknown seller'));
    }

    meta.appendChild(
      document.createTextNode(` · Ends ${formatDate(listing.endsAt)}`),
    );
    headerMain.appendChild(meta);

    const countdown = document.createElement('p');
    countdown.className = 'listing-countdown';
    countdown.dataset.endsAt = listing.endsAt;
    paintCountdown(countdown);
    headerMain.appendChild(countdown);

    header.appendChild(headerMain);

    const watchBtn = document.createElement('button');
    watchBtn.type = 'button';
    watchBtn.className = 'btn btn-secondary watch-btn';
    const updateWatchText = () => {
      watchBtn.textContent = isWatchlisted(listing.id)
        ? '★ Saved in Watchlist'
        : '☆ Add to Watchlist';
    };
    updateWatchText();
    watchBtn.addEventListener('click', () => {
      toggleWatchlist(listing.id);
      updateWatchText();
    });
    header.appendChild(watchBtn);

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
    const sortedBids = [...(listing.bids ?? [])].sort(
      (a, b) => b.amount - a.amount,
    );
    if (sortedBids.length > 0) {
      highest = sortedBids[0].amount;
    }

    const currentBid = document.createElement('p');
    currentBid.className = 'current-bid';
    currentBid.textContent = highest
      ? `Current highest bid: ${highest} credits`
      : 'No bids placed yet';
    bidsSection.appendChild(currentBid);

    const token = localStorage.getItem(KEYS.token);
    const isEnded = new Date(listing.endsAt).getTime() <= Date.now();
    const isOwnListing = Boolean(username && listing.seller?.name === username);

    if (isEnded) {
      const endedMsg = document.createElement('p');
      endedMsg.className = 'auction-ended';
      endedMsg.textContent = 'This auction has ended.';
      bidsSection.appendChild(endedMsg);
    } else if (isOwnListing) {
      const ownNotice = document.createElement('p');
      ownNotice.className = 'own-listing-notice';
      ownNotice.textContent =
        'You cannot bid on your own listing. Use Manage this listing below to edit or delete it.';
      bidsSection.appendChild(ownNotice);
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
          showToast('Bid placed successfully.', 'success');
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
      loginPrompt.innerHTML =
        '<a href="/account/login.html">Log in</a> to place a bid on this listing.';
      bidsSection.appendChild(loginPrompt);
    }

    if (sortedBids.length > 0) {
      const bidList = document.createElement('ul');
      bidList.className = 'bid-history';

      for (const bid of sortedBids) {
        const item = document.createElement('li');
        const bidderName = bid.bidder?.name || 'Anonymous';
        const strong = document.createElement('strong');
        strong.textContent = bidderName;
        item.append(
          strong,
          document.createTextNode(
            `: ${bid.amount} credits · ${formatDate(bid.created)}`,
          ),
        );
        bidList.appendChild(item);
      }
      bidsSection.appendChild(bidList);
    }

    container.appendChild(bidsSection);

    if (isOwnListing) {
      container.appendChild(buildOwnerTools(listing));
    }
  } catch (error) {
    console.error('Failed to load listing:', error);
    container.innerHTML =
      '<p class="field-error">Could not load this listing.</p>';
  }
}

loadListing();
watchCountdowns();
