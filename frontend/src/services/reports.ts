import api from "./api";
import type { Item } from "../types";

export interface SummaryData {
  total_items: number;
  total_value: number;
  by_category: Record<string, number>;
  by_type: Record<string, number>;
}

export async function getLowStock() {
  const { data } = await api.get<Item[]>("/reports/low-stock");
  return data;
}

export async function getIdleAssets() {
  const { data } = await api.get<Item[]>("/reports/idle-assets");
  return data;
}

export async function getLoanedAssets() {
  const { data } = await api.get<Item[]>("/reports/loaned");
  return data;
}

export async function getSummary() {
  const { data } = await api.get<SummaryData>("/reports/summary");
  return data;
}
