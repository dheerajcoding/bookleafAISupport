import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Book } from "@/lib/types";

function formatCurrency(value: number | null) {
  if (value === null || value === undefined) {
    return "N/A";
  }
  return `INR ${value.toLocaleString()}`;
}

function formatDate(value: string | null) {
  if (!value) {
    return "N/A";
  }
  return new Date(value).toLocaleDateString();
}

export function BookTable({ books }: { books: Book[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[#e0cfb2] bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-[#fbf6ec]/90 backdrop-blur dark:bg-slate-800/90">
          <TableRow className="dark:border-slate-700">
            <TableHead className="dark:text-slate-200">Book</TableHead>
            <TableHead className="dark:text-slate-200">Status</TableHead>
            <TableHead className="dark:text-slate-200">Genre</TableHead>
            <TableHead className="dark:text-slate-200">ISBN</TableHead>
            <TableHead className="dark:text-slate-200">Copies Sold</TableHead>
            <TableHead className="dark:text-slate-200">Royalty Earned</TableHead>
            <TableHead className="dark:text-slate-200">Royalty Pending</TableHead>
            <TableHead className="dark:text-slate-200">Last Payout</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {books.map((book) => {
            const hideRoyalty = (book.status || "").toLowerCase() === "in production";

            return (
              <TableRow key={book._id} className="transition hover:bg-[#f9f4ea] dark:hover:bg-slate-800 dark:border-slate-700">
                <TableCell>
                  <p className="font-medium text-slate-900 dark:text-slate-100">{book.title}</p>
                  <p className="text-xs text-[#7c6c56] dark:text-slate-400">{book.book_id}</p>
                </TableCell>
                <TableCell>
                  {hideRoyalty ? (
                    <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                      In Production
                    </span>
                  ) : (
                    <span className="dark:text-slate-200">{book.status || "N/A"}</span>
                  )}
                </TableCell>
                <TableCell className="dark:text-slate-200">{book.genre || "N/A"}</TableCell>
                <TableCell className="dark:text-slate-200">{book.isbn || "N/A"}</TableCell>
                <TableCell className="dark:text-slate-200">{book.total_copies_sold ?? "N/A"}</TableCell>
                <TableCell className="dark:text-slate-200">{hideRoyalty ? "N/A" : formatCurrency(book.total_royalty_earned)}</TableCell>
                <TableCell className="dark:text-slate-200">{hideRoyalty ? "N/A" : formatCurrency(book.royalty_pending)}</TableCell>
                <TableCell className="dark:text-slate-200">{hideRoyalty ? "N/A" : formatDate(book.last_royalty_payout_date)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
