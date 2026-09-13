export interface Media {
  url: string;
  alt: string;
}

export interface Seller {
  name: string;
  email: string;
  avatar: Media;
}

export interface Bidder {
  name: string;
  email: string;
  bio?: string;
  avatar?: Media;
}

export interface Bid {
  id: string;
  amount: number;
  created: string;
  bidder?: Bidder;
}

export interface ProfileBid {
  id: string;
  amount: number;
  created: string;
  listing?: Listing;
}

export interface Listing {
  id: string;
  title: string;
  description: string | null;
  tags: string[];
  media: Media[];
  created: string;
  endsAt: string;
  seller?: Seller;
  bids?: Bid[];
  _count: { bids: number };
}

export interface ApiResponse<T> {
  data: T;
  meta: { isLastPage: boolean; nextPage: number | null };
}

export interface AuthProfile {
  name: string;
  email: string;
  avatar: Media;
  banner: Media;
  accessToken: string;
}

export interface Profile {
  name: string;
  email: string;
  bio?: string;
  avatar?: Media;
  banner?: Media;
  credits: number;
  listings?: Listing[];
  wins?: Listing[];
  _count: { listings: number; wins: number };
}

export interface UpdateProfilePayload {
  bio?: string;
  avatar?: { url: string; alt?: string };
  banner?: { url: string; alt?: string };
}
