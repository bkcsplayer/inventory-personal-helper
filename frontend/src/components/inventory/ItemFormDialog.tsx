import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BarcodeScanner } from "./BarcodeScanner";
import { DynamicAttributes } from "./DynamicAttributes";
import { createItem } from "@/services/items";

interface ItemFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

const CATEGORIES = ["GPU", "矿机", "网线", "光纤", "3D耗材", "电子元器件", "电动工具", "其他"];
const UNITS = ["个", "卷", "条", "片", "kg", "m"];

export function ItemFormDialog({ open, onOpenChange, onCreated }: ItemFormDialogProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    item_type: "consumable" as "consumable" | "asset",
    name: "",
    sku: "",
    category: "",
    quantity: "1",
    unit: "个",
    min_stock: "",
    unit_price: "",
    barcode: "",
    location_note: "",
    restock_url: "",
    attributes: {} as Record<string, string>,
  });

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await createItem({
        item_type: form.item_type,
        name: form.name,
        sku: form.sku || undefined,
        category: form.category,
        quantity: parseFloat(form.quantity) || 1,
        unit: form.unit,
        min_stock: form.min_stock ? parseFloat(form.min_stock) : undefined,
        unit_price: form.unit_price ? parseFloat(form.unit_price) : undefined,
        barcode: form.barcode || undefined,
        location_note: form.location_note || undefined,
        restock_url: form.restock_url || undefined,
        attributes: form.attributes,
        status: "in_stock",
      });
      onCreated();
      onOpenChange(false);
      setForm({
        item_type: "consumable",
        name: "",
        sku: "",
        category: "",
        quantity: "1",
        unit: "个",
        min_stock: "",
        unit_price: "",
        barcode: "",
        location_note: "",
        restock_url: "",
        attributes: {},
      });
    } catch {
      // error handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("inventory.addItem")}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>{t("inventory.type")}</Label>
              <Select value={form.item_type} onValueChange={(v) => update("item_type", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="consumable">{t("inventory.consumable")}</SelectItem>
                  <SelectItem value="asset">{t("inventory.asset")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>{t("inventory.category")}</Label>
              <Select value={form.category} onValueChange={(v) => update("category", v)}>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label>{t("item.name")}</Label>
            <Input value={form.name} onChange={(e) => update("name", e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>{t("item.sku")}</Label>
              <Input value={form.sku} onChange={(e) => update("sku", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>{t("item.barcode")}</Label>
              <div className="flex gap-2">
                <Input
                  value={form.barcode}
                  onChange={(e) => update("barcode", e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          <BarcodeScanner onScan={(val) => update("barcode", val)} />

          {form.item_type === "consumable" && (
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label>{t("inventory.quantity")}</Label>
                <Input
                  type="number"
                  value={form.quantity}
                  onChange={(e) => update("quantity", e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>{t("item.unit")}</Label>
                <Select value={form.unit} onValueChange={(v) => update("unit", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>{t("item.minStock")}</Label>
                <Input
                  type="number"
                  value={form.min_stock}
                  onChange={(e) => update("min_stock", e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>{t("item.unitPrice")}</Label>
              <Input
                type="number"
                step="0.01"
                value={form.unit_price}
                onChange={(e) => update("unit_price", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>{t("item.location")}</Label>
              <Input
                value={form.location_note}
                onChange={(e) => update("location_note", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label>{t("item.restockUrl")}</Label>
            <Input
              value={form.restock_url}
              onChange={(e) => update("restock_url", e.target.value)}
              placeholder="https://..."
            />
          </div>

          {form.category && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t("item.attributes")}</Label>
              <DynamicAttributes
                category={form.category}
                attributes={form.attributes}
                onChange={(attrs) => setForm((prev) => ({ ...prev, attributes: attrs }))}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !form.name || !form.category}>
            {loading ? t("common.loading") : t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
