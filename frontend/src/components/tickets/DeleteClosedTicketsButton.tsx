import { Trash2 } from "lucide-react";

export function DeleteClosedTicketsButton({ onDelete, disabled = false }: { onDelete: () => void | Promise<void>; disabled?: boolean }) {
  return <button type="button" className="dangerButton" disabled={disabled} onClick={onDelete}>
    <Trash2 size={18} />
    Abgeschlossene loeschen
  </button>;
}