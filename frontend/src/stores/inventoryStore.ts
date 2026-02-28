import { create } from "zustand";
import type { Item, Container } from "../types";
import { getItems, type ItemFilters } from "../services/items";
import { getContainers } from "../services/containers";

interface InventoryFilters {
  itemType?: string;
  category?: string;
  status?: string;
  containerId?: string;
  search?: string;
  lowStock?: boolean;
}

interface InventoryState {
  items: Item[];
  total: number;
  page: number;
  pageSize: number;
  containers: Container[];
  filters: InventoryFilters;
  loadingItems: boolean;
  loadingContainers: boolean;
  fetchItems: () => Promise<void>;
  fetchContainers: () => Promise<void>;
  setFilter: (filters: Partial<InventoryFilters>) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  updateItem: (item: Item) => void;
  removeItem: (id: string) => void;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  items: [],
  total: 0,
  page: 1,
  pageSize: 20,
  containers: [],
  filters: {},
  loadingItems: false,
  loadingContainers: false,

  fetchItems: async () => {
    const { page, pageSize, filters } = get();
    set({ loadingItems: true });
    try {
      const params: ItemFilters = {
        page,
        page_size: pageSize,
        item_type: filters.itemType,
        category: filters.category,
        status: filters.status,
        container_id: filters.containerId,
        search: filters.search,
        low_stock: filters.lowStock,
      };
      const result = await getItems(params);
      set({ items: result.items, total: result.total });
    } finally {
      set({ loadingItems: false });
    }
  },

  fetchContainers: async () => {
    set({ loadingContainers: true });
    try {
      const containers = await getContainers();
      set({ containers });
    } finally {
      set({ loadingContainers: false });
    }
  },

  setFilter: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
      page: 1,
    }));
    get().fetchItems();
  },

  setPage: (page) => {
    set({ page });
    get().fetchItems();
  },

  setPageSize: (pageSize) => {
    set({ pageSize, page: 1 });
    get().fetchItems();
  },

  updateItem: (updated) => {
    set((state) => ({
      items: state.items.map((item) => (item.id === updated.id ? updated : item)),
    }));
  },

  removeItem: (id) => {
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
      total: state.total - 1,
    }));
  },
}));
