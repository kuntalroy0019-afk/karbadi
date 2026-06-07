import { api } from "./client";
import { Category, Inquiry, Order, Part, SellerProfile, User } from "../types";

interface Paginated<T> { count: number; next: string | null; previous: string | null; results: T[] }

const multipart = { headers: { "Content-Type": "multipart/form-data" } };

export const Auth = {
  login: (username: string, password: string) =>
    api.post<{ access: string; refresh: string; user: User }>("/auth/login/", { username, password }),
  register: (payload: Record<string, any>) => api.post<User>("/auth/register/", payload),
  me: () => api.get<User>("/auth/me/"),
};

export const Store = {
  get: () => api.get<SellerProfile>("/auth/sellers/me/"),
  upsert: (payload: Record<string, any> | FormData) =>
    api.put<SellerProfile>("/auth/sellers/me/", payload,
      payload instanceof FormData ? multipart : undefined),
};

export const Catalog = {
  categories: () => api.get<Category[]>("/catalog/categories/"),
  myListings: () => api.get<Paginated<Part>>("/catalog/parts/my-listings/"),
  part: (id: number) => api.get<Part>(`/catalog/parts/${id}/`),
  createPart: (payload: FormData) => api.post<Part>("/catalog/parts/", payload, multipart),
  updatePart: (id: number, payload: FormData) =>
    api.patch<Part>(`/catalog/parts/${id}/`, payload, multipart),
  deletePart: (id: number) => api.delete(`/catalog/parts/${id}/`),
};

export const Orders = {
  sales: () => api.get<Paginated<Order>>("/orders/orders/sales/"),
  detail: (id: number) => api.get<Order>(`/orders/orders/${id}/`),
  inquiries: () => api.get<Paginated<Inquiry>>("/orders/inquiries/"),
  replyInquiry: (id: number, reply: string) =>
    api.post<Inquiry>(`/orders/inquiries/${id}/reply/`, { reply }),
};
