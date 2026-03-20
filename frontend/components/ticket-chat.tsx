"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { Ticket } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export function TicketChat({
  ticket,
  currentRole,
  onUpdated,
  draftMessage,
  onDraftApplied,
}: {
  ticket: Ticket;
  currentRole: "AUTHOR" | "ADMIN";
  onUpdated: (ticket: Ticket) => void;
  draftMessage?: string | null;
  onDraftApplied?: () => void;
}) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (draftMessage) {
      setMessage(draftMessage);
      onDraftApplied?.();
    }
  }, [draftMessage, onDraftApplied]);

  async function sendMessage() {
    if (!message.trim()) {
      return;
    }

    try {
      setSending(true);
      const response = await api.post(`/tickets/${ticket._id}/message`, {
        content: message,
      });
      onUpdated(response.data.data);
      setMessage("");
    } catch (error: unknown) {
      const serverMessage =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : "Failed to send message";
      toast.error(serverMessage || "Failed to send message");
    } finally {
      setSending(false);
    }
  }

  return (
    <Card className="rounded-2xl border-slate-200 bg-white/95">
      <CardHeader>
        <CardTitle>Conversation</CardTitle>
        <p className="text-sm text-slate-600">Keep updates concise and include dates or actions when possible.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-h-96 space-y-3 overflow-y-auto rounded-md border bg-slate-50 p-3">
          {ticket.messages.length === 0 && (
            <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-center text-sm text-slate-600">
              No messages yet. Start the conversation to move this ticket forward.
            </div>
          )}
          {ticket.messages.map((item, index) => {
            const mine = item.sender === currentRole;
            return (
              <div key={`${item.createdAt}-${index}`} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    mine ? "bg-slate-900 text-white" : "bg-white text-slate-900"
                  }`}
                >
                  <p className="text-xs opacity-80">{item.sender}</p>
                  <p className="mt-1 whitespace-pre-wrap">{item.content}</p>
                  <p className="mt-1 text-[11px] opacity-70">
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Reply</p>
          <Textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={4}
            placeholder="Write a clear update, next step, or question..."
          />
          <Button onClick={sendMessage} disabled={sending}>
            {sending ? "Sending..." : "Send Message"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
