import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { useDemoContext } from "@/demo";

export function useCurrentUser() {
  const demo = useDemoContext();
  const [user, setUser] = useState<User | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let active = true;

    // INITIAL_SESSION reports the restored session or null after recovery.
    // Use the same stream for startup and later changes to avoid stale reads.
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setUser(session?.user ?? null);
      setIsLoaded(true);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  if (demo) {
    return { user: demo.user as unknown as User, isLoaded: true, isSignedIn: true };
  }

  return { user, isLoaded, isSignedIn: !!user };
}
