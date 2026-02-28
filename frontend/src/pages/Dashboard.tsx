import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getSummary,
  getLowStock,
  getLoanedAssets,
  getIdleAssets,
} from "@/services/reports";
import { fmtQty } from "@/lib/format";
import type { Item } from "@/types";
import type { SummaryData } from "@/services/reports";
import {
  DollarSign,
  Package,
  AlertTriangle,
  UserCheck,
  TrendingUp,
  Activity,
} from "lucide-react";

const CHART_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
];

const STATUS_COLORS: Record<string, string> = {
  in_stock: "#22c55e",
  in_service: "#3b82f6",
  idle: "#eab308",
  loaned: "#a855f7",
  damaged: "#ef4444",
  retired: "#6b7280",
};

const STATUS_ORDER = [
  "in_stock",
  "in_service",
  "idle",
  "loaned",
  "damaged",
  "retired",
] as const;

export default function Dashboard() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [lowStock, setLowStock] = useState<Item[]>([]);
  const [loaned, setLoaned] = useState<Item[]>([]);
  const [idle, setIdle] = useState<Item[]>([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [summaryRes, lowStockRes, loanedRes, idleRes] = await Promise.all([
          getSummary(),
          getLowStock(),
          getLoanedAssets(),
          getIdleAssets(),
        ]);
        setSummary(summaryRes);
        setLowStock(lowStockRes);
        setLoaned(loanedRes);
        setIdle(idleRes);
      } catch {
        setSummary(null);
        setLowStock([]);
        setLoaned([]);
        setIdle([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  const categoryCount =
    summary?.by_category != null
      ? Object.entries(summary.by_category).filter(
          ([key]) => key != null && key !== "null" && key !== ""
        ).length
      : 0;

  const typeCount =
    summary?.by_type != null ? Object.keys(summary.by_type).length : 0;

  const pieData =
    summary != null
      ? Object.entries(summary.by_category ?? {})
          .filter(([key]) => key != null && key !== "null" && key !== "")
          .map(([name, value]) => ({ name, value }))
      : [];

  const statusBarData = STATUS_ORDER.map((status) => ({
    name: t(`status.${status}`),
    status,
    count: summary?.by_status?.[status] ?? 0,
  }));

  const loanedAndIdle: Array<Item & { _kind: "loaned" | "idle" }> = [
    ...loaned.map((i) => ({ ...i, _kind: "loaned" as const })),
    ...idle.map((i) => ({ ...i, _kind: "idle" as const })),
  ];

  return (
    <div className="space-y-6">
      {/* Row 1: Stat cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-blue-500/15 to-blue-600/5">
          <CardContent className="relative p-6">
            <div className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20">
              <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              {t("dashboard.totalValue")}
            </p>
            <p className="mt-2 text-2xl font-bold">
              ¥{(summary?.total_value ?? 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("dashboard.totalValueDesc", { count: categoryCount })}
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-0 bg-gradient-to-br from-emerald-500/15 to-emerald-600/5">
          <CardContent className="relative p-6">
            <div className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20">
              <Package className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              {t("dashboard.totalItems")}
            </p>
            <p className="mt-2 text-2xl font-bold">
              {fmtQty(summary?.total_items ?? 0)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("dashboard.totalItemsDesc", { count: typeCount })}
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-0 bg-gradient-to-br from-amber-500/15 to-amber-600/5">
          <CardContent className="relative p-6">
            <div className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              {t("dashboard.lowStock")}
            </p>
            <p className="mt-2 text-2xl font-bold">{fmtQty(lowStock.length)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("dashboard.lowStockDesc", { count: lowStock.length })}
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-0 bg-gradient-to-br from-violet-500/15 to-violet-600/5">
          <CardContent className="relative p-6">
            <div className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-violet-500/20">
              <UserCheck className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">
              {t("dashboard.loanedAssets")}
            </p>
            <p className="mt-2 text-2xl font-bold">{fmtQty(loaned.length)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("dashboard.loanedAssetsDesc", { loaned: loaned.length, idle: idle.length })}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.byCategory")}</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                {t("common.noData")}
              </p>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, value }) =>
                        `${name}: ${fmtQty(value)}`
                      }
                    >
                      {pieData.map((_, index) => (
                        <Cell
                          key={index}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => fmtQty(value)}
                    />
                    <Legend
                      formatter={(value, entry) =>
                        `${value}: ${fmtQty((entry.payload as { value: number }).value)}`
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("dashboard.assetStatus")}</CardTitle>
          </CardHeader>
          <CardContent>
            {statusBarData.every((d) => d.count === 0) ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                {t("common.noData")}
              </p>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={statusBarData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tickFormatter={(v) => fmtQty(v)} />
                    <YAxis type="category" dataKey="name" width={70} />
                    <Tooltip formatter={(value: number) => fmtQty(value)} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {statusBarData.map((entry, index) => (
                        <Cell
                          key={index}
                          fill={
                            STATUS_COLORS[entry.status] ??
                            CHART_COLORS[index % CHART_COLORS.length]
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Lists */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-l-4 border-l-red-500/60">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-red-500" />
              {t("dashboard.lowStock")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStock.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {t("common.noData")}
              </p>
            ) : (
              <ul className="space-y-2">
                {lowStock.map((item) => {
                  const minQty = item.min_stock;
                  return (
                    <li
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border border-red-200/50 bg-red-50/30 px-3 py-2 dark:border-red-900/30 dark:bg-red-950/20"
                    >
                      <span className="font-medium">{item.name}</span>
                      <Badge variant="destructive">
                        {fmtQty(item.quantity)}
                        {minQty != null && ` / ${fmtQty(minQty)}`} {item.unit}
                      </Badge>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-violet-500" />
              {t("dashboard.loanedAndIdle")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loanedAndIdle.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {t("common.noData")}
              </p>
            ) : (
              <ul className="space-y-2">
                {loanedAndIdle.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border px-3 py-2"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-medium">{item.name}</span>
                      <div className="flex flex-wrap gap-1">
                        {item._kind === "loaned" ? (
                          <Badge
                            className="border-violet-500/50 bg-violet-500/15 text-violet-700 dark:text-violet-300"
                            variant="outline"
                          >
                            {item.assigned_to ?? t("status.loaned")}
                          </Badge>
                        ) : (
                          <Badge
                            className="border-amber-500/50 bg-amber-500/15 text-amber-700 dark:text-amber-300"
                            variant="outline"
                          >
                            {t("status.idle")}
                          </Badge>
                        )}
                        <Badge variant="secondary">
                          {t(`status.${item.status}`)}
                        </Badge>
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {fmtQty(item.quantity)} {item.unit}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
