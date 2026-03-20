export type UserRole = "AUTHOR" | "ADMIN";

export interface User {
  id: string;
  author_id?: string;
  name: string;
  email: string;
  role: UserRole;
  city?: string;
  joined_date?: string;
}

export interface Book {
  _id: string;
  book_id: string;
  title: string;
  isbn: string | null;
  genre: string | null;
  publication_date: string | null;
  status: string | null;
  mrp: number | null;
  author_royalty_per_copy: number | null;
  total_copies_sold: number | null;
  total_royalty_earned: number | null;
  royalty_paid: number | null;
  royalty_pending: number | null;
  last_royalty_payout_date: string | null;
  print_partner: string | null;
  available_on: string[];
}

export interface TicketMessage {
  sender: UserRole;
  content: string;
  createdAt: string;
}

export interface Ticket {
  _id: string;
  authorId: {
    _id: string;
    name: string;
    email: string;
    author_id?: string;
  };
  bookId: {
    _id: string;
    title: string;
    book_id: string;
    status: string | null;
    publication_date: string | null;
  } | null;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: "Open" | "In Progress" | "Resolved" | "Closed";
  assignedTo: {
    _id: string;
    name: string;
    email: string;
  } | null;
  messages: TicketMessage[];
  aiDraftResponse: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
