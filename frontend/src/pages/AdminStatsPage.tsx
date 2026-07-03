import { useEffect, useMemo, useState } from "react";
import { BarChart3, CalendarDays, RotateCcw } from "lucide-react";
import { getStats } from "../api/admin";
import { ErrorState } from "../components/common/ErrorState";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { statusLabels, type StatsResponse, type TicketStatus } from "../types/api";

const statusOrder: TicketStatus[] = ["open", "in_progress", "ready_for_pickup", "completed", "not_completed"];

function dateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return dateInputValue(date);
}

function percent(value: number, total: number) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}

function formatCurrency(value: string) {
  const amount = Number(value);
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "EUR" }).format(Number.isFinite(amount) ? amount : 0);
}

export function AdminStatsPage() {
  const params = new URLSearchParams(location.search);
  const [preset, setPreset] = useState(params.get("range") || "all");
  const [fromDate, setFromDate] = useState(params.get("from_date") || "");
  const [toDate, setToDate] = useState(params.get("to_date") || "");
  const [stats, setStats] = useState<StatsResponse>({ total: 0, open: 0, in_progress: 0, ready_for_pickup: 0, completed: 0, not_completed: 0, total_revenue: "0.00" });
  const [error, setError] = useState("");

  const query = useMemo(() => {
    const next = new URLSearchParams();
    if (preset !== "all") next.set("range", preset);
    if (fromDate) next.set("from_date", fromDate);
    if (toDate) next.set("to_date", toDate);
    history.replaceState(null, "", `/dashboard/admin${next.toString() ? `?${next.toString()}` : ""}`);
    const apiQuery = new URLSearchParams();
    if (fromDate) apiQuery.set("from_date", fromDate);
    if (toDate) apiQuery.set("to_date", toDate);
    return apiQuery;
  }, [preset, fromDate, toDate]);

  useEffect(() => {
    setError("");
    getStats(query).then(setStats).catch((e) => setError(e.message));
  }, [query]);

  function applyPreset(value: string) {
    setPreset(value);
    if (value === "all") {
      setFromDate("");
      setToDate("");
      return;
    }
    if (value === "today") {
      const today = dateInputValue(new Date());
      setFromDate(today);
      setToDate(today);
      return;
    }
    if (value === "7d") {
      setFromDate(daysAgo(6));
      setToDate(dateInputValue(new Date()));
      return;
    }
    if (value === "30d") {
      setFromDate(daysAgo(29));
      setToDate(dateInputValue(new Date()));
      return;
    }
    setPreset("custom");
  }

  const maxStatus = Math.max(...statusOrder.map((status) => stats[status]), 1);
  const closed = stats.completed + stats.not_completed;
  const active = stats.open + stats.in_progress + stats.ready_for_pickup;

  return <DashboardLayout>
    <section className="statsHead">
      <div>
        <h1>Statistik</h1>
        <p className="hint">{fromDate || toDate ? "Gefiltert nach Ticket-Erstellung." : "Allzeitwerte aus den persistenten Ticketstatistiken."}</p>
      </div>
      <div className="statsFilters" aria-label="Statistikfilter">
        <label>Zeitraum<select value={preset} onChange={(event) => applyPreset(event.target.value)}>
          <option value="all">Gesamt</option>
          <option value="today">Heute</option>
          <option value="7d">Letzte 7 Tage</option>
          <option value="30d">Letzte 30 Tage</option>
          <option value="custom">Benutzerdefiniert</option>
        </select></label>
        <label>Von<input type="date" value={fromDate} onChange={(event) => { setPreset("custom"); setFromDate(event.target.value); }} /></label>
        <label>Bis<input type="date" value={toDate} onChange={(event) => { setPreset("custom"); setToDate(event.target.value); }} /></label>
        <button type="button" className="neutralButton" onClick={() => applyPreset("all")}><RotateCcw size={16} /> Reset</button>
      </div>
    </section>
    {error ? <ErrorState title="Statistik konnte nicht geladen werden" text={error} /> : <>
      <div className="stats">
        <div className="stat revenueStat"><span>Umsatz</span><b>{formatCurrency(stats.total_revenue)}</b></div>
        {Object.entries({ total: "Gesamt", ...statusLabels }).map(([key, label]) => <div className="stat" key={key}><span>{label}</span><b>{stats[key as "total" | TicketStatus] || 0}</b></div>)}
      </div>
      <section className="chartGrid">
        <article className="chartPanel">
          <h2><BarChart3 size={20} /> Statusverteilung</h2>
          <div className="barChart">
            {statusOrder.map((status) => {
              const value = stats[status];
              return <div className="barRow" key={status}>
                <span>{statusLabels[status]}</span>
                <div className="barTrack"><i style={{ width: `${value ? Math.max(4, percent(value, maxStatus)) : 0}%` }} /></div>
                <b>{value}</b>
              </div>;
            })}
          </div>
        </article>
        <article className="chartPanel">
          <h2><CalendarDays size={20} /> Bearbeitungsstand</h2>
          <div className="stackChart" aria-label="Bearbeitungsstand">
            <i className="stackActive" style={{ width: `${percent(active, stats.total)}%` }} />
            <i className="stackClosed" style={{ width: `${percent(closed, stats.total)}%` }} />
          </div>
          <div className="legend">
            <span><i className="dot activeDot" /> Aktiv: {active}</span>
            <span><i className="dot closedDot" /> Abgeschlossen: {closed}</span>
          </div>
        </article>
      </section>
    </>}
  </DashboardLayout>;
}
