"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/hooks/use-auth";
import { UserRole } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

export function AuthGuard({
  roles,
  children,
}: {
  roles: UserRole[];
  children: React.ReactNode;
}) {
  const { user, isReady } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isReady) {
      return;
    }

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!roles.includes(user.role)) {
      router.replace(user.role === "ADMIN" ? "/admin" : "/author");
    }
  }, [isReady, user, roles, router]);

  if (!isReady || !user || !roles.includes(user.role)) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-4 p-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return <>{children}</>;
}
