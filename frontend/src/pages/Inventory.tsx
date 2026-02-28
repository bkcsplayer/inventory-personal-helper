import { useEffect, useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Search, Plus, ChevronLeft, ChevronRight, Pencil, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useInventoryStore } from "@/stores/inventoryStore";
import { createItem, updateItem, deleteItem, uploadItemImage } from "@/services/items";
import { QuickAdjust } from "@/components/inventory/QuickAdjust";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { fmtQty } from "@/lib/format";
import { ItemThumbnail, ImageLightbox } from "@/components/ui/image-lightbox";
import type { Item } from "@/types";

const STATUSES = [
  "in_stock",
  "in_service",
  "idle",
  "loaned",
  "damaged",
  "retired",
] as const;

const STATUS_BADGE_CLASS: Record<string, string> = {
  in_stock: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30",
  in_service: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
  idle: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30",
  loaned: "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30",
  damaged: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
  retired: "bg-gray-500/15 text-gray-600 dark:text-gray-400 border-gray-500/30",
};

const DEFAULT_CATEGORIES = [
  "GPU", "矿机", "网线", "光纤", "3D耗材", "电子元器件",
  "电动工具", "太阳能配件", "网络设备", "单板电脑", "3D打印机",
];

const UNIT_OPTIONS = ["个", "卷", "条", "片", "kg", "m"];

const LS_KEY = "nexus_categories";

function loadCategories(): string[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* ignore */ }
  return [...DEFAULT_CATEGORIES];
}

function saveCategories(cats: string[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(cats));
}

function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const className = STATUS_BADGE_CLASS[status] ?? "bg-secondary text-secondary-foreground";
  return (
    <Badge variant="outline" className={cn("capitalize", className)}>
      {t(`status.${status}`)}
    </Badge>
  );
}

function useDebouncedCallback<T extends unknown[]>(
  callback: (...args: T) => void,
  delay: number
): (...args: T) => void {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  return useCallback(
    (...args: T) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => callbackRef.current(...args), delay);
    },
    [delay]
  );
}

interface AddFormState {
  name: string;
  category: string;
  item_type: "consumable" | "asset";
  quantity: number;
  unit: string;
  min_stock: number;
  unit_price: string;
  status: string;
  barcode: string;
  location_note: string;
}

const EMPTY_FORM: AddFormState = {
  name: "",
  category: "",
  item_type: "consumable",
  quantity: 1,
  unit: "个",
  min_stock: 0,
  unit_price: "",
  status: "in_stock",
  barcode: "",
  location_note: "",
};

