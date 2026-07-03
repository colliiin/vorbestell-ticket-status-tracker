function readCookie(name: string): string | null {
  return document.cookie.split("; ").find((row) => row.startsWith(`${name}=`))?.split("=")[1] ?? null;
}

function errorText(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "Anfrage fehlgeschlagen";
  const detail = (payload as { detail?: unknown }).detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((d: any) => d?.msg || JSON.stringify(d)).join("; ");
  return "Anfrage fehlgeschlagen";
}

export async function request<T>(url: string, init?: RequestInit & { csrf?: boolean }): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json", ...((init?.headers as Record<string, string>) || {}) };
  if (init?.csrf) {
    const csrf = readCookie("staff_csrf");
    if (csrf) headers["X-CSRF-Token"] = decodeURIComponent(csrf);
  }
  const res = await fetch(url, { ...init, credentials: "include", headers });
  if (!res.ok) throw new Error(errorText(await res.json().catch(() => ({}))));
  return res.json();
}