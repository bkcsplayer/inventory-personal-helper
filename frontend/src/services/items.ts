import api from "./api";
import type { Item, PaginatedResponse } from "../types";

export interface ItemFilters {
  item_type?: string;
  category?: string;
  status?: string;
  container_id?: string;
  low_stock?: boolean;
  search?: string;
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}

export async function getItems(params?: ItemFilters) {
  const { data } = await api.get<PaginatedResponse<Item>>("/items", { params });
  return data;
}

export async function getItem(id: string) {
  const { data } = await api.get<Item>(`/items/${id}`);
  return data;
}

export async function createItem(item: Record<string, unknown>) {
  const { data } = await api.post<Item>("/items", item);
  return data;
}

export async function updateItem(id: string, item: Partial<Item>) {
  const { data } = await api.patch<Item>(`/items/${id}`, item);
  return data;
}

export async function deleteItem(id: string) {
  await api.delete(`/items/${id}`);
}

export async function adjustQuantity(id: string, delta: number, note?: string) {
  const { data } = await api.post<Item>(`/items/${id}/adjust`, { delta, note });
  return data;
}

export async function changeStatus(id: string, status: string, assigned_to?: string) {
  const { data } = await api.patch<Item>(`/items/${id}/status`, { status, assigned_to });
  return data;
}

export async function moveItem(id: string, container_id?: string, parent_item_id?: string) {
  const { data } = await api.patch<Item>(`/items/${id}/move`, { container_id, parent_item_id });
  return data;
}

export async function uploadItemImage(itemId: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post<{ image_url: string }>(`/uploads/image/${itemId}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function deleteItemImage(itemId: string) {
  await api.delete(`/uploads/image/${itemId}`);
}
