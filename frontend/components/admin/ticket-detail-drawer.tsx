"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, SendHorizonal, X } from "lucide-react";
import { toast } from "sonner";

import { Ticket } from "@/lib/types";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AiSuggestionChat } from "./ai-suggestion-chat";

interface TicketDetailDrawerProps {
  open: boolean;
  ticket: Ticket | null;
  onClose: () => void;
  onTicketUpdated: (ticket: Ticket) => void;
}

function getBadgeClass(value: string) {
  switch (value) {
    case "Open":
      return "bg-amber-100 text-amber-800";
    case "In Progress":
      return "bg-blue-100 text-blue-800";
    case "Resolved":
    case "Closed":
      return "bg-emerald-100 text-emerald-800";
    case "Critical":
    case "High":
      return "bg-rose-100 text-rose-700";
    case "Medium":
      return "bg-orange-100 text-orange-700";
    case "Low":
      return "bg-emerald-100 text-emerald-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export function TicketDetailDrawer({
  open,
  ticket,
  onClose,
  onTicketUpdated,
}: TicketDetailDrawerProps) {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [refinedSuggestion, setRefinedSuggestion] = useState<string | null>(null);

  const orderedMessages = useMemo(
    () => [...(ticket?.messages || [])].sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt)),
    [ticket?.messages],
  );

  async function sendReply() {
    if (!ticket || !message.trim()) {
      return;
    }

    try {
      setSending(true);
      setIsTyping(true);
      const response = await api.post(`/tickets/${ticket._id}/message`, { content: message.trim() });
      onTicketUpdated(response.data.data);
      setMessage("");
      toast.success("Message sent");
    } catch {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
      setTimeout(() => setIsTyping(false), 450);
    }
  }

  function useAiDraft() {
    if (!ticket?.aiDraftResponse) {
      return;
    }
    setMessage(refinedSuggestion || ticket.aiDraftResponse);
    toast.success("AI draft copied to composer");
  }

  return (
    <AnimatePresence>
      {open && ticket && (
        <>
          <motion.button
            type="button"
            aria-label="Close drawer"
            className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-[1px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.aside
            initial={{ x: 520 }}
            animate={{ x: 0 }}
            exit={{ x: 520 }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="fixed right-0 top-0 z-50 h-full w-full max-w-2xl overflow-hidden border-l border-[#deceb3] bg-[#fffefb] shadow-2xl"
          >
            <div className="flex h-full flex-col">
              <div className="flex items-start justify-between border-b border-[#e7d9c3] px-5 py-4">
                <div>
                  <p className="ink-kicker">Ticket Detail</p>
                  <h3 className="font-display text-2xl text-slate-900">{ticket.subject}</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getBadgeClass(ticket.status)}`}>{ticket.status}</span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getBadgeClass(ticket.priority)}`}>{ticket.priority}</span>
                    <span className="rounded-full bg-[#f8ecd9] px-2.5 py-1 text-xs font-semibold text-[#7f6130]">{ticket.category}</span>
                  </div>
                </div>
                <Button variant="ghost" size="icon-sm" onClick={onClose}>
                  <X className="size-4" />
                </Button>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                <div className="rounded-xl border border-[#e4d4bb] bg-[#fff8ea] p-3">
                  <p className="ink-kicker">Issue</p>
                  <p className="mt-1 text-sm text-[#5f5648]">{ticket.description}</p>
                </div>

                <div className="rounded-xl border border-[#e4d4bb] bg-white p-3">
                  <div className="flex items-center justify-between">
                    <p className="ink-kicker">Conversation</p>
                    {isTyping && (
                      <div className="inline-flex items-center gap-1 text-xs text-slate-500">
                        <span className="size-1.5 animate-pulse rounded-full bg-slate-400" />
                        <span className="size-1.5 animate-pulse rounded-full bg-slate-400 [animation-delay:120ms]" />
                        <span className="size-1.5 animate-pulse rounded-full bg-slate-400 [animation-delay:240ms]" />
                      </div>
                    )}
                  </div>

                  <div className="mt-3 space-y-3">
                    {orderedMessages.length === 0 ? (
                      <p className="text-sm text-slate-500">No conversation yet.</p>
                    ) : (
                      orderedMessages.map((item, index) => {
                        const mine = item.sender === "ADMIN";
                        return (
                          <div key={`${item.createdAt}-${index}`} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${mine ? "bg-[#293446] text-[#fff8eb]" : "bg-slate-100 text-slate-900"}`}>
                              <p className="text-[11px] opacity-75">{item.sender}</p>
                              <p className="mt-1 whitespace-pre-wrap">{item.content}</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-[#e4d4bb] bg-[#fff9ef] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                      <Bot className="size-4 text-[#8d7447]" />
                      AI suggestion
                    </p>
                    <Button size="sm" variant="outline" onClick={useAiDraft} disabled={!ticket.aiDraftResponse}>
                      Use suggestion
                    </Button>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-[#5f5648]">
                    {refinedSuggestion || ticket.aiDraftResponse || "No AI suggestion available for this ticket."}
                  </p>
                </div>

                {ticket.aiDraftResponse && (
                  <AiSuggestionChat
                    ticketId={ticket._id}
                    originalSuggestion={ticket.aiDraftResponse}
                    onSuggestionRefined={setRefinedSuggestion}
                  />
                )}
              </div>

              <div className="border-t border-[#e7d9c3] bg-[#fffdf9] px-5 py-4">
                <Textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  rows={4}
                  className="bg-[#fffaf2]"
                  placeholder="Write a response to the author..."
                />
                <div className="mt-3 flex justify-end">
                  <Button onClick={sendReply} disabled={sending || !message.trim()} className="bg-[#2a3648] text-[#fff7ea] hover:bg-[#1f2a3a]">
                    {sending ? "Sending..." : "Send"}
                    <SendHorizonal className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
