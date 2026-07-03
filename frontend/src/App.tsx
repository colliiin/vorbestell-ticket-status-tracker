import type { ReactElement } from "react";
import { EmptyState } from "./components/common/EmptyState";
import { LoadingState } from "./components/common/LoadingState";
import { PublicLayout } from "./components/layout/PublicLayout";
import { useAuth } from "./hooks/useAuth";
import { useCart } from "./hooks/useCart";
import { AdminStatsPage } from "./pages/AdminStatsPage";
import { CustomerTicketPage } from "./pages/CustomerTicketPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { OrderPage } from "./pages/OrderPage";
import { ProductEditorPage } from "./pages/ProductEditorPage";
import { ProductsPage } from "./pages/ProductsPage";
import { StaffProductsPage } from "./pages/StaffProductsPage";
import { StaffTicketPage } from "./pages/StaffTicketPage";
import { TicketsPage } from "./pages/TicketsPage";

function RequireAuth({ children, admin = false }: { children: ReactElement; admin?: boolean }) {
  const auth = useAuth();
  if (auth.loading) return <PublicLayout><LoadingState text="Anmeldung wird geprüft" /></PublicLayout>;
  if (!auth.user) { location.href = "/login"; return <PublicLayout><LoadingState text="Weiterleitung zum Login" /></PublicLayout>; }
  if (admin && auth.user.role !== "admin") return <PublicLayout><EmptyState title="Adminrechte erforderlich" text="Dein Konto darf diese Seite nicht öffnen." action={<a className="buttonLink" href="/dashboard">Zum Dashboard</a>} /></PublicLayout>;
  return children;
}

export function App() {
  const cartState = useCart();
  const path = location.pathname;
  if (path === "/") return <ProductsPage cartState={cartState} />;
  if (path === "/order") return <OrderPage cartState={cartState} />;
  if (path.startsWith("/ticket/") && path.endsWith("/chat")) return <CustomerTicketPage token={path.split("/")[2]} />;
  if (path === "/login") return <LoginPage />;
  if (path === "/dashboard") return <RequireAuth><DashboardPage /></RequireAuth>;
  if (path === "/dashboard/products") return <RequireAuth><StaffProductsPage /></RequireAuth>;
  if (path === "/dashboard/products/new") return <RequireAuth><ProductEditorPage /></RequireAuth>;
  if (path.startsWith("/dashboard/products/")) return <RequireAuth><ProductEditorPage id={path.split("/").pop()!} /></RequireAuth>;
  if (path === "/dashboard/tickets") return <RequireAuth><TicketsPage /></RequireAuth>;
  if (path.startsWith("/dashboard/tickets/")) return <RequireAuth><StaffTicketPage id={path.split("/").pop()!} /></RequireAuth>;
  if (path === "/dashboard/admin") return <RequireAuth admin><AdminStatsPage /></RequireAuth>;
  return <NotFoundPage />;
}
