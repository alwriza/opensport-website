import { getErrorMessage } from "@/lib/errors";
import { useDesignCopy } from "@/hooks/useDesignCopy";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useDemoContext, useDemoMutationGuard } from "@/demo";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Loader2 } from "lucide-react";
import { CoachLayout, type CoachTab } from "@/components/coach/CoachLayout";
import { OverviewTab } from "@/components/coach/overview/OverviewTab";
import { SquadTab } from "@/components/coach/squad/SquadTab";
import { StatisticsTab } from "@/components/coach/statistics/StatisticsTab";
import { MatchesTab } from "@/components/coach/matches/MatchesTab";
import { EvaluationsTab } from "@/components/coach/evaluations/EvaluationsTab";
import { TrainingTab } from "@/components/coach/training/TrainingTab";
import { InvitePlayersModal } from "@/components/ui/InvitePlayersModal";
import { CreateTeamModal } from "@/components/ui/CreateTeamModal";

export default function CoachDashboard() {
  const copy = useDesignCopy();
  const { t } = useTranslation("dashboard");
  const { user, isLoaded } = useCurrentUser();
  const demo = useDemoContext();
  const { guard } = useDemoMutationGuard();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const activeTab: CoachTab = ["overview", "squad", "statistics", "matches", "evaluations", "training"].includes(requestedTab || "") ? requestedTab as CoachTab : "overview";
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const openInvite = () => { if (!guard()) setShowInviteModal(true); };

  const handleTabChange = (tab: CoachTab) => {
    const p = new URLSearchParams(searchParams);
    p.set("tab", tab);
    setSearchParams(p, { replace: true });
  };

  const { data: coachProfile, isLoading: loadingProfile } = useQuery({
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

  const coachDbId = coachProfile?.id;

  const { data: teams = [], isLoading: loadingTeams } = useQuery({
    queryKey: ["coach-teams", coachDbId],
    queryFn: async () => {
      if (demo) return demo.teams;
      const { data, error } = await supabase
        .from("team_coaches")
        .select(`team_id, role, teams (id, name, age_group, season, invite_code, clubs (name))`)
        .eq("coach_id", coachDbId!);
      if (error) throw error;
      return (data || []).flatMap(ct => ct.teams ? [ct.teams] : []);
    },
    enabled: !!coachDbId || !!demo,
  });

  const teamId = teams.find((team: { id: string; }) => team.id === searchParams.get("team"))?.id || teams[0]?.id || undefined;
  const selectedTeam = teams.find((t) => t.id === teamId);

  const handleTeamChange = (newTeamId: string) => {
    const p = new URLSearchParams(searchParams);
    p.set("team", newTeamId);
    setSearchParams(p, { replace: true });
  };

  const handleDeleteTeam = async (teamId: string, teamName: string) => {
    if (guard() || !confirm(t("coach.confirms.deleteTeam", { name: teamName }))) return;
    try {
      const { error } = await supabase.from("teams").delete().eq("id", teamId);
      if (error) throw error;
      toast({ title: t("coach.toasts.deleteTeamSuccess.title"), description: t("coach.toasts.deleteTeamSuccess.description", { name: teamName }) });
      queryClient.invalidateQueries({ queryKey: ["coach-teams", coachDbId] });
    } catch (err: unknown) {
      toast({ title: t("coach.toasts.deleteTeamError.title"), description: getErrorMessage(err), variant: "destructive" });
    }
  };

  if (!isLoaded || loadingProfile || loadingTeams) {
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
    <main className="design-page design-coach" data-onboarding-dashboard={coachDbId ? "coach" : undefined} data-onboarding-has-team={selectedTeam ? "true" : "false"}>
      <header className="design-team-header" data-onboarding="coach-team">
        <div className="design-team-identity">
          <span className="design-eyebrow">{selectedTeam?.age_group || "Team"} · {selectedTeam?.clubs?.name || "Your academy"}</span>
          <div className="design-team-title">
            <h1>{selectedTeam?.name || "Your team"}</h1>
            <DropdownMenu>
              <DropdownMenuTrigger asChild><button className="design-button design-button-outline design-team-switch">{copy("SWITCH TEAM ↓")}</button></DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {teams.map((team: { id: string; name: string; }) => <DropdownMenuItem key={team.id} onSelect={() => handleTeamChange(team.id)}>{team.name}</DropdownMenuItem>)}
                {selectedTeam && <><DropdownMenuSeparator /><DropdownMenuItem className="text-destructive" onSelect={() => handleDeleteTeam(selectedTeam.id, selectedTeam.name)}>{t("coach.deleteTeam")}</DropdownMenuItem></>}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="design-team-actions">
          <button className="design-button design-button-outline" data-onboarding="coach-create" onClick={() => { if (!guard()) setShowCreateModal(true); }}>{t("coach.createTeam")}</button>
          <button className="design-button" data-onboarding="coach-invite" disabled={!selectedTeam} onClick={openInvite}>{t("coach.invitePlayers")}</button>
        </div>
      </header>
      <CoachLayout activeTab={activeTab} onTabChange={handleTabChange}>
        {activeTab === "overview" && <OverviewTab teamId={teamId} onInvite={openInvite} />}
        {activeTab === "squad" && <SquadTab teamId={teamId} />}
        {activeTab === "statistics" && <StatisticsTab teamId={teamId} />}
        {activeTab === "matches" && <MatchesTab teamId={teamId} />}
        {activeTab === "evaluations" && <EvaluationsTab teamId={teamId} />}
        {activeTab === "training" && <TrainingTab teamId={teamId} />}
      </CoachLayout>
      {showCreateModal && coachDbId && (
        <CreateTeamModal open={showCreateModal} onClose={() => setShowCreateModal(false)} coachId={coachDbId} onSuccess={() => queryClient.invalidateQueries({ queryKey: ["coach-teams", coachDbId] })} />
      )}
      {selectedTeam && <InvitePlayersModal open={showInviteModal} onClose={() => setShowInviteModal(false)} team={selectedTeam} onSuccess={() => queryClient.invalidateQueries({ queryKey: ["coach-squad", teamId] })} />}
    </main>
  );
}
