import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Minus, Plus, Check } from "lucide-react";
import api from "@/services/api";
import { adjustQuantity } from "@/services/items";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { fmtQty } from "@/lib/format";

interface ScanItem {
  id: string;
  name: string;
  quantity: number;
  unit?: string;
  item_type: string;
  category?: string;
  status?: string;
  min_stock?: number;
}

interface ScanResponse {
  container: { id: string; name: string; location: string; qr_code_id: string };
  items: ScanItem[];
}

export default function ScanAction() {
  const { qrCodeId } = useParams<{ qrCodeId: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ScanResponse | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  useEffect(() => {
    if (!qrCodeId) {
      setError("Invalid QR code");
      setLoading(false);
      return;
    }
    api
      .get<ScanResponse>(`/scan/${qrCodeId}`)
      .then((res) => {
        setData(res.data);
        setError(null);
      })
      .catch(() => {
        setError("Container not found");
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [qrCodeId]);

  async function handleAdjust(itemId: string, delta: number) {
    try {
      await adjustQuantity(itemId, delta);
      setData((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.map((i) =>
                i.id === itemId
                  ? { ...i, quantity: Math.max(0, i.quantity + delta) }
                  : i
              ),
            }
          : null
      );
      setSuccessId(itemId);
      setTimeout(() => setSuccessId(null), 800);
    } catch {
      setError("Failed to update");
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <p className="text-lg text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <p className="text-lg text-destructive">{error ?? "Not found"}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-lg px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold">{data.container.name}</h1>
        <p className="mt-1 text-lg text-muted-foreground">
          {data.container.location}
        </p>
      </div>

      <div className="space-y-4">
        {data.items.map((item) => (
          <Card
            key={item.id}
            className={`transition-all ${
              successId === item.id ? "ring-2 ring-green-500" : ""
            }`}
          >
            <CardContent className="flex items-center justify-between gap-4 p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate text-lg font-medium">{item.name}</p>
                <p className="text-muted-foreground">
                  {fmtQty(item.quantity)} {item.unit ?? ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  size="lg"
                  variant="outline"
                  className="min-h-[44px] min-w-[44px] p-0"
                  onClick={() => handleAdjust(item.id, -1)}
                  disabled={item.quantity <= 0}
                >
                  <Minus className="h-6 w-6" />
                </Button>
                {successId === item.id && (
                  <Check className="h-8 w-8 text-green-500" />
                )}
                <Button
                  size="lg"
                  variant="outline"
                  className="min-h-[44px] min-w-[44px] p-0"
                  onClick={() => handleAdjust(item.id, 1)}
                >
                  <Plus className="h-6 w-6" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {data.items.length === 0 && (
        <p className="text-center text-muted-foreground">No items in container</p>
      )}
    </div>
  );
}
