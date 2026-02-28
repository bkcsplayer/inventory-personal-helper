export interface User {
  id: string;
  username: string;
  email: string;
  role: "admin" | "operator" | "viewer";
  is_active: boolean;
  created_at: string;
}

export interface Container {
  id: string;
  name: string;
  description?: string;
  location?: string;
  qr_code_id: string;
  parent_container_id?: string;
  created_at: string;
  updated_at: string;
  children?: Container[];
  items?: Item[];
}

export interface Item {
  id: string;
  item_type: "consumable" | "asset";
  name: string;
  sku?: string;
  category: string;
  container_id?: string;
  parent_item_id?: string;
  location_note?: string;
  quantity: number;
  unit: string;
  min_stock?: number;
  unit_price?: number;
  purchase_date?: string;
  status: "in_stock" | "in_service" | "idle" | "loaned" | "damaged" | "retired";
  assigned_to?: string;
  attributes: Record<string, unknown>;
  restock_url?: string;
  barcode?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface ScanResult {
  container: {
    id: string;
    name: string;
    location?: string;
    qr_code_id: string;
  };
  items: {
    id: string;
    name: string;
    item_type: string;
    category: string;
    quantity: number;
    unit: string;
    status: string;
    min_stock?: number;
  }[];
}
