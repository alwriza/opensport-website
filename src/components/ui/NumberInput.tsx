import * as React from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
    value: number | string;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
}

export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
    ({ className, value, onChange, min, max, step = 1, ...props }, ref) => {

        const handleIncrement = (e: React.MouseEvent) => {
            e.preventDefault();
            const currentValue = Number(value) || 0;
            const newValue = currentValue + step;
            if (max !== undefined && newValue > max) return;
            onChange(newValue);
        };

        const handleDecrement = (e: React.MouseEvent) => {
            e.preventDefault();
            const currentValue = Number(value) || 0;
            const newValue = currentValue - step;
            if (min !== undefined && newValue < min) return;
            onChange(newValue);
        };

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            // Allow empty string for better typing experience, but parent expects number. 
            // If empty, we might need to handle it. For now, defaulting to 0 or min.
            const val = e.target.value;
            if (val === '') {
                onChange(0); // Or handle empty state if parent supports it
                return;
            }
            const newValue = parseInt(val);
            if (isNaN(newValue)) return;
            onChange(newValue);
        };

        // Split className to separate layout (width, margin) from visual (bg, border) if possible, 
        // OR apply everything to wrapper and reset input. 
        // Best approach for compatibility: Apply className to wrapper but ensure it mimics input look.

        return (
            <div className={cn(
                "relative flex items-center w-full rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
                className
            )}>
                <input
                    type="number"
                    className="flex-1 w-full h-10 px-3 py-2 text-sm bg-transparent border-none outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 text-inherit pr-8"
                    ref={ref}
                    value={value}
                    onChange={handleChange}
                    min={min}
                    max={max}
                    step={step}
                    {...props}
                />
                <div className="absolute right-1 top-1 bottom-1 flex flex-col w-6 gap-0.5 border-l border-white/5 pl-1">
                    <button
                        type="button"
                        onClick={handleIncrement}
                        className="flex-1 flex items-center justify-center rounded-sm hover:bg-primary/20 text-muted-foreground hover:text-primary focus:outline-none transition-colors"
                        tabIndex={-1}
                    >
                        <ChevronUp className="h-3 w-3" />
                    </button>
                    <button
                        type="button"
                        onClick={handleDecrement}
                        className="flex-1 flex items-center justify-center rounded-sm hover:bg-primary/20 text-muted-foreground hover:text-primary focus:outline-none transition-colors"
                        tabIndex={-1}
                    >
                        <ChevronDown className="h-3 w-3" />
                    </button>
                </div>
            </div>
        );
    }
);

NumberInput.displayName = "NumberInput";
