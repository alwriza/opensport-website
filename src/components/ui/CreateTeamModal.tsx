import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface CreateTeamModalProps {
  open: boolean;
  onClose: () => void;
  coachId: string;
  onSuccess: () => void;
}

export function CreateTeamModal({ open, onClose, coachId, onSuccess }: CreateTeamModalProps) {
  const { t } = useTranslation("team");
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    clubName: "",
    teamName: "",
    ageGroup: "",
    season: "2025-26"
  });

  const ageGroups = ["U10", "U12", "U14", "U16", "U18", "U20", "Senior"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Create or find club
      let clubId: string;

      const { data: existingClub } = await (supabase
        .from('clubs') as any)
        .select('id')
        .eq('name', formData.clubName)
        .single();

      if (existingClub) {
        clubId = (existingClub as any).id;
      } else {
        const { data: newClub, error: clubError } = await (supabase
          .from('clubs') as any)
          .insert({ name: formData.clubName })
          .select('id')
          .single();

        if (clubError) throw clubError;
        if (!newClub) throw new Error("Could not create club");
        clubId = (newClub as any).id;
      }

      // 2. Create team
      const { data: newTeam, error: teamError } = await (supabase
        .from('teams') as any)
        .insert({
          club_id: clubId,
          name: formData.teamName,
          age_group: formData.ageGroup,
          season: formData.season
        })
        .select()
        .single();

      if (teamError) throw teamError;
      if (!newTeam) throw new Error("Could not create team"); // Ensure newTeam is not null

      // 3. Add coach to team
      const { error: coachError } = await (supabase
        .from('team_coaches') as any)
        .insert({
          team_id: (newTeam as any).id,
          coach_id: coachId,
          role: 'head_coach'
        });

      if (coachError) throw coachError;

      toast({
        title: t("createTeamModal.success.title"),
        description: t("createTeamModal.success.description", { teamName: formData.teamName, code: (newTeam as any).invite_code }),
      });

      onSuccess();
      onClose();

      // Reset form
      setFormData({
        clubName: "",
        teamName: "",
        ageGroup: "",
        season: "2025-26"
      });

    } catch (error: any) {
      console.error('Error creating team:', error);
      toast({
        title: t("createTeamModal.errors.title"),
        description: error.message || t("createTeamModal.errors.createFailed"),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("createTeamModal.title")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clubName">{t("createTeamModal.clubName")}</Label>
            <Input
              id="clubName"
              value={formData.clubName}
              onChange={(e) => setFormData({ ...formData, clubName: e.target.value })}
              placeholder={t("createTeamModal.clubPlaceholder")}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="teamName">{t("createTeamModal.teamName")}</Label>
            <Input
              id="teamName"
              value={formData.teamName}
              onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
              placeholder={t("createTeamModal.teamPlaceholder")}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ageGroup">{t("createTeamModal.ageGroup")}</Label>
            <Select
              value={formData.ageGroup}
              onValueChange={(value) => setFormData({ ...formData, ageGroup: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder={t("createTeamModal.selectAge")} />
              </SelectTrigger>
              <SelectContent>
                {ageGroups.map(age => (
                  <SelectItem key={age} value={age}>{age}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="season">{t("createTeamModal.season")}</Label>
            <Input
              id="season"
              value={formData.season}
              onChange={(e) => setFormData({ ...formData, season: e.target.value })}
              placeholder="2025-26"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              {t("createTeamModal.cancel")}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("createTeamModal.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}