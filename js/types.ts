export interface Media {
  url: string;
  alt: string;
}

export interface Seller {
  name: string;
  email: string;
  avatar: Media;
}

export interface Bid {
  id: string;
  amount: number;
  created: string;
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
