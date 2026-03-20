"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { Book, Ticket } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const schema = z.object({
  bookId: z.string().optional(),
  subject: z.string().min(3, "Subject is too short"),
  description: z.string().min(10, "Description should be at least 10 characters"),
});

type FormValues = z.infer<typeof schema>;

export function CreateTicketForm({
  books,
  onCreated,
}: {
  books: Book[];
  onCreated: (ticket: Ticket) => void;
}) {
  const [bookId, setBookId] = useState<string>("general");
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      subject: "",
      description: "",
    },
  });

  const descriptionValue = form.watch("description") || "";

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      setSubmitting(true);
      const response = await api.post("/tickets", {
        ...values,
        bookId: bookId === "general" ? null : bookId,
      });
      onCreated(response.data.data);
      form.reset();
      setBookId("general");
      toast.success("Ticket created successfully");
    } catch (error: unknown) {
      const message =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : "Failed to create ticket";
      toast.error(message || "Failed to create ticket");
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <Card className="surface-card publication-shell dark:border-slate-700 dark:bg-slate-900">
      <CardHeader>
        <CardTitle>Create Support Ticket</CardTitle>
        <p className="text-sm text-slate-700 dark:text-slate-400">Describe the problem clearly so the team can resolve it faster.</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Book</Label>
            <Select value={bookId} onValueChange={(value) => setBookId(value ?? "general")}>
              <SelectTrigger className="bg-[#fffaf2] text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
                <SelectValue placeholder="Select a book" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General query (not book-specific)</SelectItem>
                {books.map((book) => (
                  <SelectItem key={book._id} value={book._id}>
                    {book.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" className="bg-[#fffaf2] text-slate-900 placeholder:text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400" placeholder="Example: Royalty amount mismatch for Q4" {...form.register("subject")} />
            {form.formState.errors.subject && (
              <p className="text-sm text-rose-600 dark:text-rose-400">{form.formState.errors.subject.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={5}
              className="bg-[#fffaf2] text-slate-900 placeholder:text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400"
              placeholder="Share what happened, expected result, and any numbers or dates that can help."
              {...form.register("description")}
            />
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
              <p>Tip: Include specific amounts, dates, or affected platforms for faster resolution.</p>
              <p>{descriptionValue.length}/3000</p>
            </div>
            {form.formState.errors.description && (
              <p className="text-sm text-rose-600 dark:text-rose-400">{form.formState.errors.description.message}</p>
            )}
          </div>

          <Button type="submit" disabled={submitting} className="w-full bg-[#2a3648] text-[#fff7ea] hover:bg-[#1f2a3a] sm:w-auto dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white">
            {submitting ? "Submitting..." : "Submit Ticket"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
