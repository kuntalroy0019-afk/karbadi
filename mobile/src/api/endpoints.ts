import { api } from "./client";
import {
  Brand,
  Cart,
  Category,
  CourierOption,
  Inquiry,
  OemPart,
  Order,
  Part,
  SellerProfile,
  Shipment,
  User,
  VehicleListing,
  VehicleMake,
  VehicleModel,
} from "../types";

interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// --- Auth ----------------------------------------------------------------
export const Auth = {
  login: (username: string, password: string) =>
    api.post<{ access: string; refresh: string; user: User }>("/auth/login/", {
      username,
      password,
    }),
  register: (payload: Record<string, any>) => api.post<User>("/auth/register/", payload),
  me: () => api.get<User>("/auth/me/"),
  sellers: (params?: Record<string, any>) =>
    api.get<Paginated<SellerProfile>>("/auth/sellers/", { params }),
  seller: (id: number) => api.get<SellerProfile>(`/auth/sellers/${id}/`),
  bestSellers: () => api.get<SellerProfile[]>("/auth/sellers/best-sellers/"),
  oemSellers: () => api.get<SellerProfile[]>("/auth/sellers/oem/"),
};

// --- Catalog -------------------------------------------------------------
export const Catalog = {
  categories: () => api.get<Category[]>("/catalog/categories/"),
  brands: (params?: Record<string, any>) =>
    api.get<Brand[]>("/catalog/brands/", { params }),
  parts: (params?: Record<string, any>) =>
    api.get<Paginated<Part>>("/catalog/parts/", { params }),
  part: (id: number) => api.get<Part>(`/catalog/parts/${id}/`),
  featured: () => api.get<Part[]>("/catalog/parts/featured/"),
  myListings: () => api.get<Paginated<Part>>("/catalog/parts/my-listings/"),
  createPart: (payload: FormData) =>
    api.post<Part>("/catalog/parts/", payload, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  updatePart: (id: number, payload: FormData) =>
    api.patch<Part>(`/catalog/parts/${id}/`, payload, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  deletePart: (id: number) => api.delete(`/catalog/parts/${id}/`),
  vehicles: (params?: Record<string, any>) =>
    api.get<Paginated<VehicleListing>>("/catalog/vehicles/", { params }),
  vehicle: (id: number) => api.get<VehicleListing>(`/catalog/vehicles/${id}/`),
  myVehicles: () => api.get<Paginated<VehicleListing>>("/catalog/vehicles/my-listings/"),
  createVehicle: (payload: FormData) =>
    api.post<VehicleListing>("/catalog/vehicles/", payload, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  updateVehicle: (id: number, payload: FormData) =>
    api.patch<VehicleListing>(`/catalog/vehicles/${id}/`, payload, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  deleteVehicle: (id: number) => api.delete(`/catalog/vehicles/${id}/`),
};

// --- OEM (Module 3) ------------------------------------------------------
export const Oem = {
  makes: () => api.get<VehicleMake[]>("/oem/makes/"),
  models: (makeId: number) => api.get<VehicleModel[]>(`/oem/makes/${makeId}/models/`),
  parts: (params?: Record<string, any>) =>
    api.get<Paginated<OemPart>>("/oem/parts/", { params }),
  part: (id: number) => api.get<OemPart>(`/oem/parts/${id}/`),
  byVehicle: (modelId: number, categoryId?: number) =>
    api.get<Paginated<OemPart>>("/oem/parts/by-vehicle/", {
      params: { model: modelId, category: categoryId },
    }),
  lookupRegistration: (reg: string) =>
    api.get<{ make: string; model: string; year: number; fuel_type: string; parts: OemPart[] }>(
      "/oem/parts/lookup-registration/",
      { params: { reg } }
    ),
};

// --- Orders / cart -------------------------------------------------------
export const Orders = {
  cart: () => api.get<Cart>("/orders/cart/"),
  addToCart: (part: number, quantity = 1) =>
    api.post<Cart>("/orders/cart-items/", { part, quantity }),
  updateCartItem: (id: number, quantity: number) =>
    api.patch<Cart>(`/orders/cart-items/${id}/`, { quantity }),
  removeCartItem: (id: number) => api.delete<Cart>(`/orders/cart-items/${id}/`),
  checkout: (payload: Record<string, any>) => api.post<Order>("/orders/checkout/", payload),
  list: () => api.get<Paginated<Order>>("/orders/orders/"),
  detail: (id: number) => api.get<Order>(`/orders/orders/${id}/`),
  cancel: (id: number) => api.post<Order>(`/orders/orders/${id}/cancel/`),
  sales: () => api.get<Paginated<Order>>("/orders/orders/sales/"),
  inquiries: () => api.get<Paginated<Inquiry>>("/orders/inquiries/"),
  createInquiry: (payload: Record<string, any>) =>
    api.post<Inquiry>("/orders/inquiries/", payload),
  replyInquiry: (id: number, reply: string) =>
    api.post<Inquiry>(`/orders/inquiries/${id}/reply/`, { reply }),
};

// --- Shipping (Modules 1 & 2) -------------------------------------------
export const Shipping = {
  serviceability: (pincode: string, cod = false, weight = 1) =>
    api.get<{ pincode: string; recommended: CourierOption | null; options: CourierOption[] }>(
      "/shipping/serviceability/",
      { params: { pincode, cod, weight_kg: weight } }
    ),
  shipment: (id: number) => api.get<Shipment>(`/shipping/shipments/${id}/`),
  track: (id: number) => api.get<Shipment>(`/shipping/shipments/${id}/track/`),
  couriers: () => api.get("/shipping/couriers/"),
};
