"use client";

import { useEffect, useMemo, useState } from "react";
import { CircleHelp, FilePlus2, Sparkles, Wallet } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { Book, Ticket } from "@/lib/types";
import { AuthGuard } from "@/components/auth-guard";
import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BookTable } from "@/components/book-table";
import { CreateTicketForm } from "@/components/create-ticket-form";
import { TicketList } from "@/components/ticket-list";
import { EmptyState } from "@/components/empty-state";

function upsertTicket(list: Ticket[], updated: Ticket) {
  const exists = list.some((item) => item._id === updated._id);
  if (!exists) {
    return [updated, ...list];
  }

  return list.map((item) => (item._id === updated._id ? updated : item));
}

export default function AuthorPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    try {
      setLoading(true);
      const [booksResponse, ticketsResponse] = await Promise.all([
        api.get("/books"),
        api.get("/tickets"),
      ]);
      setBooks(booksResponse.data.data);
      setTickets(ticketsResponse.data.data);
    } catch {
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) {
      return;
    }

    const onTicketUpdated = (ticket: Ticket) => {
      setTickets((current) => upsertTicket(current, ticket));
    };

    socket.on("ticket:updated", onTicketUpdated);
    return () => {
      socket.off("ticket:updated", onTicketUpdated);
    };
  }, []);

  const stats = useMemo(() => {
    const openTickets = tickets.filter((item) => item.status === "Open" || item.status === "In Progress").length;
    const resolvedTickets = tickets.filter((item) => item.status === "Resolved" || item.status === "Closed").length;
    const pendingRoyalty = books.reduce((sum, item) => sum + (item.royalty_pending || 0), 0);

    return {
      totalBooks: books.length,
      openTickets,
      resolvedTickets,
      pendingRoyalty,
    };
  }, [books, tickets]);

  return (
    <AuthGuard roles={["AUTHOR"]}>
      <AppShell>
        <div className="space-y-6 animate-float-up">
          <section className="surface-card publication-shell overflow-hidden p-5 dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-4 h-0.5 w-full glow-divider" />
            <p className="ink-kicker dark:text-slate-300">Author Dashboard</p>
            <h2 className="chapter-title mt-1 text-slate-900 dark:text-slate-100">Everything about your books and support tickets</h2>
            <p className="mt-2 text-sm text-slate-700 dark:text-slate-400">
              Track royalties, raise issues, and follow responses from the publishing team in one place.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-[#d7c6a7] bg-[#fff8ea] p-3 dark:border-amber-600 dark:bg-amber-950">
                <p className="ink-kicker text-amber-900 dark:text-amber-200">Tip</p>
                <p className="mt-1 text-sm text-amber-800 dark:text-amber-50">Use a clear subject and include dates/amounts when creating tickets.</p>
              </div>
              <div className="rounded-xl border border-[#cddccf] bg-[#eef8f0] p-3 dark:border-emerald-600 dark:bg-emerald-950">
                <p className="ink-kicker text-emerald-900 dark:text-emerald-200">Speed</p>
                <p className="mt-1 text-sm text-emerald-800 dark:text-emerald-50">Book-specific tickets are resolved faster than generic requests.</p>
              </div>
              <div className="rounded-xl border border-[#d7d2e4] bg-[#f2f0fa] p-3 dark:border-purple-600 dark:bg-purple-950">
                <p className="ink-kicker text-purple-900 dark:text-purple-200">Tracking</p>
                <p className="mt-1 text-sm text-purple-800 dark:text-purple-50">Follow each reply in real time from the conversation panel.</p>
              </div>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-3">
            <Card className="surface-card dark:border-slate-700 dark:bg-slate-900">
              <CardHeader>
                <p className="ink-kicker dark:text-slate-300">Portfolio</p>
                <CardTitle className="text-base dark:text-slate-100">Total Books</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold dark:text-slate-100">{stats.totalBooks}</p>
                <p className="text-xs text-[#6f6250] dark:text-slate-400">Books linked to your author account</p>
              </CardContent>
            </Card>
            <Card className="surface-card dark:border-slate-700 dark:bg-slate-900">
              <CardHeader>
                <p className="ink-kicker dark:text-slate-300">Support</p>
                <CardTitle className="text-base dark:text-slate-100">Open Tickets</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold dark:text-slate-100">{stats.openTickets}</p>
                <p className="text-xs text-[#6f6250] dark:text-slate-400">Tickets that still need action</p>
              </CardContent>
            </Card>
            <Card className="surface-card dark:border-slate-700 dark:bg-slate-900">
              <CardHeader>
                <p className="ink-kicker dark:text-slate-300">Finance</p>
                <CardTitle className="text-base dark:text-slate-100">Pending Royalty</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold dark:text-slate-100">INR {stats.pendingRoyalty.toLocaleString()}</p>
                <p className="text-xs text-[#6f6250] dark:text-slate-400">Awaiting next payout cycle</p>
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <div className="surface-card p-4 dark:border-slate-700 dark:bg-slate-900">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                <FilePlus2 className="size-4 text-blue-600" />
                Raise New Issue
              </p>
              <p className="mt-2 text-xs text-[#6f6250] dark:text-slate-400">Create ticket with detailed context for faster first response.</p>
            </div>
            <div className="surface-card p-4 dark:border-slate-700 dark:bg-slate-900">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                <Wallet className="size-4 text-emerald-600" />
                Watch Royalties
              </p>
              <p className="mt-2 text-xs text-[#6f6250] dark:text-slate-400">Keep an eye on pending payouts and payout dates in one table.</p>
            </div>
            <div className="surface-card p-4 dark:border-slate-700 dark:bg-slate-900">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                <Sparkles className="size-4 text-amber-600" />
                Resolution Progress
              </p>
              <p className="mt-2 text-xs text-[#6f6250] dark:text-slate-400">Resolved and closed tickets: {stats.resolvedTickets}</p>
            </div>
          </section>

          <section className="space-y-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">My Books</h2>
              <p className="text-sm text-[#6f6250] dark:text-slate-400">View publication status, sales, and royalty details per book.</p>
            </div>
            {loading ? (
              <Skeleton className="h-56 w-full" />
            ) : books.length === 0 ? (
              <EmptyState
                title="No books found"
                description="Books linked to your author account will appear here."
              />
            ) : (
              <BookTable books={books} />
            )}
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <CreateTicketForm books={books} onCreated={(ticket) => setTickets((current) => [ticket, ...current])} />
            <Card className="surface-card dark:border-slate-700 dark:bg-slate-900">
              <CardHeader>
                <CardTitle className="dark:text-slate-100">My Tickets</CardTitle>
                <p className="text-sm text-[#6f6250] dark:text-slate-400">Open a ticket to view updates and continue the conversation.</p>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-56 w-full" />
                ) : tickets.length === 0 ? (
                  <EmptyState
                    title="No tickets yet"
                    description="Create your first support ticket for a book or a general query."
                  />
                ) : (
                  <TicketList tickets={tickets} />
                )}
              </CardContent>
            </Card>
          </section>

          <section className="surface-card p-4 dark:border-slate-700 dark:bg-slate-900">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
              <CircleHelp className="size-4 text-violet-600" />
              Need faster support?
            </p>
            <p className="mt-1 text-sm text-[#6f6250] dark:text-slate-400">
              Mention book title, payout cycle, and exact discrepancy in the first message for quicker triage.
            </p>
          </section>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
