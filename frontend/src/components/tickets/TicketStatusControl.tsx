import { CheckCircle2, Circle, Clock3, PackageCheck, XCircle } from "lucide-react";
import { statusLabels, type TicketStatus } from "../../types/api";

type Props = {
  value: TicketStatus;
  onChange: (status: TicketStatus) => void | Promise<void>;
  disabled?: boolean;
  compact?: boolean;
};

const statusIcons: Record<TicketStatus, typeof Circle> = {
  open: Circle,
  in_progress: Clock3,
  ready_for_pickup: PackageCheck,
  completed: CheckCircle2,
  not_completed: XCircle,
};

const quickStatuses: TicketStatus[] = ["open", "in_progress", "ready_for_pickup", "completed"];

export function TicketStatusControl({ value, onChange, disabled = false, compact = false }: Props) {
  return <div className={compact ? "statusControl compact" : "statusControl"}>
    <div className="statusQuick" aria-label="Status schnell aendern">
      {quickStatuses.map((status) => {
        const Icon = statusIcons[status];
        return <button
          key={status}
          type="button"
          className={status === value ? "statusAction active" : "statusAction"}
          title={statusLabels[status]}
          aria-label={statusLabels[status]}
          disabled={disabled || status === value}
          onClick={() => onChange(status)}
        >
          <Icon size={18} />
          {!compact && <span>{statusLabels[status]}</span>}
        </button>;
      })}
    </div>
    <label className="statusSelectLabel">
      <span>Status</span>
      <select value={value} disabled={disabled} onChange={(event) => onChange(event.target.value as TicketStatus)}>
        {Object.entries(statusLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
      </select>
    </label>
  </div>;
}