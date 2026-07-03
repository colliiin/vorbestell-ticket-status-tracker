import { LayoutDashboard, MessageCircle, Package } from "lucide-react";
import { useEffect, useState } from "react";
import { deleteClosedTickets, getTickets, updateTicketStatus } from "../api/tickets";
import { ErrorState } from "../components/common/ErrorState";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { DeleteClosedTicketsButton } from "../components/tickets/DeleteClosedTicketsButton";
import { TicketList } from "../components/tickets/TicketList";
import { closedStatuses, type TicketListItem, type TicketStatus } from "../types/api";

export function DashboardPage() {
  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);
  const [deletingClosed, setDeletingClosed] = useState(false);
  const closedCount = tickets.filter((ticket) => closedStatuses.includes(ticket.status)).length;

  useEffect(() => {
    const params = new URLSearchParams({ page: "1", page_size: "5" });
    getTickets(params).then((data) => setTickets(data.items)).catch((e) => setError(e.message));
  }, []);

  async function changeStatus(ticket: TicketListItem, status: TicketStatus) {
    if (ticket.status === status) return;
    setError("");
    setSavingId(ticket.id);
    try {
      const updated = await updateTicketStatus(String(ticket.id), status);
      setTickets((current) => current.map((item) => item.id === ticket.id ? { ...item, status: updated.status, updated_at: updated.updated_at, last_staff_message_at: updated.last_staff_message_at } : item));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Status konnte nicht geaendert werden.");
    } finally {
      setSavingId(null);
    }
  }

  async function deleteClosed() {
    if (!window.confirm("Alle erfolgreich oder nicht abgeschlossenen Tickets wirklich loeschen? Diese Aktion kann nicht rueckgaengig gemacht werden.")) return;
    setError("");
    setDeletingClosed(true);
    try {
      await deleteClosedTickets();
      setTickets((current) => current.filter((ticket) => !closedStatuses.includes(ticket.status)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Abgeschlossene Tickets konnten nicht geloescht werden.");
    } finally {
      setDeletingClosed(false);
    }
  }

  return <DashboardLayout>
    <section className="heroPanel"><h1>Dashboard</h1><p>Verwalte Bestellungen, chatte mit Kunden und pruefe den aktuellen Status.</p></section>
    <div className="tiles"><a href="/dashboard/tickets"><MessageCircle /> Tickets verwalten</a><a href="/dashboard/products"><Package /> Produkte verwalten</a><a href="/dashboard/admin"><LayoutDashboard /> Statistik ansehen</a></div>
    <section className="dashboardSection">
      <div className="sectionHead"><h2>Aktuelle Tickets</h2><div className="sectionActions"><DeleteClosedTicketsButton disabled={deletingClosed || closedCount === 0} onDelete={deleteClosed} /><a className="linkButton" href="/dashboard/tickets">Alle Tickets</a></div></div>
      {error ? <ErrorState title="Tickets konnten nicht geladen werden" text={error} /> : tickets.length ? <TicketList tickets={tickets} savingId={savingId} onStatusChange={changeStatus} /> : <p className="hint">Keine aktuellen Tickets.</p>}
    </section>
  </DashboardLayout>;
}
