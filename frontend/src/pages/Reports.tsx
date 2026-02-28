import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  getLowStock,
  getIdleAssets,
  getLoanedAssets,
  getSummary,
  type SummaryData,
} from "@/services/reports";
import type { Item } from "@/types";
import { fmtQty } from "@/lib/format";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Reports() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [lowStock, setLowStock] = useState<Item[]>([]);
  const [idleAssets, setIdleAssets] = useState<Item[]>([]);
  const [loaned, setLoaned] = useState<Item[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [lowRes, idleRes, loanedRes, summaryRes] = await Promise.all([
          getLowStock(),
          getIdleAssets(),
          getLoanedAssets(),
          getSummary(),
        ]);
        setLowStock(lowRes);
        setIdleAssets(idleRes);
        setLoaned(loanedRes);
        setSummary(summaryRes);
      } catch {
        setLowStock([]);
        setIdleAssets([]);
        setLoaned([]);
        setSummary(null);
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

  const minStock = (item: Item) => item.min_stock;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("reports.title")}</h1>

      <Tabs defaultValue="lowStock" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="lowStock">{t("reports.lowStock")}</TabsTrigger>
          <TabsTrigger value="idle">{t("reports.idle")}</TabsTrigger>
          <TabsTrigger value="loaned">{t("reports.loaned")}</TabsTrigger>
          <TabsTrigger value="summary">{t("reports.summary")}</TabsTrigger>
        </TabsList>

        <TabsContent value="lowStock">
          <Card>
            <CardHeader>
              <CardTitle>{t("reports.lowStock")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("item.name")}</TableHead>
                    <TableHead>{t("inventory.quantity")}</TableHead>
                    <TableHead>{t("item.minStock")}</TableHead>
                    <TableHead>{t("item.unit")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStock.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">
                        {t("common.noData")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    lowStock.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{fmtQty(item.quantity)}</TableCell>
                        <TableCell>{minStock(item) != null ? fmtQty(minStock(item)) : "-"}</TableCell>
                        <TableCell>{item.unit ?? "-"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="idle">
          <Card>
            <CardHeader>
              <CardTitle>{t("reports.idle")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("item.name")}</TableHead>
                    <TableHead>{t("inventory.category")}</TableHead>
                    <TableHead>{t("inventory.status")}</TableHead>
                    <TableHead>{t("inventory.quantity")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {idleAssets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center">
                        {t("common.noData")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    idleAssets.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.category ?? "-"}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{item.status}</Badge>
                        </TableCell>
                        <TableCell>{fmtQty(item.quantity)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="loaned">
          <Card>
            <CardHeader>
              <CardTitle>{t("reports.loaned")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("item.name")}</TableHead>
                    <TableHead>{t("item.assignedTo")}</TableHead>
                    <TableHead>{t("inventory.status")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loaned.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center">
                        {t("common.noData")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    loaned.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.assigned_to ?? "-"}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{item.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle>{t("reports.summary")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">
                    {t("dashboard.totalValue")}
                  </p>
                  <p className="text-2xl font-bold">
                    ¥{summary?.total_value?.toLocaleString() ?? 0}
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">
                    {t("dashboard.totalItems")}
                  </p>
                  <p className="text-2xl font-bold">
                    {summary?.total_items ?? 0}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="mb-2 font-medium">By Category</h3>
                <div className="flex flex-wrap gap-2">
                  {summary?.by_category &&
                  Object.keys(summary.by_category).length > 0 ? (
                    Object.entries(summary.by_category)
                      .filter(
                        ([k]) => k != null && k !== "null" && k !== ""
                      )
                      .map(([cat, count]) => (
                        <Badge key={cat} variant="secondary">
                          {cat}: {count}
                        </Badge>
                      ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {t("common.noData")}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="mb-2 font-medium">By Type</h3>
                <div className="flex flex-wrap gap-2">
                  {summary?.by_type &&
                  Object.keys(summary.by_type).length > 0 ? (
                    Object.entries(summary.by_type).map(([type, count]) => (
                      <Badge key={type} variant="outline">
                        {type}: {count}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {t("common.noData")}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
