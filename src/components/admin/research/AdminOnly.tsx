import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useIsAdmin } from "@/hooks/useAdminReferrals";
import NotFound from "@/pages/NotFound";

/** Renders children only for rows in public.admin_users; everyone else sees 404. */
export function AdminOnly({ children }: { children: ReactNode }) {
  const { user } = useCurrentUser();
  const isAdmin = useIsAdmin(!!user);
  if (isAdmin.isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }
  if (!isAdmin.data) return <NotFound />;
  return <>{children}</>;
}
