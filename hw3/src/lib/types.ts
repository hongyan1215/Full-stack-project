export type Item = {
  id: string;
  name: string;
  category: string;
  price: number;
  description?: string;
  image_url?: string;
  tags?: string[];
  rating?: number;
  stock?: number;
  location?: string;
  opening_hours?: string;
};

export type CartItem = Pick<Item, "id" | "name" | "price" | "image_url"> & {
  qty: number;
};

export type Order = {
  id: string;
  createdAt: string;
  items: CartItem[];
  total: number;
  note?: string;
  status: "submitted" | "change-requested";
  meta?: {
    changeReason?: string;
  };
};


