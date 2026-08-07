import type { TicketStatus } from "../../types/api";

export type TicketStatusPresentation = {
  label: string;
  stepTitle: string;
  description: string;
  stepIndex: number;
};

export type TicketStatusStep = {
  status: TicketStatus;
  title: string;
};

export const ticketStatusPresentations: Record<TicketStatus, TicketStatusPresentation> = {
  open: {
    label: "Eingegangen",
    stepTitle: "Vorbestellung eingegangen",
    description: "Deine Vorbestellung ist bei uns angekommen.",
    stepIndex: 0,
  },
  in_progress: {
    label: "In Bearbeitung",
    stepTitle: "Wird bearbeitet",
    description: "Deine Vorbestellung wird gerade vorbereitet.",
    stepIndex: 1,
  },
  ready_for_pickup: {
    label: "Bereit zur Abholung",
    stepTitle: "Bereit zur Abholung",
    description: "Deine Bestellung ist fertig und kann abgeholt werden.",
    stepIndex: 2,
  },
  completed: {
    label: "Abgeschlossen",
    stepTitle: "Abgeschlossen",
    description: "Deine Vorbestellung wurde erfolgreich abgeschlossen.",
    stepIndex: 3,
  },
  not_completed: {
    label: "Nicht abgeschlossen",
    stepTitle: "Nicht abgeschlossen",
    description: "Deine Vorbestellung konnte nicht abgeschlossen werden. Bitte kontaktiere uns bei Fragen.",
    stepIndex: 3,
  },
};

const standardSteps: TicketStatusStep[] = [
  { status: "open", title: ticketStatusPresentations.open.stepTitle },
  { status: "in_progress", title: ticketStatusPresentations.in_progress.stepTitle },
  { status: "ready_for_pickup", title: ticketStatusPresentations.ready_for_pickup.stepTitle },
  { status: "completed", title: ticketStatusPresentations.completed.stepTitle },
];

export const unknownStatusPresentation = {
  label: "Status wird geprüft",
  description: "Der aktuelle Bearbeitungsstand konnte nicht eindeutig zugeordnet werden.",
};

export function getTicketStatusPresentation(status: string) {
  return ticketStatusPresentations[status as TicketStatus] ?? unknownStatusPresentation;
}

export function getTicketStatusSteps(status: string): TicketStatusStep[] {
  if (status !== "not_completed") return standardSteps;
  return [
    ...standardSteps.slice(0, -1),
    { status: "not_completed", title: ticketStatusPresentations.not_completed.stepTitle },
  ];
}

export function getTicketStatusStepIndex(status: string): number | null {
  return ticketStatusPresentations[status as TicketStatus]?.stepIndex ?? null;
}
