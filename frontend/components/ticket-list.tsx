"use client";

import Link from "next/link";

import { Ticket } from "@/lib/types";
import { StatusBadge } from "@/components/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function TicketList({ tickets }: { tickets: Ticket[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[#e0cfb2] bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-[#fbf6ec]/90 backdrop-blur dark:bg-slate-800/90">
          <TableRow className="dark:border-slate-700">
            <TableHead className="dark:text-slate-200">Subject</TableHead>
            <TableHead className="dark:text-slate-200">Book</TableHead>
            <TableHead className="dark:text-slate-200">Category</TableHead>
            <TableHead className="dark:text-slate-200">Priority</TableHead>
            <TableHead className="dark:text-slate-200">Status</TableHead>
            <TableHead className="dark:text-slate-200">Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket) => (
            <TableRow key={ticket._id} className="transition hover:bg-[#f9f4ea] dark:hover:bg-slate-800 dark:border-slate-700">
              <TableCell>
                <Link href={`/tickets/${ticket._id}`} className="font-medium text-slate-900 hover:underline dark:text-slate-100">
                  {ticket.subject}
                </Link>
                <p className="text-xs text-[#7c6c56] dark:text-slate-400">Open thread</p>
              </TableCell>
              <TableCell className="dark:text-slate-200">{ticket.bookId?.title || "General"}</TableCell>
              <TableCell className="dark:text-slate-200">{ticket.category}</TableCell>
              <TableCell>
                <StatusBadge value={ticket.priority} />
              </TableCell>
              <TableCell>
                <StatusBadge value={ticket.status} />
              </TableCell>
              <TableCell className="dark:text-slate-200">{new Date(ticket.updatedAt).toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
