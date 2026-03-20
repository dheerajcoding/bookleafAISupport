"use client";

import { useState } from "react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { Ticket } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUSES = ["Open", "In Progress", "Resolved", "Closed"];
const CATEGORIES = [
  "Royalty & Payments",
  "ISBN & Metadata Issues",
  "Printing & Quality",
  "Distribution & Availability",
  "Book Status & Production Updates",
  "General Inquiry",
];
const PRIORITIES = ["Critical", "High", "Medium", "Low"];

interface AdminUser {
  _id: string;
  name: string;
}

export function AdminTicketControls({
  ticket,
  admins,
  onUpdated,
  onUseDraft,
}: {
  ticket: Ticket;
  admins: AdminUser[];
  onUpdated: (ticket: Ticket) => void;
  onUseDraft?: (draft: string) => void;
}) {
  const [status, setStatus] = useState(ticket.status);
  const [category, setCategory] = useState(ticket.category);
  const [priority, setPriority] = useState(ticket.priority);
  const [assignedTo, setAssignedTo] = useState(ticket.assignedTo?._id || "unassigned");
  const [loading, setLoading] = useState(false);

  async function updateStatus() {
    try {
      setLoading(true);
      const response = await api.patch(`/tickets/${ticket._id}/status`, { status });
      onUpdated(response.data.data);
      toast.success("Status updated");
    } catch {
      toast.error("Failed to update status");
    } finally {
      setLoading(false);
    }
  }

  async function updateMeta() {
    try {
      setLoading(true);
      const response = await api.patch(`/tickets/${ticket._id}/meta`, {
        category,
        priority,
      });
      onUpdated(response.data.data);
      toast.success("Category and priority updated");
    } catch {
      toast.error("Failed to update category or priority");
    } finally {
      setLoading(false);
    }
  }

  async function assign() {
    if (assignedTo === "unassigned") {
      return;
    }

    try {
      setLoading(true);
      const response = await api.patch(`/tickets/${ticket._id}/assign`, {
        adminId: assignedTo,
      });
      onUpdated(response.data.data);
      toast.success("Ticket assigned");
    } catch {
      toast.error("Failed to assign ticket");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="rounded-2xl border-slate-200 bg-white/95">
        <CardHeader>
          <CardTitle>Ticket Settings</CardTitle>
          <p className="text-sm text-slate-600">Update progress, triage priority, and assign ownership.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Status</p>
            <Select value={status} onValueChange={(value) => setStatus(value as Ticket["status"])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button disabled={loading} onClick={updateStatus}>
              Update Status
            </Button>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Category</p>
            <Select value={category} onValueChange={(value) => setCategory(value ?? ticket.category)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <p className="text-sm font-medium">Priority</p>
            <Select value={priority} onValueChange={(value) => setPriority(value ?? ticket.priority)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button disabled={loading} variant="outline" onClick={updateMeta}>
              Save Category And Priority
            </Button>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Assign To</p>
            <Select value={assignedTo} onValueChange={(value) => setAssignedTo(value ?? "unassigned")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {admins.map((admin) => (
                  <SelectItem key={admin._id} value={admin._id}>
                    {admin.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button disabled={loading} variant="outline" onClick={assign}>
              Assign Ticket
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl border-slate-200 bg-white/95">
        <CardHeader>
          <CardTitle>AI Draft Response</CardTitle>
          <p className="text-sm text-slate-600">Use this as a starting point before sending your final reply.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {ticket.aiDraftResponse ? (
            <>
              <p className="whitespace-pre-wrap text-sm text-slate-700">{ticket.aiDraftResponse}</p>
              {onUseDraft && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUseDraft(ticket.aiDraftResponse!)}
                >
                  Use this draft as reply
                </Button>
              )}
            </>
          ) : (
            <p className="text-sm text-slate-600">
              AI draft is unavailable for this ticket. Please respond manually.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
