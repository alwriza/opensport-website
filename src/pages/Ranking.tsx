import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RankingFilters } from "@/components/ranking/RankingFilters";
import { RankingTable } from "@/components/ranking/RankingTable";
import { PlayerPreviewModal } from "@/components/ranking/PlayerPreviewModal";
import { CompareView } from "@/components/ranking/CompareView";
import { Trophy, GitCompare, X } from "lucide-react";
import { useDemoContext } from "@/demo/DemoContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
    const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
    const [showCompare, setShowCompare] = useState(false);

    const PAGE_SIZE = 50;

    const handleToggleCompare = (userId: string) => {
        setSelectedForCompare(prev => {
            if (prev.includes(userId)) return prev.filter(id => id !== userId);
            if (prev.length >= 2) return [prev[1], userId];
            return [...prev, userId];
        });
    };

    const comparePlayers: RankingPlayer[] = selectedForCompare.map(id =>
        players.find(p => p.user_id === id)
    ).filter(Boolean) as RankingPlayer[];

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

    const demo = useDemoContext();

    const DEMO_RANKING: RankingPlayer[] = [
        { user_id: "demo-other-1", name: "Marcus Silva", avatar_url: null, age: 17, position: "FWD", city: "Barcelona", country: "Spain", best_score: 94.2, total_analyses: 28 },
        { user_id: "demo-other-2", name: "Amelia Johnson", avatar_url: null, age: 16, position: "MID", city: "London", country: "UK", best_score: 91.5, total_analyses: 22 },
        { user_id: "demo-other-3", name: "Carlos Rodriguez", avatar_url: null, age: 18, position: "DEF", city: "Madrid", country: "Spain", best_score: 88.7, total_analyses: 19 },
        { user_id: "demo-other-4", name: "Sofia Andersson", avatar_url: null, age: 17, position: "GK", city: "Stockholm", country: "Sweden", best_score: 85.3, total_analyses: 31 },
        { user_id: "demo-other-5", name: "Kwame Asante", avatar_url: null, age: 16, position: "MID", city: "Accra", country: "Ghana", best_score: 82.1, total_analyses: 15 },
        { user_id: "demo-6", name: "Luca Ferrari", avatar_url: null, age: 19, position: "FWD", city: "Milan", country: "Italy", best_score: 79.8, total_analyses: 24 },
        { user_id: "demo-7", name: "Yuki Tanaka", avatar_url: null, age: 15, position: "MID", city: "Tokyo", country: "Japan", best_score: 77.4, total_analyses: 20 },
        { user_id: "demo-8", name: "Oliver Schmidt", avatar_url: null, age: 18, position: "DEF", city: "Munich", country: "Germany", best_score: 76.2, total_analyses: 17 },
        { user_id: "demo-9", name: "Emma Dubois", avatar_url: null, age: 16, position: "FWD", city: "Paris", country: "France", best_score: 74.9, total_analyses: 26 },
        { user_id: "demo-10", name: "Rafael Santos", avatar_url: null, age: 17, position: "MID", city: "Rio de Janeiro", country: "Brazil", best_score: 73.5, total_analyses: 23 },
        { user_id: "demo-11", name: "James Murphy", avatar_url: null, age: 15, position: "DEF", city: "Dublin", country: "Ireland", best_score: 71.8, total_analyses: 14 },
        { user_id: "demo-12", name: "Aisha Patel", avatar_url: null, age: 18, position: "GK", city: "Mumbai", country: "India", best_score: 70.2, total_analyses: 18 },
        { user_id: "demo-13", name: "Noah van Dijk", avatar_url: null, age: 16, position: "FWD", city: "Amsterdam", country: "Netherlands", best_score: 68.6, total_analyses: 21 },
        { user_id: "demo-14", name: "Ivan Petrov", avatar_url: null, age: 17, position: "MID", city: "Moscow", country: "Russia", best_score: 67.1, total_analyses: 16 },
        { user_id: "demo-15", name: "Chen Wei", avatar_url: null, age: 15, position: "DEF", city: "Shanghai", country: "China", best_score: 65.8, total_analyses: 12 },
        { user_id: "demo-16", name: "Hugo Morales", avatar_url: null, age: 20, position: "MID", city: "Mexico City", country: "Mexico", best_score: 64.3, total_analyses: 29 },
        { user_id: "demo-17", name: "Oscar Johansson", avatar_url: null, age: 18, position: "FWD", city: "Oslo", country: "Norway", best_score: 62.9, total_analyses: 13 },
        { user_id: "demo-18", name: "Fatima Al-Rashid", avatar_url: null, age: 16, position: "MID", city: "Dubai", country: "UAE", best_score: 61.4, total_analyses: 19 },
        { user_id: "demo-19", name: "David Kim", avatar_url: null, age: 17, position: "DEF", city: "Seoul", country: "South Korea", best_score: 60.0, total_analyses: 25 },
        { user_id: "demo-20", name: "Liam O'Brien", avatar_url: null, age: 19, position: "GK", city: "New York", country: "USA", best_score: 58.7, total_analyses: 11 },
    ];

    // Data Fetching
    const { data: players = [], isLoading } = useQuery({
        queryKey: ['global-rankings', page, position, ageGroup, country, city],
        queryFn: async () => {
            if (demo) {
                let filtered = [...DEMO_RANKING];
                if (position && position !== "all") filtered = filtered.filter(p => p.position === position);
                if (ageGroup && ageGroup !== "all") {
                    switch (ageGroup) {
                        case "U14": filtered = filtered.filter(p => p.age !== null && p.age <= 14); break;
                        case "U15": filtered = filtered.filter(p => p.age === 15); break;
                        case "U16": filtered = filtered.filter(p => p.age === 16); break;
                        case "U17": filtered = filtered.filter(p => p.age === 17); break;
                        case "U18": filtered = filtered.filter(p => p.age === 18); break;
                        case "U19+": filtered = filtered.filter(p => p.age !== null && p.age >= 19); break;
                    }
                }
                if (country) filtered = filtered.filter(p => p.country?.toLowerCase().includes(country.toLowerCase()));
                if (city) filtered = filtered.filter(p => p.city?.toLowerCase().includes(city.toLowerCase()));
                filtered.sort((a, b) => b.best_score - a.best_score);
                const from = (page - 1) * PAGE_SIZE;
                return filtered.slice(from, from + PAGE_SIZE);
            }

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
                selectedForCompare={selectedForCompare}
                onToggleCompare={handleToggleCompare}
            />

            {/* Compare Button */}
            {selectedForCompare.length === 2 && (
                <div className="flex justify-center">
                    <Button onClick={() => setShowCompare(true)} className="bg-primary text-black hover:bg-primary/90 gap-2">
                        <GitCompare className="h-4 w-4" />
                        Compare selected players
                    </Button>
                </div>
            )}
            {selectedForCompare.length === 1 && (
                <p className="text-center text-xs text-muted-foreground">
                    Select one more player to compare
                </p>
            )}

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

            {/* Compare View */}
            <CompareView
                players={comparePlayers}
                open={showCompare}
                onClose={() => setShowCompare(false)}
            />
        </div>
    );
}
