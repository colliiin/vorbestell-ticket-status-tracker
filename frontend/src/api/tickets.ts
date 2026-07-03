import { request } from "./client";
import type { ChatMessage, PublicTicket, StaffTicket, TicketListResponse, TicketStatus } from "../types/api";
export const getPublicTicket = (token: string) => request<PublicTicket>(`/api/public/tickets/${token}`);
export const getPublicMessages = (token: string) => request<ChatMessage[]>(`/api/public/tickets/${token}/messages`);
export const getTickets = (query: URLSearchParams) => request<TicketListResponse>(`/api/staff/tickets?${query.toString()}`);
export const getTicket = (id: string) => request<StaffTicket>(`/api/staff/tickets/${id}`);
export const getStaffMessages = (id: string) => request<ChatMessage[]>(`/api/staff/tickets/${id}/messages`);
export const updateTicketStatus = (id: string, status: TicketStatus) => request<StaffTicket>(`/api/staff/tickets/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }), csrf: true });
export const deleteClosedTickets = () => request<{ deleted: number }>("/api/staff/tickets/closed", { method: "DELETE", csrf: true });
