import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useInventoryStore } from "@/stores/inventoryStore";
import { getTopology, type TopologyNode } from "@/services/topology";
import { cn } from "@/lib/utils";
import { ItemThumbnail, ImageLightbox } from "@/components/ui/image-lightbox";

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

function TopologyTree({ node }: { node: TopologyNode }) {
  const { t } = useTranslation();
  const hasChildren = node.children && node.children.length > 0;
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="ml-4 border-l border-muted pl-2">
      <div
        className="flex items-center gap-1 py-1 text-sm cursor-pointer hover:bg-muted/50 rounded"
        onClick={() => hasChildren && setExpanded((e) => !e)}
      >
        {hasChildren ? (
          expanded ? (
            <ChevronDown className="h-4 w-4 shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0" />
          )
        ) : (
          <span className="w-4" />
        )}
        <span className="font-medium">{node.name}</span>
        {node.category && (
          <span className="text-muted-foreground">({node.category})</span>
        )}
        <StatusBadge status={node.status} />
      </div>
      {expanded && hasChildren && (
        <div className="mt-1">
          {node.children!.map((child) => (
            <TopologyTree key={child.id} node={child} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Assets() {
  const { t } = useTranslation();
  const {
    items,
    filters,
    loadingItems,
    fetchItems,
    setFilter,
  } = useInventoryStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [topology, setTopology] = useState<TopologyNode | null>(null);
  const [loadingTopology, setLoadingTopology] = useState(false);
  const [categoryInput, setCategoryInput] = useState(filters.category ?? "");
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  useEffect(() => {
    setFilter({ itemType: "asset" });
  }, [setFilter]);

  useEffect(() => {
    setCategoryInput(filters.category ?? "");
  }, [filters.category]);

  const assets = items.filter((i) => i.item_type === "asset");

  const handleCardClick = async (itemId: string) => {
    if (expandedId === itemId) {
      setExpandedId(null);
      setTopology(null);
      return;
    }
    setExpandedId(itemId);
    setLoadingTopology(true);
    setTopology(null);
    try {
      const tree = await getTopology(itemId);
      setTopology(tree);
    } finally {
      setLoadingTopology(false);
    }
  };

  const attrs = (item: (typeof items)[0]) =>
    (item as typeof item & { attributes?: Record<string, unknown> }).attributes ??
    (item as typeof item & { custom_fields?: Record<string, unknown> }).custom_fields ??
    {};

  const sku = (item: (typeof items)[0]) =>
    (item as typeof item & { sku?: string }).sku ?? "-";

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <h1 className="text-2xl font-bold">{t("assets.title", "Fixed Assets")}</h1>

      <div className="flex flex-wrap gap-2">
        <Input
          placeholder={t("assets.filterCategory", "Category")}
          value={categoryInput}
          onChange={(e) => {
            const v = e.target.value;
            setCategoryInput(v);
            setFilter({ category: v || undefined });
          }}
          className="w-[160px]"
        />
        <Select
          value={filters.status ?? "all"}
          onValueChange={(v) => setFilter({ status: v === "all" ? undefined : v })}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder={t("assets.filterStatus", "Status")} />
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

      {loadingItems ? (
        <div className="flex items-center justify-center p-12">{t("common.loading")}</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {assets.map((item) => {
            const isExpanded = expandedId === String(item.id);
            return (
              <Card
                key={item.id}
                className={cn(
                  "cursor-pointer overflow-hidden transition-all hover:border-primary/50 hover:shadow-md",
                  isExpanded && "ring-2 ring-primary"
                )}
              >
                <div className="flex">
                  <button
                    type="button"
                    className="shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (item.image_url) setLightboxSrc(item.image_url);
                    }}
                  >
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="h-[120px] w-[120px] object-cover"
                      />
                    ) : (
                      <div className="flex h-[120px] w-[120px] items-center justify-center bg-muted">
                        <ItemThumbnail src={null} size={48} />
                      </div>
                    )}
                  </button>
                  <div
                    className="flex min-w-0 flex-1 flex-col p-3"
                    onClick={() => handleCardClick(String(item.id))}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold truncate">{item.name}</h3>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {item.category ?? "-"} &middot; {t("item.sku")}: {sku(item)}
                    </p>
                    {Object.entries(attrs(item)).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
                        {Object.entries(attrs(item)).slice(0, 4).map(([k, v]) => (
                          <span key={k}>
                            <span className="text-muted-foreground">{k}:</span>{" "}
                            {String(v)}
                          </span>
                        ))}
                        {Object.entries(attrs(item)).length > 4 && (
                          <span className="text-muted-foreground">
                            +{Object.entries(attrs(item)).length - 4}
                          </span>
                        )}
                      </div>
                    )}
                    {item.assigned_to && (
                      <p className="mt-1 text-xs text-purple-600 dark:text-purple-400">
                        {t("item.assignedTo")}: {item.assigned_to}
                      </p>
                    )}
                  </div>
                </div>
                {isExpanded && (
                  <div className="border-t px-4 py-3">
                    {loadingTopology ? (
                      <div className="text-sm text-muted-foreground">
                        {t("common.loading")}
                      </div>
                    ) : topology ? (
                      <TopologyTree node={topology} />
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        {t("common.noData")}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {!loadingItems && assets.length === 0 && (
        <div className="flex items-center justify-center p-12 text-muted-foreground">
          {t("common.noData")}
        </div>
      )}

      <ImageLightbox
        src={lightboxSrc ?? ""}
        open={!!lightboxSrc}
        onClose={() => setLightboxSrc(null)}
      />
    </div>
  );
}
