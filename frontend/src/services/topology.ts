import api from "./api";

export interface TopologyNode {
  id: string;
  name: string;
  category: string | null;
  status: string;
  item_type: string;
  quantity: number;
  unit: string | null;
  attributes: Record<string, unknown>;
  depth: number;
  children: TopologyNode[];
}

export async function getTopology(itemId: string): Promise<TopologyNode | null> {
  const { data } = await api.get<TopologyNode | null>(`/topology/${itemId}`);
  return data;
}
