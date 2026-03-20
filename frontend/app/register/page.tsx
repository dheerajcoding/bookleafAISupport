"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const schema = z.object({
  author_id: z.string().optional(),
  name: z.string().min(2),
  email: z.string().email(),
  city: z.string().optional(),
  password: z.string().min(6),
});

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
  const { register } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      author_id: "",
      name: "",
      email: "",
      city: "",
      password: "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      setSubmitting(true);
      await register(values);
      toast.success("Registration successful");
    } catch (error: unknown) {
      const message =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : "Registration failed";
      toast.error(message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-xl rounded-2xl border-slate-200 bg-white/95">
        <CardHeader>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">BookLeaf Portal</p>
          <CardTitle className="text-2xl">Create author account</CardTitle>
          <p className="text-sm text-slate-600">Set up your profile to track books, royalties, and support tickets.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="author_id">Author ID (optional)</Label>
              <Input id="author_id" placeholder="Example: AUTH123" {...form.register("author_id")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="Your full name" {...form.register("name")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" placeholder="Your city" {...form.register("city")} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="name@company.com" {...form.register("email")} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="At least 6 characters" {...form.register("password")} />
            </div>
            <Button type="submit" disabled={submitting} className="sm:col-span-2">
              {submitting ? "Creating account..." : "Create account"}
            </Button>
          </form>
          <p className="mt-4 text-sm text-slate-600">
            Already have an account? <Link href="/login" className="font-medium text-slate-900">Login</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
