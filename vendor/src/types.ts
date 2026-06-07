export type Condition = "new" | "used";

export interface SellerProfile {
  id: number;
  user_id: number;
  username: string;
  shop_name: string;
  description: string;
  logo: string | null;
  gstin: string;
  city: string;
  state: string;
  pincode: string;
  is_oem: boolean;
  rating: string;
  rating_count: number;
  is_best_seller: boolean;
  created_at: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: "buyer" | "seller" | "admin";
  avatar: string | null;
  is_seller_approved: boolean;
  seller_profile: SellerProfile | null;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string;
}

export interface Part {
  id: number;
  title: string;
  price: string;
  mrp: string | null;
  discount_percent: number;
  condition: Condition;
  oem_part_number: string;
  category_name: string;
  primary_image: string | null;
  stock: number;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  description?: string;
  images?: { id: number; image: string; is_primary: boolean }[];
  category?: number | null;
  compatible_vehicles?: string;
  views?: number;
}

export interface Shipment {
  id: number;
  courier_name: string;
  courier_code: string;
  awb: string;
  status: string;
  estimated_delivery_days: number;
}

export interface OrderItem {
  id: number;
  title: string;
  unit_price: string;
  quantity: number;
  line_total: string;
  seller: number | null;
}

export interface Order {
  id: number;
  order_number: string;
  status: string;
  payment_method: string;
  is_paid: boolean;
  ship_full_name: string;
  ship_phone: string;
  ship_line1: string;
  ship_line2: string;
  ship_city: string;
  ship_state: string;
  ship_pincode: string;
  items_total: string;
  shipping_fee: string;
  grand_total: string;
  items: OrderItem[];
  shipment: Shipment | null;
  created_at: string;
}

export interface Inquiry {
  id: number;
  buyer: number;
  buyer_name: string;
  seller: number;
  part: number | null;
  part_title: string | null;
  vehicle: number | null;
  message: string;
  reply: string;
  status: string;
  created_at: string;
}
