import { Routes, Route, Navigate } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/layout/ThemeProvider";
import { AppShell } from "@/components/layout/AppShell";
import { useAuthStore } from "@/stores/authStore";

import Dashboard from "@/pages/Dashboard";
import Inventory from "@/pages/Inventory";
import Assets from "@/pages/Assets";
import Containers from "@/pages/Containers";
import Reports from "@/pages/Reports";
import ScanAction from "@/pages/ScanAction";
import Login from "@/pages/Login";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/scan/:qrCodeId" element={<ScanAction />} />
          <Route
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="assets" element={<Assets />} />
            <Route path="containers" element={<Containers />} />
            <Route path="reports" element={<Reports />} />
          </Route>
        </Routes>
      </TooltipProvider>
    </ThemeProvider>
  );
}
