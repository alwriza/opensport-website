import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useDemoContext, useDemoMutationGuard } from "@/demo";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { CoachLayout, type CoachTab } from "@/components/coach/CoachLayout";
import { OverviewTab } from "@/components/coach/overview/OverviewTab";
import { SquadTab } from "@/components/coach/squad/SquadTab";
import { StatisticsTab } from "@/components/coach/statistics/StatisticsTab";
import { MatchesTab } from "@/components/coach/matches/MatchesTab";
import { EvaluationsTab } from "@/components/coach/evaluations/EvaluationsTab";
import { TrainingTab } from "@/components/coach/training/TrainingTab";
import { CreateTeamModal } from "@/components/ui/CreateTeamModal";

export default function CoachDashboard() {
  const { t } = useTranslation("dashboard");
  const { user, isLoaded } = useCurrentUser();
  const demo = useDemoContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get("tab") as CoachTab) || "overview";
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleTabChange = (tab: CoachTab) => {
    const p = new URLSearchParams(searchParams);
    p.set("tab", tab);
    setSearchParams(p, { replace: true });
  };

  const { data: coachProfile } = useQuery({
    queryKey: ["coach-profile", user?.id],
    queryFn: async () => {
      if (demo) return demo.coachProfile;
      if (!user) return null;
      const { data, error } = await supabase.from("users").select("*").eq("auth_user_id", user.id).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user || !!demo,
  });

  const coachDbId = (coachProfile as any)?.id;

  const { data: teams = [], isLoading: loadingTeams } = useQuery({
    queryKey: ["coach-teams", coachDbId],
    queryFn: async () => {
      if (demo) return demo.teams;
      const { data, error } = await supabase
        .from("team_coaches")
        .select(`team_id, role, teams (id, name, age_group, season, invite_code, clubs (name))`)
        .eq("coach_id", coachDbId) as any;
      if (error) throw error;
      return (data || []).map((ct: any) => ct.teams);
    },
    enabled: !!coachDbId || !!demo,
  });

  const teamId = searchParams.get("team") || teams[0]?.id || undefined;
  const selectedTeam = teams.find((t: any) => t.id === teamId);

  const handleTeamChange = (newTeamId: string) => {
    const p = new URLSearchParams(searchParams);
    p.set("team", newTeamId);
    setSearchParams(p, { replace: true });
  };

  const handleDeleteTeam = async (teamId: string, teamName: string) => {
    if (!confirm(t("coach.confirms.deleteTeam", { name: teamName }))) return;
    try {
      const { error } = await supabase.from("teams").delete().eq("id", teamId);
      if (error) throw error;
      toast({ title: t("coach.toasts.deleteTeamSuccess.title"), description: t("coach.toasts.deleteTeamSuccess.description", { name: teamName }) });
      queryClient.invalidateQueries({ queryKey: ["coach-teams", coachDbId] });
    } catch (err: any) {
      toast({ title: t("coach.toasts.deleteTeamError.title"), description: err.message, variant: "destructive" });
    }
  };

  if (!isLoaded || loadingTeams) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm font-black uppercase tracking-widest opacity-40">{t("coach.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="container mx-auto px-4 md:px-6 py-6 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-4">
          <Select value={teamId ?? ""} onValueChange={handleTeamChange}>
            <SelectTrigger className="w-[220px] bg-card border-white/5">
              <SelectValue placeholder={t("coach.selectTeam")} />
            </SelectTrigger>
            <SelectContent>
              {teams.map((team: any) => (
                <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedTeam && (
            <Button variant="outline" size="sm" className="border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteTeam(selectedTeam.id, selectedTeam.name)}>
              <Trash2 className="h-4 w-4 mr-2" /> {t("coach.deleteTeam")}
            </Button>
          )}
        </div>
        <Button className="bg-primary hover:bg-primary/90 text-black font-bold" onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" /> {t("coach.createTeam")}
        </Button>
      </div>

      <CoachLayout activeTab={activeTab} onTabChange={handleTabChange}>
        {activeTab === "overview" && <OverviewTab teamId={teamId} team={selectedTeam} />}
        {activeTab === "squad" && <SquadTab teamId={teamId} />}
        {activeTab === "statistics" && <StatisticsTab teamId={teamId} />}
        {activeTab === "matches" && <MatchesTab teamId={teamId} />}
        {activeTab === "evaluations" && <EvaluationsTab teamId={teamId} />}
        {activeTab === "training" && <TrainingTab teamId={teamId} />}
      </CoachLayout>

      {showCreateModal && coachDbId && (
        <CreateTeamModal open={showCreateModal} onClose={() => setShowCreateModal(false)} coachId={coachDbId} onSuccess={() => queryClient.invalidateQueries({ queryKey: ["coach-teams", coachDbId] })} />
      )}
    </div>
  );
}