import { useState, useEffect } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adjustQuantity } from "@/services/items";
import { useInventoryStore } from "@/stores/inventoryStore";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { fmtQty } from "@/lib/format";

export interface QuickAdjustProps {
  itemId: string;
  currentQty: number;
  unit: string;
  minStock?: number | null;
}

export function QuickAdjust({
  itemId,
  currentQty,
  unit,
  minStock,
}: QuickAdjustProps) {
  const [qty, setQty] = useState(currentQty);
  const [loading, setLoading] = useState(false);
  const { items, updateItem } = useInventoryStore();
  const { toast } = useToast();
  const isLow = minStock != null && qty <= minStock;

  useEffect(() => {
    setQty(currentQty);
  }, [currentQty]);

  const handleAdjust = async (delta: number) => {
    const prevQty = qty;
    const newQty = Math.max(0, qty + delta);
    const item = items.find((i) => String(i.id) === String(itemId));
    setQty(newQty);
    if (item) {
      updateItem({ ...item, quantity: newQty });
    }
    setLoading(true);
    try {
      const updated = await adjustQuantity(itemId, delta);
      setQty(updated.quantity);
      if (item) {
        updateItem({ ...item, ...updated });
      }
    } catch {
      setQty(prevQty);
      if (item) {
        updateItem({ ...item, quantity: prevQty });
      }
      toast({
        title: "Adjustment failed",
        description: "Could not update quantity. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <Button
        size="icon"
        variant="outline"
        className="h-8 w-8"
        disabled={loading || qty <= 0}
        onClick={() => handleAdjust(-1)}
      >
        <Minus className="h-4 w-4" />
      </Button>
      <span
        className={cn(
          "min-w-[3ch] text-center font-medium tabular-nums",
          isLow && "text-destructive"
        )}
      >
        {fmtQty(qty)}
      </span>
      <span className="text-muted-foreground text-sm">{unit}</span>
      <Button
        size="icon"
        variant="outline"
        className="h-8 w-8"
        disabled={loading}
        onClick={() => handleAdjust(1)}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
