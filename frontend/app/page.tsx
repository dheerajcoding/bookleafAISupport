"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bot, MessageSquareText, ShieldCheck, Sparkles } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  const { user, isReady } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isReady || !user) {
      return;
    }

    router.replace(user.role === "ADMIN" ? "/admin" : "/author");
  }, [isReady, user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white/95 shadow-xl shadow-slate-900/5">
        <div className="grid gap-8 p-6 md:grid-cols-[1.2fr_1fr] md:p-10">
          <section>
            <p className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">
              BookLeaf Publishing
            </p>
            <h1 className="mt-4 text-3xl font-semibold leading-tight text-slate-900 md:text-4xl">
              Support Portal Built For Authors And Publishing Teams
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 md:text-base">
              Raise book-specific issues, track progress in real time, and resolve conversations in one place.
              Every ticket includes smart classification and admin-ready response drafts.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/login">
                <Button size="lg" className="px-5">Start With Login</Button>
              </Link>
              <Link href="/register">
                <Button variant="outline" size="lg" className="px-5">Create Author Account</Button>
              </Link>
            </div>
          </section>

          <section className="grid gap-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-slate-900">
                <MessageSquareText className="size-4 text-blue-600" />
                <p className="text-sm font-semibold">Unified Ticket Workspace</p>
              </div>
              <p className="mt-2 text-xs text-slate-600">All author issues, replies, status, and assignments in one clear workflow.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-slate-900">
                <Bot className="size-4 text-emerald-600" />
                <p className="text-sm font-semibold">AI Powered Guidance</p>
              </div>
              <p className="mt-2 text-xs text-slate-600">Get priority, category, and concise draft responses for faster decisions.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-slate-900">
                <ShieldCheck className="size-4 text-violet-600" />
                <p className="text-sm font-semibold">Role Based Access</p>
              </div>
              <p className="mt-2 text-xs text-slate-600">Authors and admins each get focused, easy-to-understand dashboards.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-gradient-to-r from-amber-50 to-rose-50 p-4">
              <p className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700">
                <Sparkles className="size-3.5 text-amber-600" />
                Built to feel simple on day one
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
