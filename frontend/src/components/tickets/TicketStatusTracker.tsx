import { Check, Circle, Clock3, PackageCheck, TriangleAlert } from "lucide-react";
import { formatTime } from "../../types/api";
import {
  getTicketStatusPresentation,
  getTicketStatusStepIndex,
  getTicketStatusSteps,
} from "./ticketStatusPresentation";

type StepState = "completed" | "current" | "upcoming";

type Props = {
  ticketNumber: string;
  status: string;
  createdAt: string;
  statusChangedAt: string;
};

function stepState(index: number, currentIndex: number | null): StepState {
  if (currentIndex === null) return "upcoming";
  if (index < currentIndex) return "completed";
  if (index === currentIndex) return "current";
  return "upcoming";
}

const stateLabels: Record<StepState, string> = {
  completed: "Abgeschlossen",
  current: "Aktueller Schritt",
  upcoming: "Noch nicht erreicht",
};

export function TicketStatusTracker({ ticketNumber, status, createdAt, statusChangedAt }: Props) {
  const presentation = getTicketStatusPresentation(status);
  const currentIndex = getTicketStatusStepIndex(status);
  const steps = getTicketStatusSteps(status);
  const unknown = currentIndex === null;

  return <article className="ticketStatusTracker" data-testid="ticket-status-tracker" aria-labelledby="ticket-status-heading">
    <div className="ticketStatusHead">
      <div>
        <p className="ticketEyebrow">Ticket {ticketNumber}</p>
        <h1 id="ticket-status-heading">Dein Bestellstatus</h1>
      </div>
      <div className={unknown ? "currentStatus unknown" : "currentStatus"} aria-live="polite" data-testid="current-ticket-status">
        {unknown ? <TriangleAlert size={18} aria-hidden="true" /> : <Clock3 size={18} aria-hidden="true" />}
        <span>{presentation.label}</span>
      </div>
    </div>

    <p className="ticketStatusDescription">{presentation.description}</p>

    <dl className="ticketStatusMeta">
      <div><dt>Bestellt</dt><dd>{formatTime(createdAt)}</dd></div>
      <div><dt>Letzte Änderung</dt><dd data-testid="status-changed-at">{formatTime(statusChangedAt)}</dd></div>
    </dl>

    <ol className="ticketStatusSteps" aria-label="Fortschritt deiner Vorbestellung">
      {steps.map((step, index) => {
        const state = stepState(index, currentIndex);
        const Icon = state === "completed" ? Check : state === "current" ? PackageCheck : Circle;
        return <li key={step.status} className={`ticketStatusStep ${state}`} data-state={state} aria-current={state === "current" ? "step" : undefined}>
          <span className="ticketStatusStepIcon" aria-hidden="true"><Icon size={18} /></span>
          <span className="ticketStatusStepCopy">
            <span className="ticketStatusStepState">{stateLabels[state]}</span>
            <strong>{step.title}</strong>
          </span>
        </li>;
      })}
    </ol>
  </article>;
}
