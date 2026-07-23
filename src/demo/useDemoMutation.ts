import { useDemoContext } from "./DemoContext";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export function useDemoMutationGuard() {
  const demo = useDemoContext();
  const { toast } = useToast();
  const { t } = useTranslation("common");

  const guard = () => {
    if (demo) {
      toast({
        title: t("demo.blocked.title", "Demo Mode"),
        description: t("demo.blocked.description", "This action is not available in demo mode."),
        variant: "destructive",
      });
      return true;
    }
    return false;
  };

  return {
    isDemo: !!demo,
    guard,
  };
}
