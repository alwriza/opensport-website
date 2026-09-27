import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

const PasswordInput = React.forwardRef<HTMLInputElement, Omit<React.ComponentProps<"input">, "type">>(
  ({ className, id, disabled, ...props }, ref) => {
    const { t } = useTranslation("auth");
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const [visible, setVisible] = React.useState(false);

    return (
      <div className="relative">
        <Input
          {...props}
          ref={ref}
          id={inputId}
          disabled={disabled}
          type={visible ? "text" : "password"}
          className={cn("pr-11", className)}
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => setVisible(value => !value)}
          aria-label={t(visible ? "hidePassword" : "showPassword")}
          aria-controls={inputId}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-sm text-muted-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        >
          {visible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>
    );
  },
);
PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
