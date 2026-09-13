import { apiRequest } from './api.ts';
import { KEYS } from './storage.ts';
import type {
  ApiResponse,
  Profile,
  ProfileBid,
  UpdateProfilePayload,
} from './types.ts';

const container = document.querySelector<HTMLElement>('#profile-container');
const username = localStorage.getItem(KEYS.username);
const token = localStorage.getItem(KEYS.token);

if (!token || !username) {
  window.location.href = '/account/login.html';
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

async function loadProfile(): Promise<void> {
  if (!container || !username) return;

  try {
    const result = await apiRequest<ApiResponse<Profile>>(
      `/auction/profiles/${encodeURIComponent(username)}?_listings=true&_wins=true`,
    );
    const profile = result.data;

    document.title = `${profile.name} - Profile - Gavel`;
    container.textContent = '';

    const card = document.createElement('div');
    card.className = 'profile-card';

    if (profile.banner?.url) {
      const banner = document.createElement('div');
      banner.className = 'profile-banner';
      const bannerImg = document.createElement('img');
      bannerImg.src = profile.banner.url;
      bannerImg.alt = profile.banner.alt || `${profile.name}'s banner`;
      bannerImg.addEventListener('error', () => banner.remove());
      banner.appendChild(bannerImg);
      card.appendChild(banner);
    }

    const header = document.createElement('div');
    header.className = 'profile-header';

    const avatarWrap = document.createElement('div');
    avatarWrap.className = 'profile-avatar';
    const avatarImg = document.createElement('img');
    avatarImg.src =
      profile.avatar?.url ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
    avatarImg.alt = profile.avatar?.alt || profile.name;
    avatarImg.addEventListener('error', () => {
      avatarImg.src =
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
    });
    avatarWrap.appendChild(avatarImg);
    header.appendChild(avatarWrap);

    const info = document.createElement('div');
    info.className = 'profile-info';

    const nameHeading = document.createElement('h1');
    nameHeading.textContent = profile.name;
    info.appendChild(nameHeading);

    const email = document.createElement('p');
    email.className = 'profile-email';
    email.textContent = profile.email;
    info.appendChild(email);

    const creditsBadge = document.createElement('div');
    creditsBadge.className = 'profile-credits';
    creditsBadge.textContent = `${profile.credits ?? 0} credits available`;
    info.appendChild(creditsBadge);

    if (profile.bio) {
      const bio = document.createElement('p');
      bio.className = 'profile-bio';
      bio.textContent = profile.bio;
      info.appendChild(bio);
    }

    header.appendChild(info);
    card.appendChild(header);

    const editSection = document.createElement('details');
    editSection.className = 'profile-edit-accordion';
    const editSummary = document.createElement('summary');
    editSummary.textContent = 'Edit Profile (Avatar, Banner, Bio)';
    editSection.appendChild(editSummary);

    const editForm = document.createElement('form');
    editForm.className = 'profile-edit-form';

    const editError = document.createElement('p');
    editError.className = 'field-error';

    const bioGroup = document.createElement('div');
    bioGroup.className = 'form-group';
    const bioLabel = document.createElement('label');
    bioLabel.htmlFor = 'edit-bio';
    bioLabel.textContent = 'Bio';
    const bioInput = document.createElement('textarea');
    bioInput.id = 'edit-bio';
    bioInput.rows = 3;
    bioInput.value = profile.bio ?? '';
    bioGroup.append(bioLabel, bioInput);

    const avatarGroup = document.createElement('div');
    avatarGroup.className = 'form-group';
    const avatarLabel = document.createElement('label');
    avatarLabel.htmlFor = 'edit-avatar';
    avatarLabel.textContent = 'Avatar Image URL';
    const avatarInput = document.createElement('input');
    avatarInput.type = 'url';
    avatarInput.id = 'edit-avatar';
    avatarInput.value = profile.avatar?.url ?? '';
    avatarGroup.append(avatarLabel, avatarInput);

    const bannerGroup = document.createElement('div');
    bannerGroup.className = 'form-group';
    const bannerLabel = document.createElement('label');
    bannerLabel.htmlFor = 'edit-banner';
    bannerLabel.textContent = 'Banner Image URL';
    const bannerInput = document.createElement('input');
    bannerInput.type = 'url';
    bannerInput.id = 'edit-banner';
    bannerInput.value = profile.banner?.url ?? '';
    bannerGroup.append(bannerLabel, bannerInput);

    const saveBtn = document.createElement('button');
    saveBtn.type = 'submit';
    saveBtn.className = 'btn btn-primary btn-block';
    saveBtn.textContent = 'Save Changes';

    editForm.append(editError, bioGroup, avatarGroup, bannerGroup, saveBtn);

    editForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      editError.textContent = '';
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';

      const updateData: UpdateProfilePayload = {};
      if (bioInput.value.trim()) updateData.bio = bioInput.value.trim();
      if (avatarInput.value.trim()) {
        updateData.avatar = {
          url: avatarInput.value.trim(),
          alt: profile.name,
        };
      }
      if (bannerInput.value.trim()) {
        updateData.banner = {
          url: bannerInput.value.trim(),
          alt: `${profile.name}'s banner`,
        };
      }

      try {
        await apiRequest(`/auction/profiles/${encodeURIComponent(username)}`, {
          method: 'PUT',
          body: JSON.stringify(updateData),
        });
        await loadProfile();
      } catch (err) {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Changes';
        editError.textContent =
          err instanceof Error ? err.message : 'Failed to update profile.';
      }
    });

    editSection.appendChild(editForm);
    card.appendChild(editSection);
    container.appendChild(card);

    // Listings section
    const listingsSection = document.createElement('section');
    listingsSection.className = 'profile-listings';
    const listingsHeading = document.createElement('h2');
    listingsHeading.textContent = `My Listings (${profile.listings?.length ?? 0})`;
    listingsSection.appendChild(listingsHeading);

    if (profile.listings && profile.listings.length > 0) {
      const grid = document.createElement('div');
      grid.className = 'listing-grid';

      for (const item of profile.listings) {
        const itemCard = document.createElement('a');
        itemCard.href = `/listing/?id=${item.id}`;
        itemCard.className = 'listing-card';

        const img = document.createElement('img');
        img.src =
          item.media?.[0]?.url ||
          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600';
        img.alt = item.media?.[0]?.alt || item.title;
        img.addEventListener('error', () => {
          img.src =
            'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600';
        });

        const cardBody = document.createElement('div');
        cardBody.className = 'listing-card-body';

        const title = document.createElement('h3');
        title.textContent = item.title;

        const meta = document.createElement('div');
        meta.className = 'listing-meta-row';
        const ends = document.createElement('span');
        ends.className = 'ends';
        ends.textContent = `Ends ${formatDate(item.endsAt)}`;
        meta.appendChild(ends);

        cardBody.append(title, meta);
        itemCard.append(img, cardBody);
        grid.appendChild(itemCard);
      }
      listingsSection.appendChild(grid);
    } else {
      const emptyMsg = document.createElement('p');
      emptyMsg.className = 'empty-state';
      emptyMsg.textContent = 'You have not created any listings yet.';
      listingsSection.appendChild(emptyMsg);
    }

    container.appendChild(listingsSection);

    // Listings bid on section
    const bidsSection = document.createElement('section');
    bidsSection.className = 'profile-listings profile-bids';
    const bidsHeading = document.createElement('h2');
    bidsHeading.textContent = 'Listings I Have Bid On';
    bidsSection.appendChild(bidsHeading);

    try {
      const bidsRes = await apiRequest<ApiResponse<ProfileBid[]>>(
        `/auction/profiles/${encodeURIComponent(username)}/bids?_listings=true`,
      );
      const userBids = bidsRes.data || [];

      const biddedMap = new Map<
        string,
        { listing: NonNullable<ProfileBid['listing']>; highestBid: number }
      >();
      for (const b of userBids) {
        if (!b.listing) continue;
        const current = biddedMap.get(b.listing.id);
        if (!current || b.amount > current.highestBid) {
          biddedMap.set(b.listing.id, {
            listing: b.listing,
            highestBid: b.amount,
          });
        }
      }

      if (biddedMap.size > 0) {
        const grid = document.createElement('div');
        grid.className = 'listing-grid';

        for (const { listing: item, highestBid } of biddedMap.values()) {
          const itemCard = document.createElement('a');
          itemCard.href = `/listing/?id=${item.id}`;
          itemCard.className = 'listing-card';

          const img = document.createElement('img');
          img.src =
            item.media?.[0]?.url ||
            'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600';
          img.alt = item.media?.[0]?.alt || item.title;
          img.addEventListener('error', () => {
            img.src =
              'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600';
          });

          const cardBody = document.createElement('div');
          cardBody.className = 'listing-card-body';

          const title = document.createElement('h3');
          title.textContent = item.title;

          const meta = document.createElement('div');
          meta.className = 'listing-meta-row';

          const bidInfo = document.createElement('span');
          bidInfo.className = 'bids';
          bidInfo.textContent = `Your bid: ${highestBid} credits`;

          const ends = document.createElement('span');
          ends.className = 'ends';
          ends.textContent = `Ends ${formatDate(item.endsAt)}`;

          meta.append(bidInfo, ends);
          cardBody.append(title, meta);
          itemCard.append(img, cardBody);
          grid.appendChild(itemCard);
        }
        bidsSection.appendChild(grid);
      } else {
        const emptyBids = document.createElement('p');
        emptyBids.className = 'empty-state';
        emptyBids.textContent = 'You have not placed bids on any listings yet.';
        bidsSection.appendChild(emptyBids);
      }
    } catch (bidErr) {
      console.warn('Could not load user bids:', bidErr);
      const errBids = document.createElement('p');
      errBids.className = 'empty-state';
      errBids.textContent = 'Could not load your bid history.';
      bidsSection.appendChild(errBids);
    }

    container.appendChild(bidsSection);
  } catch (error) {
    console.error('Failed to load profile:', error);
    container.innerHTML = '<p class="field-error">Could not load profile.</p>';
  }
}

loadProfile();
