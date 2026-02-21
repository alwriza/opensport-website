import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RankingFilters } from "@/components/ranking/RankingFilters";
import { RankingTable } from "@/components/ranking/RankingTable";
import { PlayerPreviewModal } from "@/components/ranking/PlayerPreviewModal";
import { Trophy } from "lucide-react";

interface RankingPlayer {
    user_id: string;
    name: string;
    avatar_url: string | null;
    age: number | null;
    position: string | null;
    city: string | null;
    country: string | null;
    best_score: number;
    total_analyses: number;
}

export default function Ranking() {
    const { t } = useTranslation("ranking");
    const [searchParams, setSearchParams] = useSearchParams();

    // URL State
    const page = parseInt(searchParams.get("page") || "1");
    const position = searchParams.get("position") || "";
    const ageGroup = searchParams.get("ageGroup") || "";
    const country = searchParams.get("country") || "";
    const city = searchParams.get("city") || "";

    // Local State
    const [selectedPlayer, setSelectedPlayer] = useState<RankingPlayer | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const PAGE_SIZE = 50;

    // Filter handlers
    const handleFilterChange = (key: string, value: string) => {
        const newParams = new URLSearchParams(searchParams);
        if (value && value !== "all") {
            newParams.set(key, value);
        } else {
            newParams.delete(key);
        }
        newParams.set("page", "1"); // Reset to page 1 on filter change
        setSearchParams(newParams);
    };

    const handleReset = () => {
        setSearchParams(new URLSearchParams());
    };

    const handlePageChange = (newPage: number) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set("page", newPage.toString());
        setSearchParams(newParams);
    };

    // Data Fetching
    const { data: players = [], isLoading } = useQuery({
        queryKey: ['global-rankings', page, position, ageGroup, country, city],
        queryFn: async () => {
            let query = supabase
                .from('global_rankings')
                .select('*');

            // Apply Filters
            if (position && position !== "all") {
                query = query.eq('position', position);
            }

            if (ageGroup && ageGroup !== "all") {
                // Handle Age Groups
                switch (ageGroup) {
                    case "U14": query = query.lte('age', 14); break;
                    case "U15": query = query.eq('age', 15); break;
                    case "U16": query = query.eq('age', 16); break;
                    case "U17": query = query.eq('age', 17); break;
                    case "U18": query = query.eq('age', 18); break;
                    case "U19+": query = query.gte('age', 19); break;
                }
            }

            if (country) {
                query = query.ilike('country', `%${country}%`);
            }

            if (city) {
                query = query.ilike('city', `%${city}%`);
            }

            // Pagination
            const from = (page - 1) * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;

            const { data, error } = await query
                .order('best_score', { ascending: false })
                .range(from, to);

            if (error) {
                console.error("Error fetching rankings:", error);
                throw error;
            }

            return data as RankingPlayer[];
        },
        // Keep previous data while fetching new page for smoother transition
        placeholderData: (previousData) => previousData,
    });

    return (
        <div className="container px-4 md:px-6 py-6 md:py-8 space-y-8 max-w-[1600px] mx-auto min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-gradient flex items-center gap-3">
                        <Trophy className="h-8 w-8 md:h-12 md:w-12 text-primary" />
                        {t("title")}
                    </h1>
                    <p className="text-muted-foreground font-medium text-lg">
                        {t("subtitle")}
                    </p>
                </div>
            </div>

            {/* Filters */}
            <RankingFilters
                filters={{ position, ageGroup, country, city }}
                onFilterChange={handleFilterChange}
                onReset={handleReset}
            />

            {/* Table */}
            <RankingTable
                players={players}
                isLoading={isLoading}
                onPlayerClick={(player) => {
                    setSelectedPlayer(player);
                    setIsModalOpen(true);
                }}
                page={page}
                pageSize={PAGE_SIZE}
            />

            {/* Pagination Controls */}
            <div className="flex justify-center gap-4 mt-8">
                <button
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1 || isLoading}
                    className="px-4 py-2 rounded-lg bg-card/50 border border-white/5 disabled:opacity-50 hover:bg-white/5 transition-colors"
                >
                    Previous
                </button>
                <span className="flex items-center px-4 font-medium text-muted-foreground">
                    Page {page}
                </span>
                <button
                    onClick={() => handlePageChange(page + 1)}
                    disabled={players.length < PAGE_SIZE || isLoading}
                    className="px-4 py-2 rounded-lg bg-card/50 border border-white/5 disabled:opacity-50 hover:bg-white/5 transition-colors"
                >
                    Next
                </button>
            </div>

            {/* Player Modal */}
            <PlayerPreviewModal
                player={selectedPlayer}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
}