export default function Inventory() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const {
    items,
    total,
    page,
    pageSize,
    filters,
    loadingItems,
    fetchItems,
    setFilter,
    setPage,
    setPageSize,
  } = useInventoryStore();

  const [searchInput, setSearchInput] = useState(filters.search ?? "");
  const [filterCategoryInput, setFilterCategoryInput] = useState(filters.category ?? "");
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState<AddFormState>({ ...EMPTY_FORM });
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const pendingFileRef = useRef<HTMLInputElement>(null);
  const [allCategories, setAllCategories] = useState<string[]>(loadCategories);
  const [categoryInput, setCategoryInput] = useState("");
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<Item | null>(null);
  const [editForm, setEditForm] = useState<AddFormState>({ ...EMPTY_FORM });
  const [editImage, setEditImage] = useState<File | null>(null);
  const [editPreview, setEditPreview] = useState<string | null>(null);
  const editFileRef = useRef<HTMLInputElement>(null);

  const debouncedSearch = useDebouncedCallback((value: string) => {
    setFilter({ search: value || undefined });
  }, 300);

  const debouncedCategory = useDebouncedCallback((value: string) => {
    setFilter({ category: value || undefined });
  }, 300);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    setFilterCategoryInput(filters.category ?? "");
  }, [filters.category]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setSearchInput(v);
    debouncedSearch(v);
  };

  const pages = Math.max(1, Math.ceil(total / pageSize));

  const addCategory = () => {
    const trimmed = categoryInput.trim();
    if (!trimmed) return;
    setAddForm((prev) => ({ ...prev, category: trimmed }));
    if (!allCategories.includes(trimmed)) {
      const updated = [...allCategories, trimmed];
      setAllCategories(updated);
      saveCategories(updated);
    }
    setCategoryInput("");
  };

  const openEdit = (item: Item) => {
    setEditItem(item);
    setEditForm({
      name: item.name,
      category: item.category,
      item_type: item.item_type,
      quantity: item.quantity,
      unit: item.unit,
      min_stock: item.min_stock ?? 0,
      unit_price: item.unit_price?.toString() ?? "",
      status: item.status,
      barcode: item.barcode ?? "",
      location_note: item.location_note ?? "",
    });
    setEditPreview(item.image_url || null);
    setEditImage(null);
  };

  const handleEditItem = async () => {
    if (!editItem) return;
    try {
      const payload: Record<string, unknown> = {};
      if (editForm.name.trim() !== editItem.name) payload.name = editForm.name.trim();
      if (editForm.category.trim() !== editItem.category) payload.category = editForm.category.trim();
      if (editForm.status !== editItem.status) payload.status = editForm.status;
      if (editForm.quantity !== editItem.quantity) payload.quantity = editForm.quantity;
      if (editForm.unit !== editItem.unit) payload.unit = editForm.unit;
      if (editForm.barcode.trim() !== (editItem.barcode ?? "")) payload.barcode = editForm.barcode.trim() || null;
      if (editForm.location_note.trim() !== (editItem.location_note ?? "")) payload.location_note = editForm.location_note.trim() || null;
      const price = editForm.unit_price ? parseFloat(editForm.unit_price) : null;
      if (price !== (editItem.unit_price ?? null)) payload.unit_price = price;
      const ms = editForm.item_type === "consumable" && editForm.min_stock > 0 ? editForm.min_stock : null;
      if (ms !== (editItem.min_stock ?? null)) payload.min_stock = ms;

      if (Object.keys(payload).length > 0) {
        await updateItem(editItem.id, payload as Partial<Item>);
      }
      if (editImage) {
        await uploadItemImage(editItem.id, editImage);
      }
      setEditItem(null);
      setEditImage(null);
      setEditPreview(null);
      await fetchItems();
      toast({ title: "Item updated" });
    } catch {
      toast({ title: "Failed to update item", variant: "destructive" });
    }
  };

  const handleDeleteItem = async (item: Item) => {
    if (!window.confirm(`确定删除 "${item.name}"？此操作不可撤销。`)) return;
    try {
      await deleteItem(item.id);
      await fetchItems();
      toast({ title: "Item deleted" });
    } catch {
      toast({ title: "Failed to delete item", variant: "destructive" });
    }
  };

  const handleAddItem = async () => {
    if (!addForm.name.trim() || !addForm.category.trim()) {
      toast({
        title: "Validation error",
        description: "Name and category are required.",
        variant: "destructive",
      });
      return;
    }
    try {
      const payload: Record<string, unknown> = {
        name: addForm.name.trim(),
        category: addForm.category.trim(),
        item_type: addForm.item_type,
        quantity: addForm.quantity,
        unit: addForm.unit,
        status: addForm.status,
      };
      if (addForm.item_type === "consumable" && addForm.min_stock > 0) {
        payload.min_stock = addForm.min_stock;
      }
      if (addForm.unit_price) {
        payload.unit_price = parseFloat(addForm.unit_price);
      }
      if (addForm.barcode.trim()) {
        payload.barcode = addForm.barcode.trim();
      }
      if (addForm.location_note.trim()) {
        payload.location_note = addForm.location_note.trim();
      }
      const created = await createItem(payload);
      if (pendingImage && created.id) {
        try {
          await uploadItemImage(created.id, pendingImage);
        } catch { /* image upload failed, item still created */ }
      }
      setAddOpen(false);
      setAddForm({ ...EMPTY_FORM });
      setPendingImage(null);
      setPendingPreview(null);
      setCategoryInput("");
      await fetchItems();
      toast({ title: "Item created" });
    } catch {
      toast({
        title: "Failed to create item",
        variant: "destructive",
      });
    }
  };

  const minStock = (item: Item) => item.min_stock;

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">{t("inventory.title")}</h1>
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("inventory.search")}
            value={searchInput}
            onChange={handleSearchChange}
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Select
          value={filters.itemType ?? "all"}
          onValueChange={(v) => setFilter({ itemType: v === "all" ? undefined : v })}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder={t("inventory.type")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("inventory.allTypes")}</SelectItem>
            <SelectItem value="consumable">{t("inventory.consumable")}</SelectItem>
            <SelectItem value="asset">{t("inventory.asset")}</SelectItem>
          </SelectContent>
        </Select>
        <Input
          placeholder={t("inventory.category")}
          value={filterCategoryInput}
          onChange={(e) => {
            const v = e.target.value;
            setFilterCategoryInput(v);
            debouncedCategory(v);
          }}
          className="w-[140px]"
        />
        <Select
          value={filters.status ?? "all"}
          onValueChange={(v) => setFilter({ status: v === "all" ? undefined : v })}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder={t("inventory.status")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("inventory.allStatuses", "All Statuses")}</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {t(`status.${s}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t("inventory.addItem")}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{t("item.createTitle", "Create New Item")}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* Name + Image */}
              <div className="flex gap-4">
                <div className="grid flex-1 gap-2">
                  <Label>{t("item.name")}</Label>
                  <Input
                    value={addForm.name}
                    onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder={t("item.name")}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>图片</Label>
                  <input
                    ref={pendingFileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        setPendingImage(f);
                        setPendingPreview(URL.createObjectURL(f));
                      }
                    }}
                  />
                  {pendingPreview ? (
                    <div className="relative">
                      <img src={pendingPreview} alt="" className="h-16 w-16 rounded-lg border object-cover" />
                      <button
                        type="button"
                        onClick={() => { setPendingImage(null); setPendingPreview(null); if (pendingFileRef.current) pendingFileRef.current.value = ""; }}
                        className="absolute -right-1.5 -top-1.5 rounded-full bg-destructive p-0.5 text-white"
                      >
                        <span className="block h-3 w-3 text-center text-[10px] leading-3">&times;</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => pendingFileRef.current?.click()}
                      className="flex h-16 w-16 flex-col items-center justify-center gap-0.5 rounded-lg border-2 border-dashed text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                    >
                      <Plus className="h-4 w-4" />
                      <span className="text-[10px]">图片</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Category tag selector */}
              <div className="grid gap-2">
                <Label>{t("inventory.category")}</Label>
                <div className="flex gap-2">
                  <Input
                    value={categoryInput}
                    onChange={(e) => setCategoryInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCategory(); } }}
                    placeholder="输入新分类..."
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addCategory}>+</Button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {allCategories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setAddForm(prev => ({ ...prev, category: cat }))}
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                        addForm.category === cat
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary/50 text-secondary-foreground border-border hover:bg-secondary"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Item type & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>{t("item.itemType", "Item Type")}</Label>
                  <Select
                    value={addForm.item_type}
                    onValueChange={(v: "consumable" | "asset") =>
                      setAddForm((p) => ({ ...p, item_type: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="consumable">{t("inventory.consumable")}</SelectItem>
                      <SelectItem value="asset">{t("inventory.asset")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>{t("inventory.status")}</Label>
                  <Select
                    value={addForm.status}
                    onValueChange={(v) => setAddForm((p) => ({ ...p, status: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {t(`status.${s}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Quantity & Unit */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>{t("inventory.quantity")}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={addForm.quantity}
                    onChange={(e) =>
                      setAddForm((p) => ({ ...p, quantity: Number(e.target.value) || 0 }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>{t("item.unit")}</Label>
                  <Select
                    value={addForm.unit}
                    onValueChange={(v) => setAddForm((p) => ({ ...p, unit: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNIT_OPTIONS.map((u) => (
                        <SelectItem key={u} value={u}>{u}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Min stock (consumable only) & Unit price */}
              <div className="grid grid-cols-2 gap-4">
                {addForm.item_type === "consumable" && (
                  <div className="grid gap-2">
                    <Label>{t("item.minStock", "Min Stock")}</Label>
                    <Input
                      type="number"
                      min={0}
                      value={addForm.min_stock}
                      onChange={(e) =>
                        setAddForm((p) => ({ ...p, min_stock: Number(e.target.value) || 0 }))
                      }
                    />
                  </div>
                )}
                <div className="grid gap-2">
                  <Label>{t("item.unitPrice", "Unit Price")}</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={addForm.unit_price}
                    onChange={(e) =>
                      setAddForm((p) => ({ ...p, unit_price: e.target.value }))
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Barcode & Location */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>{t("item.barcode", "Barcode")}</Label>
                  <Input
                    value={addForm.barcode}
                    onChange={(e) => setAddForm((p) => ({ ...p, barcode: e.target.value }))}
                    placeholder={t("item.barcode", "Barcode")}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>{t("item.locationNote", "Location Note")}</Label>
                  <Input
                    value={addForm.location_note}
                    onChange={(e) => setAddForm((p) => ({ ...p, location_note: e.target.value }))}
                    placeholder={t("item.locationNote", "Location Note")}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button onClick={handleAddItem}>{t("common.save")}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border">
        {loadingItems ? (
          <div className="flex items-center justify-center p-8">{t("common.loading")}</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>{t("item.name")}</TableHead>
                <TableHead>{t("inventory.category")}</TableHead>
                <TableHead>{t("inventory.type")}</TableHead>
                <TableHead>{t("inventory.quantity")}</TableHead>
                <TableHead>{t("inventory.status")}</TableHead>
                <TableHead className="w-[100px]">{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    {t("common.noData")}
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="p-2">
                      <button
                        type="button"
                        className="block cursor-pointer"
                        onClick={() => item.image_url && setLightboxSrc(item.image_url)}
                      >
                        <ItemThumbnail src={item.image_url} alt={item.name} size={40} />
                      </button>
                    </TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.category ?? "-"}</TableCell>
                    <TableCell>{t(`inventory.${item.item_type}`)}</TableCell>
                    <TableCell>
                      {item.item_type === "consumable" ? (
                        <QuickAdjust
                          itemId={String(item.id)}
                          currentQty={item.quantity}
                          unit={item.unit ?? "个"}
                          minStock={minStock(item)}
                        />
                      ) : (
                        <span className="tabular-nums">
                          {fmtQty(item.quantity)} {item.unit ?? ""}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={item.status} />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteItem(item)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            {t("inventory.page", "Page")} {page} / {pages}
          </span>
          <Select
            value={String(pageSize)}
            onValueChange={(v) => setPageSize(Number(v))}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
            {t("inventory.prev", "Previous")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pages}
            onClick={() => setPage(page + 1)}
          >
            {t("inventory.next", "Next")}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Dialog open={!!editItem} onOpenChange={(open) => { if (!open) { setEditItem(null); setEditImage(null); setEditPreview(null); } }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑物品</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex gap-4">
              <div className="grid flex-1 gap-2">
                <Label>{t("item.name")}</Label>
                <Input value={editForm.name} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>图片</Label>
                <input ref={editFileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setEditImage(f); setEditPreview(URL.createObjectURL(f)); } }} />
                {editPreview ? (
                  <div className="relative">
                    <img src={editPreview} alt="" className="h-16 w-16 rounded-lg border object-cover" />
                    <button type="button" onClick={() => { setEditImage(null); setEditPreview(null); if (editFileRef.current) editFileRef.current.value = ""; }} className="absolute -right-1.5 -top-1.5 rounded-full bg-destructive p-0.5 text-white">
                      <span className="block h-3 w-3 text-center text-[10px] leading-3">&times;</span>
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => editFileRef.current?.click()} className="flex h-16 w-16 flex-col items-center justify-center gap-0.5 rounded-lg border-2 border-dashed text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                    <Plus className="h-4 w-4" /><span className="text-[10px]">图片</span>
                  </button>
                )}
              </div>
            </div>
            <div className="grid gap-2">
              <Label>{t("inventory.category")}</Label>
              <div className="flex flex-wrap gap-1.5">
                {allCategories.map((cat) => (
                  <button key={cat} type="button" onClick={() => setEditForm(prev => ({ ...prev, category: cat }))} className={cn("rounded-full px-3 py-1 text-xs font-medium border transition-colors", editForm.category === cat ? "bg-primary text-primary-foreground border-primary" : "bg-secondary/50 text-secondary-foreground border-border hover:bg-secondary")}>{cat}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>{t("inventory.status")}</Label>
                <Select value={editForm.status} onValueChange={(v) => setEditForm((p) => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map((s) => (<SelectItem key={s} value={s}>{t(`status.${s}`)}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>{t("item.unit")}</Label>
                <Select value={editForm.unit} onValueChange={(v) => setEditForm((p) => ({ ...p, unit: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{UNIT_OPTIONS.map((u) => (<SelectItem key={u} value={u}>{u}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>{t("inventory.quantity")}</Label>
                <Input type="number" min={0} value={editForm.quantity} onChange={(e) => setEditForm((p) => ({ ...p, quantity: Number(e.target.value) || 0 }))} />
              </div>
              <div className="grid gap-2">
                <Label>{t("item.unitPrice")}</Label>
                <Input type="number" min={0} step="0.01" value={editForm.unit_price} onChange={(e) => setEditForm((p) => ({ ...p, unit_price: e.target.value }))} placeholder="0.00" />
              </div>
            </div>
            {editForm.item_type === "consumable" && (
              <div className="grid gap-2">
                <Label>{t("item.minStock")}</Label>
                <Input type="number" min={0} value={editForm.min_stock} onChange={(e) => setEditForm((p) => ({ ...p, min_stock: Number(e.target.value) || 0 }))} />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>{t("item.barcode")}</Label>
                <Input value={editForm.barcode} onChange={(e) => setEditForm((p) => ({ ...p, barcode: e.target.value }))} />
              </div>
              <div className="grid gap-2">
                <Label>Location</Label>
                <Input value={editForm.location_note} onChange={(e) => setEditForm((p) => ({ ...p, location_note: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>{t("common.cancel")}</Button>
            <Button onClick={handleEditItem}>{t("common.save")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ImageLightbox
        src={lightboxSrc ?? ""}
        open={!!lightboxSrc}
        onClose={() => setLightboxSrc(null)}
      />
    </div>
  );
}
