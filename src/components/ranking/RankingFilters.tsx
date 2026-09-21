import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { RotateCcw } from "lucide-react";

interface RankingFiltersProps {
    filters: {
        position: string;
        ageGroup: string;
        country: string;
        city: string;
    };
    onFilterChange: (key: string, value: string) => void;
    onReset: () => void;
}

export function RankingFilters({ filters, onFilterChange, onReset }: RankingFiltersProps) {
    const { t } = useTranslation("ranking");

    const positions = ["GK", "DEF", "MID", "FWD"];
    const ageGroups = ["U14", "U15", "U16", "U17", "U18", "U19+"];

    return (
        <div className="flex flex-col md:flex-row gap-4 items-end bg-surface-1 p-4 rounded-xl border border-border">
            <div className="w-full md:w-48 space-y-2">
                <label className="text-sm font-medium text-muted-foreground">{t("filters.position")}</label>
                <Select
                    value={filters.position}
                    onValueChange={(value) => onFilterChange("position", value)}
                >
                    <SelectTrigger>
                        <SelectValue placeholder={t("filters.allPositions")} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t("filters.allPositions")}</SelectItem>
                        {positions.map((pos) => (
                            <SelectItem key={pos} value={pos}>
                                {pos}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="w-full md:w-48 space-y-2">
                <label className="text-sm font-medium text-muted-foreground">{t("filters.ageGroup")}</label>
                <Select
                    value={filters.ageGroup}
                    onValueChange={(value) => onFilterChange("ageGroup", value)}
                >
                    <SelectTrigger>
                        <SelectValue placeholder={t("filters.allAges")} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">{t("filters.allAges")}</SelectItem>
                        {ageGroups.map((age) => (
                            <SelectItem key={age} value={age}>
                                {age}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="w-full md:w-48 space-y-2">
                <label className="text-sm font-medium text-muted-foreground">{t("filters.country")}</label>
                <Input
                    placeholder={t("filters.countryPlaceholder")}
                    value={filters.country}
                    onChange={(e) => onFilterChange("country", e.target.value)}
                />
            </div>

            <div className="w-full md:w-48 space-y-2">
                <label className="text-sm font-medium text-muted-foreground">{t("filters.city")}</label>
                <Input
                    placeholder={t("filters.cityPlaceholder")}
                    value={filters.city}
                    onChange={(e) => onFilterChange("city", e.target.value)}
                />
            </div>

            <Button
                variant="ghost"
                size="icon"
                onClick={onReset}
                className="shrink-0 text-muted-foreground hover:text-foreground mb-0.5"
                title={t("filters.reset")}
            >
                <RotateCcw className="h-5 w-5" />
            </Button>
        </div>
    );
}
