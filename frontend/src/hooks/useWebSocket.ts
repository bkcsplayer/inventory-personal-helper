import { useEffect, useRef } from "react";
import { useInventoryStore } from "../stores/inventoryStore";

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const updateItem = useInventoryStore((s) => s.updateItem);
  const removeItem = useInventoryStore((s) => s.removeItem);
  const fetchItems = useInventoryStore((s) => s.fetchItems);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        switch (message.type) {
          case "item_updated":
            updateItem(message.payload);
            break;
          case "item_deleted":
            removeItem(message.payload.id);
            break;
          case "inventory_changed":
            fetchItems();
            break;
        }
      } catch {
        // ignore malformed messages
      }
    };

    ws.onclose = () => {
      setTimeout(() => {
        if (wsRef.current === ws) {
          wsRef.current = null;
        }
      }, 3000);
    };

    return () => {
      ws.close();
    };
  }, [updateItem, removeItem, fetchItems]);
}
