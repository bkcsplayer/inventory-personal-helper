import { create } from "zustand";
import type { User } from "../types";
import { login as apiLogin, getMe, logout as apiLogout } from "../services/auth";

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem("token"),
  loading: false,
  isAuthenticated: !!localStorage.getItem("token"),

  login: async (username, password) => {
    set({ loading: true });
    try {
      const result = await apiLogin(username, password);
      set({ token: result.access_token, isAuthenticated: true });
      await get().fetchMe();
    } finally {
      set({ loading: false });
    }
  },

  logout: () => {
    apiLogout();
    set({ user: null, token: null, isAuthenticated: false });
  },

  fetchMe: async () => {
    set({ loading: true });
    try {
      const user = await getMe();
      set({ user });
    } catch {
      set({ user: null, token: null, isAuthenticated: false });
      apiLogout();
    } finally {
      set({ loading: false });
    }
  },
}));
