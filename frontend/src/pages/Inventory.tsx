import { useEffect, useState, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Search, Plus, ChevronLeft, ChevronRight } from "lucide-react";
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
import { createItem } from "@/services/items";
import { QuickAdjust } from "@/components/inventory/QuickAdjust";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
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
  const [categoryInput, setCategoryInput] = useState(filters.category ?? "");
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    category: "",
    item_type: "consumable" as "consumable" | "asset",
    quantity: 1,
    unit: "个",
    status: "in_stock",
  });

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
    setCategoryInput(filters.category ?? "");
  }, [filters.category]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setSearchInput(v);
    debouncedSearch(v);
  };

  const pages = Math.max(1, Math.ceil(total / pageSize));

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
      const payload: Partial<Item> = {
        name: addForm.name.trim(),
        category: addForm.category.trim(),
        item_type: addForm.item_type,
        quantity: addForm.quantity,
        unit: addForm.unit,
        status: addForm.status as Item["status"],
      };
      await createItem(payload);
      setAddOpen(false);
      setAddForm({ name: "", category: "", item_type: "consumable", quantity: 1, unit: "个", status: "in_stock" });
      fetchItems();
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
          value={categoryInput}
          onChange={(e) => {
            const v = e.target.value;
            setCategoryInput(v);
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("item.createTitle", "Create New Item")}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>{t("item.name")}</Label>
                <Input
                  value={addForm.name}
                  onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder={t("item.name")}
                />
              </div>
              <div className="grid gap-2">
                <Label>{t("inventory.category")}</Label>
                <Input
                  value={addForm.category}
                  onChange={(e) => setAddForm((p) => ({ ...p, category: e.target.value }))}
                  placeholder={t("inventory.category")}
                />
              </div>
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
                  <Input
                    value={addForm.unit}
                    onChange={(e) => setAddForm((p) => ({ ...p, unit: e.target.value }))}
                  />
                </div>
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
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    {t("common.noData")}
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id}>
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
                          {item.quantity} {item.unit ?? ""}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={item.status} />
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        {t("common.edit")}
                      </Button>
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
    </div>
  );
}
