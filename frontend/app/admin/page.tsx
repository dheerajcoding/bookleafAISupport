"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  BellRing,
  CircleDot,
  ListFilter,
  Search,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { Ticket } from "@/lib/types";
import { useDebounce } from "@/hooks/use-debounce";
import { AuthGuard } from "@/components/auth-guard";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminStatCard } from "@/components/admin/stat-card";
import { MultiSelectFilter } from "@/components/admin/multi-select-filter";
import { TicketDetailDrawer } from "@/components/admin/ticket-detail-drawer";

const categories = [
  "Royalty & Payments",
  "ISBN & Metadata Issues",
  "Printing & Quality",
  "Distribution & Availability",
  "Book Status & Production Updates",
  "General Inquiry",
];
const priorities = ["Critical", "High", "Medium", "Low"];
const statuses = ["Open", "In Progress", "Resolved", "Closed"];

const PAGE_SIZE = 8;

type SortableKey = "subject" | "status" | "priority" | "updatedAt";
type SortDirection = "asc" | "desc";

function upsertTicket(list: Ticket[], updated: Ticket) {
  const exists = list.some((item) => item._id === updated._id);
  if (!exists) {
    return [updated, ...list];
  }

  return list.map((item) => (item._id === updated._id ? updated : item));
}

function statusBadgeClass(status: string) {
  switch (status) {
    case "Open":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "In Progress":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "Resolved":
    case "Closed":
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function priorityBadgeClass(priority: string) {
  switch (priority) {
    case "Critical":
    case "High":
      return "bg-rose-100 text-rose-700 border-rose-200";
    case "Medium":
      return "bg-orange-100 text-orange-700 border-orange-200";
    case "Low":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function renderHighlighted(text: string, query: string) {
  if (!query) {
    return text;
  }

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "ig");
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (part.toLowerCase() === query.toLowerCase()) {
      return (
        <mark key={`${part}-${index}`} className="rounded-sm bg-yellow-200 px-0.5 text-slate-900">
          {part}
        </mark>
      );
    }
    return <span key={`${part}-${index}`}>{part}</span>;
  });
}

export default function AdminPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [categoryFilters, setCategoryFilters] = useState<string[]>([]);
  const [priorityFilters, setPriorityFilters] = useState<string[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [sortKey, setSortKey] = useState<SortableKey>("updatedAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [page, setPage] = useState(1);
  const [liveEnabled, setLiveEnabled] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const searchRef = useRef<HTMLInputElement | null>(null);
  const debouncedSearch = useDebounce(searchInput, 280).trim().toLowerCase();

  async function loadTickets() {
    try {
      setLoading(true);
      const response = await api.get("/tickets");
      setTickets(response.data.data);
    } catch {
      toast.error("Failed to load tickets");
    } finally {
      setLoading(false);
    }
  }

  const openCount = tickets.filter((ticket) => ticket.status === "Open" || ticket.status === "In Progress").length;
  const criticalCount = tickets.filter((ticket) => ticket.priority === "Critical" || ticket.priority === "High").length;
  const unassignedCount = tickets.filter((ticket) => !ticket.assignedTo).length;

  useEffect(() => {
    loadTickets();
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("bookleaf_admin_live");
    if (stored === "false") {
      setLiveEnabled(false);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("bookleaf_admin_live", liveEnabled ? "true" : "false");
  }, [liveEnabled]);

  useEffect(() => {
    function onShortcut(event: KeyboardEvent) {
      if (event.key !== "/") {
        return;
      }

      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) {
        return;
      }

      event.preventDefault();
      searchRef.current?.focus();
    }

    window.addEventListener("keydown", onShortcut);
    return () => window.removeEventListener("keydown", onShortcut);
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !liveEnabled) {
      return;
    }

    const onTicket = (ticket: Ticket) => {
      setTickets((current) => upsertTicket(current, ticket));
      toast.success("Ticket updated", {
        description: ticket.subject,
      });
    };

    socket.on("ticket:new", onTicket);
    socket.on("ticket:updated", onTicket);

    return () => {
      socket.off("ticket:new", onTicket);
      socket.off("ticket:updated", onTicket);
    };
  }, [liveEnabled]);

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      if (statusFilters.length > 0 && !statusFilters.includes(ticket.status)) {
        return false;
      }
      if (categoryFilters.length > 0 && !categoryFilters.includes(ticket.category)) {
        return false;
      }
      if (priorityFilters.length > 0 && !priorityFilters.includes(ticket.priority)) {
        return false;
      }

      if (!debouncedSearch) {
        return true;
      }

      const haystack = [
        ticket.subject,
        ticket.authorId?.name,
        ticket.bookId?.title,
        ticket.category,
        ticket.status,
        ticket.priority,
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(debouncedSearch);
    });
  }, [tickets, statusFilters, categoryFilters, priorityFilters, debouncedSearch]);

  const sortedTickets = useMemo(() => {
    const clone = [...filteredTickets];
    clone.sort((left, right) => {
      let leftValue = "";
      let rightValue = "";

      if (sortKey === "updatedAt") {
        leftValue = String(+new Date(left.updatedAt));
        rightValue = String(+new Date(right.updatedAt));
      } else {
        leftValue = String(left[sortKey] || "");
        rightValue = String(right[sortKey] || "");
      }

      const compare = leftValue.localeCompare(rightValue, undefined, { numeric: true, sensitivity: "base" });
      return sortDirection === "asc" ? compare : -compare;
    });

    return clone;
  }, [filteredTickets, sortKey, sortDirection]);

  const maxPage = Math.max(1, Math.ceil(sortedTickets.length / PAGE_SIZE));
  const currentPage = Math.min(page, maxPage);

  const paginatedTickets = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedTickets.slice(start, start + PAGE_SIZE);
  }, [sortedTickets, currentPage]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilters, categoryFilters, priorityFilters]);

  const selectedTicket = useMemo(
    () => tickets.find((ticket) => ticket._id === selectedTicketId) || null,
    [tickets, selectedTicketId],
  );

  function toggleSort(nextKey: SortableKey) {
    if (sortKey !== nextKey) {
      setSortKey(nextKey);
      setSortDirection("asc");
      return;
    }

    setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
  }

  function updateSingleTicket(updated: Ticket) {
    setTickets((current) => upsertTicket(current, updated));
  }

  function toggleLiveUpdates() {
    setLiveEnabled((current) => {
      const next = !current;
      toast.success(next ? "Live updates enabled" : "Live updates paused");
      return next;
    });
  }

  return (
    <AuthGuard roles={["ADMIN"]}>
      <AppShell>
        <div className="space-y-6 animate-float-up">
          <section className="surface-card publication-shell overflow-hidden p-5 dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-4 h-0.5 w-full glow-divider" />
            <p className="ink-kicker dark:text-slate-300">Admin Operations Console</p>
            <h2 className="chapter-title mt-1 dark:text-slate-100">Premium ticket workflow command center</h2>
            <p className="mt-2 text-sm text-[#6f6250] dark:text-slate-400">
              Search, filter, triage, and respond to tickets in one high-speed workspace.
            </p>

            <div className="mt-4 grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-[1fr_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input
                  ref={searchRef}
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search tickets (press / to focus)"
                  className="border-[#cdb188] bg-[#fffaf2] pl-9 text-[#2f261b] placeholder:text-[#8a7a63] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
                <Button
                  variant="outline"
                  className="border-[#dcc8a8] bg-[#fff7ea] hover:bg-[#f7ebd7] dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200"
                  onClick={loadTickets}
                >
                  <BellRing className="size-4" />
                  Refresh
                </Button>

                <motion.button
                  type="button"
                  onClick={toggleLiveUpdates}
                  whileTap={{ scale: 0.98 }}
                  className={`inline-flex h-8 items-center gap-2 rounded-full border px-3 text-xs font-semibold transition ${
                    liveEnabled
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300"
                      : "border-slate-300 bg-white text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400"
                  }`}
                >
                  <span className={`size-2 rounded-full ${liveEnabled ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
                  Live Updates
                </motion.button>
              </div>
            </div>
          </section>

          <section className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
            <AdminStatCard
              label="Open"
              value={openCount}
              subtitle="Active tickets currently in progress"
              icon={CircleDot}
              accentClassName="amber"
              delay={0.05}
            />
            <AdminStatCard
              label="Critical"
              value={criticalCount}
              subtitle="High urgency tickets requiring immediate action"
              icon={Sparkles}
              accentClassName="rose"
              delay={0.1}
            />
            <AdminStatCard
              label="Unassigned"
              value={unassignedCount}
              subtitle="Tickets waiting for ownership"
              icon={ListFilter}
              accentClassName="blue"
              delay={0.15}
            />
          </section>

          <Card className="surface-card relative z-30 overflow-visible dark:border-slate-700 dark:bg-slate-900">
            <CardHeader>
              <CardTitle className="inline-flex items-center gap-2 dark:text-slate-100">
                <SlidersHorizontal className="size-4 text-[#8d7447] dark:text-slate-400" />
                Filters
              </CardTitle>
              <p className="text-sm text-[#6f6250] dark:text-slate-400">Pick one or multiple values, then remove them as pills.</p>
            </CardHeader>
            <CardContent className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              <MultiSelectFilter
                label="Status"
                icon={ListFilter}
                options={statuses}
                selected={statusFilters}
                onChange={setStatusFilters}
              />
              <MultiSelectFilter
                label="Category"
                icon={ListFilter}
                options={categories}
                selected={categoryFilters}
                onChange={setCategoryFilters}
              />
              <MultiSelectFilter
                label="Priority"
                icon={ListFilter}
                options={priorities}
                selected={priorityFilters}
                onChange={setPriorityFilters}
              />
            </CardContent>
          </Card>

          {loading ? (
            <Skeleton className="h-96 w-full" />
          ) : sortedTickets.length === 0 ? (
            <EmptyState
              title="No matching tickets"
              description="Try another keyword or clear some filters to broaden results."
            />
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-[#e0cfb2] bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-[#fbf6ec]/95 backdrop-blur dark:bg-slate-800/95">
                  <TableRow className="dark:border-slate-700">
                    <TableHead>
                      <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort("subject")}>
                        Subject
                        {sortKey === "subject" ? (sortDirection === "asc" ? <ArrowUpAZ className="size-3.5" /> : <ArrowDownAZ className="size-3.5" />) : null}
                      </button>
                    </TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Book</TableHead>
                    <TableHead>
                      <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort("priority")}>
                        Priority
                        {sortKey === "priority" ? (sortDirection === "asc" ? <ArrowUpAZ className="size-3.5" /> : <ArrowDownAZ className="size-3.5" />) : null}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort("status")}>
                        Status
                        {sortKey === "status" ? (sortDirection === "asc" ? <ArrowUpAZ className="size-3.5" /> : <ArrowDownAZ className="size-3.5" />) : null}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort("updatedAt")}>
                        Updated
                        {sortKey === "updatedAt" ? (sortDirection === "asc" ? <ArrowUpAZ className="size-3.5" /> : <ArrowDownAZ className="size-3.5" />) : null}
                      </button>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTickets.map((ticket) => (
                    <TableRow
                      key={ticket._id}
                      className="cursor-pointer transition hover:bg-[#f9f4ea] dark:hover:bg-slate-800 dark:border-slate-700"
                      onClick={() => setSelectedTicketId(ticket._id)}
                    >
                      <TableCell>
                        <p className="font-medium text-slate-900 dark:text-slate-100">{renderHighlighted(ticket.subject, debouncedSearch)}</p>
                        <p className="text-xs text-[#7c6c56] dark:text-slate-400">{ticket.category}</p>
                      </TableCell>
                      <TableCell className="text-foreground dark:text-slate-200">{renderHighlighted(ticket.authorId?.name || "N/A", debouncedSearch)}</TableCell>
                      <TableCell className="text-foreground dark:text-slate-200">{renderHighlighted(ticket.bookId?.title || "General", debouncedSearch)}</TableCell>
                      <TableCell>
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${priorityBadgeClass(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(ticket.status)}`}>
                          {ticket.status}
                        </span>
                      </TableCell>
                      <TableCell>{new Date(ticket.updatedAt).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

            <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-2 sm:gap-3 rounded-2xl border border-[#e2d4bd] bg-[#fffdf8] px-3 sm:px-4 py-2 sm:py-3 dark:border-slate-700 dark:bg-slate-900">
              <p className="text-xs sm:text-sm text-[#6f6250] dark:text-slate-400">
              Showing {(currentPage - 1) * PAGE_SIZE + 1}-{Math.min(currentPage * PAGE_SIZE, sortedTickets.length)} of {sortedTickets.length}
            </p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <Button size="sm" variant="outline" disabled={currentPage <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                Previous
              </Button>
              <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">Page {currentPage} / {maxPage}</span>
              <Button size="sm" variant="outline" disabled={currentPage >= maxPage} onClick={() => setPage((p) => Math.min(maxPage, p + 1))}>
                Next
              </Button>
            </div>
          </div>
        </div>

        <TicketDetailDrawer
          open={Boolean(selectedTicket)}
          ticket={selectedTicket}
          onClose={() => setSelectedTicketId(null)}
          onTicketUpdated={updateSingleTicket}
        />
      </AppShell>
    </AuthGuard>
  );
}
