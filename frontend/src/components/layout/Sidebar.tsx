import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  HardDrive,
  Box,
  BarChart3,
  ScanLine,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

const navItems = [
  { key: "dashboard", path: "/", icon: LayoutDashboard },
  { key: "inventory", path: "/inventory", icon: Package },
  { key: "assets", path: "/assets", icon: HardDrive },
  { key: "containers", path: "/containers", icon: Box },
  { key: "reports", path: "/reports", icon: BarChart3 },
  { key: "scan", path: "/scan", icon: ScanLine },
];

export function Sidebar({ open, onClose }: SidebarProps) {
  const { t } = useTranslation();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-card transition-transform duration-200 md:relative md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 items-center justify-between px-4">
          <span className="text-lg font-bold text-primary">Nexus EAM</span>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <Separator />
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map(({ key, path, icon: Icon }) => (
            <NavLink
              key={key}
              to={path}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )
              }
              end={path === "/"}
            >
              <Icon className="h-4 w-4" />
              {t(`nav.${key}`)}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
