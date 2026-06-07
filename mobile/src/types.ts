export type Condition = "new" | "used";

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string;
  image: string | null;
  part_count: number;
}

export interface Brand {
  id: number;
  name: string;
  slug: string;
  logo: string | null;
  is_oem: boolean;
}

export interface SellerProfile {
  id: number;
  user_id: number;
  username: string;
  shop_name: string;
  description: string;
  logo: string | null;
  city: string;
  state: string;
  is_oem: boolean;
  rating: string;
  rating_count: number;
  is_best_seller: boolean;
}

export interface Part {
  id: number;
  title: string;
  slug: string;
  price: string;
  mrp: string | null;
  discount_percent: number;
  condition: Condition;
  oem_part_number: string;
  category_name: string;
  seller_shop: string;
  primary_image: string | null;
  stock: number;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  // detail-only
  description?: string;
  images?: { id: number; image: string; is_primary: boolean }[];
  brand?: Brand | null;
  category?: number | null;
  compatible_vehicles?: string;
  views?: number;
  seller_profile?: SellerProfile | null;
}

export interface VehicleListing {
  id: number;
  title: string;
  brand_name: string;
  model_name: string;
  year: number;
  fuel_type: string;
  km_driven: number;
  owners: number;
  price: string;
  city: string;
  is_sold: boolean;
  primary_image: string | null;
  created_at: string;
  description?: string;
  registration_number?: string;
  images?: { id: number; image: string; is_primary: boolean }[];
  seller_name?: string;
  seller_phone?: string;
}

export interface CartItem {
  id: number;
  part: number;
  part_detail: Part;
  quantity: number;
  line_total: string;
}

export interface Cart {
  id: number;
  items: CartItem[];
  subtotal: string;
  item_count: number;
}

export interface TrackingEvent {
  id: number;
  status: string;
  location: string;
  note: string;
  timestamp: string;
}

export interface Shipment {
  id: number;
  order_number: string;
  courier_name: string;
  courier_code: string;
  awb: string;
  status: string;
  shipping_charge: string;
  estimated_delivery_days: number;
  label_url: string;
  selection_reason: Record<string, any>;
  events: TrackingEvent[];
}

export interface OrderItem {
  id: number;
  part: number | null;
  title: string;
  unit_price: string;
  quantity: number;
  line_total: string;
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
  shipping_warning?: string;
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

export interface CourierOption {
  courier_code: string;
  courier_name: string;
  serviceable: boolean;
  eligible?: boolean;
  eta_days?: number;
  rate?: number;
  cod_available?: boolean;
  score?: number;
  score_breakdown?: Record<string, number>;
}

export interface VehicleMake {
  id: number;
  name: string;
  logo: string | null;
  country: string;
  model_count: number;
}

export interface VehicleModel {
  id: number;
  make: number;
  make_name: string;
  name: string;
  year_start: number;
  year_end: number | null;
  years: number[];
}

export interface OemPart {
  id: number;
  oem_number: string;
  name: string;
  category_name: string;
  image: string | null;
  mrp: string | null;
  description?: string;
  compatible_vehicles?: { model_id: number; label: string; year_from: number; year_to: number }[];
  matching_listings?: Part[];
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
