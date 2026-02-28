import api from "./api";
import type { User } from "../types";

interface TokenResponse {
  access_token: string;
  token_type: string;
}

export async function login(username: string, password: string) {
  const { data } = await api.post<TokenResponse>("/auth/login", { username, password });
  localStorage.setItem("token", data.access_token);
  return data;
}

export async function register(
  username: string,
  email: string,
  password: string,
  role: string = "operator"
) {
  const { data } = await api.post<User>("/auth/register", { username, email, password, role });
  return data;
}

export async function getMe() {
  const { data } = await api.get<User>("/auth/me");
  return data;
}

export function logout() {
  localStorage.removeItem("token");
}
