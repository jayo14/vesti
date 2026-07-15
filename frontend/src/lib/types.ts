export interface Product {
  id: number;
  name: string;
  price: string;
  rating?: number;
  tag?: string;
}

export interface Designer {
  name: string;
  label: string;
  pieces: number;
}

export interface WardrobeItem {
  id: number;
  name: string;
  category: string;
}

export interface Review {
  user: string;
  rating: number;
  text: string;
}
