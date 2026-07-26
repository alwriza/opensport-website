import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { useDemoContext } from "@/demo";

export function useCurrentUser() {
  const demo = useDemoContext();
  const [user, setUser] = useState<User | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsLoaded(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoaded(true);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  if (demo) {
    return { user: demo.user as unknown as User, isLoaded: true, isSignedIn: true };
  }

  return { user, isLoaded, isSignedIn: !!user };
}