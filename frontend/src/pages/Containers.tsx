import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { QrCode, ChevronDown, ChevronRight } from "lucide-react";
import {
  getContainers,
  getContainer,
  createContainer,
  deleteContainer,
} from "@/services/containers";
import type { Container } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Containers() {
  const { t } = useTranslation();
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | number | null>(null);
  const [expandedItems, setExpandedItems] = useState<Container["items"]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    location: "",
    qr_code_id: "",
  });

  useEffect(() => {
    loadContainers();
  }, []);

  async function loadContainers() {
    setLoading(true);
    try {
      const data = await getContainers();
      setContainers(data);
    } catch {
      setContainers([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleExpand(id: string) {
    if (expandedId === id) {
      setExpandedId(null);
      setExpandedItems([]);
      return;
    }
    try {
      const detail = await getContainer(String(id));
      setExpandedId(id);
      setExpandedItems(detail.items ?? []);
    } catch {
      setExpandedItems([]);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.qr_code_id.trim()) return;
    try {
      await createContainer({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        location: form.location.trim() || undefined,
        qr_code_id: form.qr_code_id.trim(),
      });
      setForm({ name: "", description: "", location: "", qr_code_id: "" });
      setDialogOpen(false);
      loadContainers();
    } catch {
      // Error handling
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t("common.confirm"))) return;
    try {
      await deleteContainer(String(id));
      if (expandedId === id) {
        setExpandedId(null);
        setExpandedItems([]);
      }
      loadContainers();
    } catch {
      // Error handling
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("container.title")}</h1>
        <Button onClick={() => setDialogOpen(true)}>
          {t("container.addContainer")}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {containers.map((c) => (
          <Card key={String(c.id)} className="overflow-hidden">
            <CardHeader
              className="cursor-pointer select-none"
              onClick={() => handleExpand(c.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {expandedId === c.id ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                  <CardTitle className="text-base">{c.name}</CardTitle>
                </div>
                {c.qr_code_id && (
                  <Link to={`/scan/${c.qr_code_id}`}>
                    <Button variant="ghost" size="icon" asChild>
                      <span>
                        <QrCode className="h-4 w-4" />
                      </span>
                    </Button>
                  </Link>
                )}
              </div>
              <CardDescription className="text-sm">
                {c.location || "-"}
              </CardDescription>
              {c.qr_code_id && (
                <p className="text-xs text-muted-foreground">
                  {t("container.qrCode")}: {c.qr_code_id}
                </p>
              )}
            </CardHeader>
            {expandedId === c.id && (
              <CardContent className="border-t pt-4">
                <p className="mb-2 text-sm font-medium">
                  {t("container.items")}
                </p>
                {(expandedItems?.length ?? 0) === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {t("container.empty")}
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {(expandedItems ?? []).map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center justify-between rounded border px-3 py-2 text-sm"
                      >
                        <span>{item.name}</span>
                        <span className="text-muted-foreground">
                          {item.quantity} {item.unit ?? ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  className="mt-4"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(c.id);
                  }}
                >
                  {t("common.delete")}
                </Button>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("container.addContainer")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("container.name")}</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">{t("container.location")}</Label>
              <Input
                id="location"
                value={form.location}
                onChange={(e) =>
                  setForm((f) => ({ ...f, location: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="qr_code_id">{t("container.qrCode")}</Label>
              <Input
                id="qr_code_id"
                value={form.qr_code_id}
                onChange={(e) =>
                  setForm((f) => ({ ...f, qr_code_id: e.target.value }))
                }
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit">{t("common.save")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
