"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { Ticket } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";
import { AuthGuard } from "@/components/auth-guard";
import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { TicketChat } from "@/components/ticket-chat";
import { AdminTicketControls } from "@/components/admin-ticket-controls";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface AdminUser {
  _id: string;
  name: string;
}

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [draftToInject, setDraftToInject] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const ticketResponse = await api.get(`/tickets/${params.id}`);
        setTicket(ticketResponse.data.data);

        if (user?.role === "ADMIN") {
          const adminsResponse = await api.get("/admin/users");
          setAdmins(adminsResponse.data.data);
        }
      } catch {
        toast.error("Failed to load ticket details");
      } finally {
        setLoading(false);
      }
    }

    if (params.id) {
      load();
    }
  }, [params.id, user?.role]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !params.id) {
      return;
    }

    socket.emit("joinTicket", params.id);

    const onUpdated = (updated: Ticket) => {
      if (updated._id === params.id) {
        setTicket(updated);
      }
    };

    socket.on("ticket:updated", onUpdated);
    socket.on("ticket:message", onUpdated);

    return () => {
      socket.off("ticket:updated", onUpdated);
      socket.off("ticket:message", onUpdated);
    };
  }, [params.id]);

  if (loading || !ticket || !user) {
    return (
      <AuthGuard roles={["AUTHOR", "ADMIN"]}>
        <AppShell>
          <Skeleton className="h-96 w-full" />
        </AppShell>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard roles={["AUTHOR", "ADMIN"]}>
      <AppShell>
        <div className="space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-sm">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Ticket Workspace</p>
            <h2 className="mt-1 text-xl font-semibold text-slate-900">Review details, update metadata, and respond faster</h2>
          </section>

          <Card className="rounded-2xl border-slate-200 bg-white/95">
            <CardHeader>
              <CardTitle>{ticket.subject}</CardTitle>
              <p className="text-sm text-slate-600">Ticket ID: {ticket._id}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Issue summary</p>
                <p className="mt-1 text-sm text-slate-700">{ticket.description}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <StatusBadge value={ticket.status} />
                <StatusBadge value={ticket.priority} />
                <span className="rounded-full border px-3 py-1 text-xs text-slate-700">{ticket.category}</span>
                <span className="rounded-full border px-3 py-1 text-xs text-slate-700">
                  {ticket.bookId?.title || "General"}
                </span>
              </div>
            </CardContent>
          </Card>

          {user.role === "ADMIN" && (
            <AdminTicketControls
              ticket={ticket}
              admins={admins}
              onUpdated={setTicket}
              onUseDraft={(draft) => setDraftToInject(draft)}
            />
          )}

          <TicketChat
            ticket={ticket}
            currentRole={user.role}
            onUpdated={setTicket}
            draftMessage={draftToInject}
            onDraftApplied={() => setDraftToInject(null)}
          />
        </div>
      </AppShell>
    </AuthGuard>
  );
}
