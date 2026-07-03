import { useEffect, useMemo, useState } from "react";
import { deleteClosedTickets, getTickets, updateTicketStatus } from "../api/tickets";
import { EmptyState } from "../components/common/EmptyState";
import { ErrorState } from "../components/common/ErrorState";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { DeleteClosedTicketsButton } from "../components/tickets/DeleteClosedTicketsButton";
import { TicketList } from "../components/tickets/TicketList";
import type { TicketListItem, TicketStatus } from "../types/api";
import { closedStatuses, statusLabels } from "../types/api";

export function TicketsPage() {
  const params = new URLSearchParams(location.search);
  const [query, setQuery] = useState(params.get("search") || "");
  const [status, setStatus] = useState(params.get("status") || "");
  const [page, setPage] = useState(Number(params.get("page") || 1));
  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);
  const [deletingClosed, setDeletingClosed] = useState(false);
  const closedCount = tickets.filter((ticket) => closedStatuses.includes(ticket.status)).length;
  const pageSize = 25;

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", String(page));
    p.set("page_size", String(pageSize));
    if (query) p.set("search", query);
    if (status) p.set("status", status);
    history.replaceState(null, "", `/dashboard/tickets?${p.toString()}`);
    return p;
  }, [query, status, page]);

  useEffect(() => {
    getTickets(qs).then((data) => { setTickets(data.items); setTotal(data.total); }).catch((e) => setError(e.message));
  }, [qs]);

  async function changeStatus(ticket: TicketListItem, nextStatus: TicketStatus) {
    if (ticket.status === nextStatus) return;
    setError("");
    setSavingId(ticket.id);
    try {
      const updated = await updateTicketStatus(String(ticket.id), nextStatus);
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
      const result = await deleteClosedTickets();
      setTickets((current) => current.filter((ticket) => !closedStatuses.includes(ticket.status)));
      setTotal((current) => Math.max(0, current - result.deleted));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Abgeschlossene Tickets konnten nicht geloescht werden.");
    } finally {
      setDeletingClosed(false);
    }
  }

  return <DashboardLayout>
    <div className="toolbar ticketToolbar">
      <input placeholder="Nach Kundenname suchen" value={query} onChange={(e) => { setPage(1); setQuery(e.target.value); }} />
      <select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
        <option value="">Alle Status</option>
        {Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
      </select>
      <DeleteClosedTicketsButton disabled={deletingClosed || closedCount === 0} onDelete={deleteClosed} />
    </div>
    {error && <p className="error">{error}</p>}
    {tickets.length ? <>
      <TicketList tickets={tickets} savingId={savingId} onStatusChange={changeStatus} />
      <p className="hint">Seite {page}, {total} Tickets gesamt</p>
      <div className="pager"><button disabled={page <= 1} onClick={() => setPage(page - 1)}>Zurueck</button><button disabled={page * pageSize >= total} onClick={() => setPage(page + 1)}>Weiter</button></div>
    </> : error ? <ErrorState title="Tickets konnten nicht geladen werden" text={error} /> : <EmptyState title="Keine Tickets" text="Sobald eine Bestellung eingeht, erscheint sie hier." />}
  </DashboardLayout>;
}
