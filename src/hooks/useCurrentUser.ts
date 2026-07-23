import { useUser } from "@clerk/clerk-react";
import { useDemoContext } from "@/demo";

export function useCurrentUser() {
  const demo = useDemoContext();
  const clerk = useUser();

  if (demo) {
    return {
      user: demo.user,
      isLoaded: true,
      isSignedIn: true,
    };
  }

  return clerk;
}
