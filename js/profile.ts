import { apiRequest } from './api.ts';
import { paintCountdown, watchCountdowns } from './countdown.ts';
import { KEYS } from './storage.ts';
import { showToast } from './toast.ts';
import type {
  ApiResponse,
  Listing,
  Profile,
  ProfileBid,
  UpdateProfilePayload,
} from './types.ts';

const container = document.querySelector<HTMLElement>('#profile-container');
const token = localStorage.getItem(KEYS.token);
const myUsername = localStorage.getItem(KEYS.username);

const params = new URLSearchParams(window.location.search);
const profileName = params.get('name') ?? myUsername;
const isOwnProfile = profileName === myUsername;

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600';

if (!token || !profileName) {
  window.location.href = '/account/login.html';
}

function createListingCard(listing: Listing, note?: string): HTMLAnchorElement {
  const card = document.createElement('a');
  card.href = `/listing/?id=${listing.id}`;
  card.className = 'listing-card';

  const img = document.createElement('img');
  img.src = listing.media?.[0]?.url || FALLBACK_IMAGE;
  img.alt = listing.media?.[0]?.alt || listing.title;
  img.addEventListener('error', () => {
    img.src = FALLBACK_IMAGE;
  });

  const body = document.createElement('div');
  body.className = 'listing-card-body';

  const title = document.createElement('h3');
  title.textContent = listing.title;

  const meta = document.createElement('div');
  meta.className = 'listing-meta-row';

  if (note) {
    const bids = document.createElement('span');
    bids.className = 'bids';
    bids.textContent = note;
    meta.appendChild(bids);
  }

  const ends = document.createElement('span');
  ends.className = 'ends countdown';
  ends.dataset.endsAt = listing.endsAt;
  paintCountdown(ends);
  meta.appendChild(ends);

  body.append(title, meta);
  card.append(img, body);

  return card;
}

function createListingSection(
  heading: string,
  cards: HTMLAnchorElement[],
  emptyMessage: string,
  className = 'profile-listings',
): HTMLElement {
  const section = document.createElement('section');
  section.className = className;

  const title = document.createElement('h2');
  title.textContent = heading;
  section.appendChild(title);

  if (cards.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = emptyMessage;
    section.appendChild(empty);
    return section;
  }

  const grid = document.createElement('div');
  grid.className = 'listing-grid';
  grid.append(...cards);
  section.appendChild(grid);

  return section;
}

async function buildBidsSection(name: string): Promise<HTMLElement> {
  try {
    const bidsRes = await apiRequest<ApiResponse<ProfileBid[]>>(
      `/auction/profiles/${encodeURIComponent(name)}/bids?_listings=true`,
    );

    const highestPerListing = new Map<
      string,
      { listing: Listing; amount: number }
    >();
    for (const bid of bidsRes.data ?? []) {
      if (!bid.listing) continue;
      const current = highestPerListing.get(bid.listing.id);
      if (!current || bid.amount > current.amount) {
        highestPerListing.set(bid.listing.id, {
          listing: bid.listing,
          amount: bid.amount,
        });
      }
    }

    const cards = [...highestPerListing.values()].map(({ listing, amount }) =>
      createListingCard(listing, `Your bid: ${amount} credits`),
    );

    return createListingSection(
      'Listings I Have Bid On',
      cards,
      'You have not placed bids on any listings yet.',
      'profile-listings profile-bids',
    );
  } catch (error) {
    console.warn('Could not load user bids:', error);
    return createListingSection(
      'Listings I Have Bid On',
      [],
      'Could not load your bid history.',
      'profile-listings profile-bids',
    );
  }
}

async function loadProfile(): Promise<void> {
  if (!container || !profileName) return;

  try {
    const result = await apiRequest<ApiResponse<Profile>>(
      `/auction/profiles/${encodeURIComponent(profileName)}?_listings=true&_wins=true`,
    );
    const profile = result.data;

    document.title = isOwnProfile
      ? `${profile.name} - Profile - Gavel`
      : `${profile.name} - Gavel`;
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

    if (isOwnProfile) {
      const email = document.createElement('p');
      email.className = 'profile-email';
      email.textContent = profile.email;
      info.appendChild(email);
    }

    if (isOwnProfile) {
      const creditsBadge = document.createElement('div');
      creditsBadge.className = 'profile-credits';
      creditsBadge.textContent = `${profile.credits ?? 0} credits available`;
      info.appendChild(creditsBadge);
    }

    if (profile.bio) {
      const bio = document.createElement('p');
      bio.className = 'profile-bio';
      bio.textContent = profile.bio;
      info.appendChild(bio);
    }

    header.appendChild(info);
    card.appendChild(header);

    if (isOwnProfile) {
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
          await apiRequest(
            `/auction/profiles/${encodeURIComponent(profile.name)}`,
            {
              method: 'PUT',
              body: JSON.stringify(updateData),
            },
          );
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
    }

    container.appendChild(card);

    const listings = profile.listings ?? [];
    container.appendChild(
      createListingSection(
        isOwnProfile
          ? `My Listings (${listings.length})`
          : `Listings by ${profile.name} (${listings.length})`,
        listings.map((item) => createListingCard(item)),
        isOwnProfile
          ? 'You have not created any listings yet.'
          : `${profile.name} has no listings right now.`,
      ),
    );

    if (isOwnProfile) {
      const wins = profile.wins ?? [];
      container.appendChild(
        createListingSection(
          `Listings I Have Won (${wins.length})`,
          wins.map((item) => createListingCard(item, 'Won')),
          'You have not won any auctions yet.',
          'profile-listings profile-wins',
        ),
      );

      container.appendChild(await buildBidsSection(profile.name));
    }
  } catch (error) {
    console.error('Failed to load profile:', error);
    container.innerHTML = '<p class="field-error">Could not load profile.</p>';
  }
}

loadProfile();
watchCountdowns();

if (new URLSearchParams(window.location.search).has('deleted')) {
  showToast('Listing deleted.', 'success');
  window.history.replaceState({}, '', window.location.pathname);
}
