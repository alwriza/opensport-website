import { useState } from "react";
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

      const { data: existingClub } = await supabase
        .from('clubs')
        .select('id')
        .eq('name', formData.clubName)
        .single();

      if (existingClub) {
        clubId = existingClub.id;
      } else {
        const { data: newClub, error: clubError } = await supabase
          .from('clubs')
          .insert({ name: formData.clubName })
          .select('id')
          .single();

        if (clubError) throw clubError;
        clubId = newClub.id;
      }

      // 2. Create team
      const { data: newTeam, error: teamError } = await supabase
        .from('teams')
        .insert({
          club_id: clubId,
          name: formData.teamName,
          age_group: formData.ageGroup,
          season: formData.season
        })
        .select()
        .single();

      if (teamError) throw teamError;

      // 3. Add coach to team
      const { error: coachError } = await supabase
        .from('team_coaches')
        .insert({
          team_id: newTeam.id,
          coach_id: coachId,
          role: 'head_coach'
        });

      if (coachError) throw coachError;

      toast({
        title: "Team Created! 🎉",
        description: `${formData.teamName} has been created with invite code: ${newTeam.invite_code}`,
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
        title: "Error",
        description: error.message || "Could not create team",
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
          <DialogTitle>Create New Team</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clubName">Club / Academy Name *</Label>
            <Input
              id="clubName"
              value={formData.clubName}
              onChange={(e) => setFormData({ ...formData, clubName: e.target.value })}
              placeholder="e.g., FC Barcelona Academy"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="teamName">Team Name *</Label>
            <Input
              id="teamName"
              value={formData.teamName}
              onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
              placeholder="e.g., U16 Elite Squad"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ageGroup">Age Group *</Label>
            <Select
              value={formData.ageGroup}
              onValueChange={(value) => setFormData({ ...formData, ageGroup: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select age group" />
              </SelectTrigger>
              <SelectContent>
                {ageGroups.map(age => (
                  <SelectItem key={age} value={age}>{age}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="season">Season</Label>
            <Input
              id="season"
              value={formData.season}
              onChange={(e) => setFormData({ ...formData, season: e.target.value })}
              placeholder="2025-26"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Team
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}