import type { ReactNode } from "react";
import { MessageCircle, Package } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
export function DashboardLayout({ children }: { children: ReactNode }) { const auth = useAuth(); async function logout() { await auth.logout(); location.href = "/login"; } return <><header className="top"><a className="brand" href="/dashboard"><MessageCircle />Dashboard</a><nav><a href="/dashboard/tickets">Tickets</a><a href="/dashboard/products"><Package size={18} /> Produkte</a><a href="/dashboard/admin">Statistik</a><button className="linkButton" onClick={logout}>Logout</button></nav></header><main className="dash">{children}</main></>; }
