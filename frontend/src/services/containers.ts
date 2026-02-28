import api from "./api";
import type { Container } from "../types";

export async function getContainers() {
  const { data } = await api.get<Container[]>("/containers");
  return data;
}

export async function getContainer(id: string) {
  const { data } = await api.get<Container>(`/containers/${id}`);
  return data;
}

export async function createContainer(container: {
  name: string;
  description?: string;
  location?: string;
  qr_code_id: string;
  parent_container_id?: string;
}) {
  const { data } = await api.post<Container>("/containers", container);
  return data;
}

export async function updateContainer(id: string, container: Partial<Container>) {
  const { data } = await api.patch<Container>(`/containers/${id}`, container);
  return data;
}

export async function deleteContainer(id: string) {
  await api.delete(`/containers/${id}`);
}
