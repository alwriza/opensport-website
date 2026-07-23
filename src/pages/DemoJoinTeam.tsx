import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDemoMutationGuard } from "@/demo";
import { useTranslation } from "react-i18next";
import { Users, CheckCircle, Loader2 } from "lucide-react";

const DEMO_TEAMS = [
  { id: "demo-team-1", name: "FC Eagles", age_group: "U19", club_name: "Eagles FC" },
  { id: "demo-team-2", name: "Thunderbolts", age_group: "U21", club_name: "Thunder FC" },
];

export default function DemoJoinTeam() {
  const { t } = useTranslation("team");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { guard } = useDemoMutationGuard();

  const [inviteCode, setInviteCode] = useState(searchParams.get('code') || "");
  const [loading, setLoading] = useState(false);
  const [teamInfo, setTeamInfo] = useState<typeof DEMO_TEAMS[0] | null>(null);

  const verifyInviteCode = () => {
    if (!inviteCode) return;
    setLoading(true);
    setTimeout(() => {
      setTeamInfo(DEMO_TEAMS[0]);
      setLoading(false);
    }, 500);
  };

  const joinTeam = () => {
    guard();
  };

  return (
    <div className="min-h-screen bg-gradient-card flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6" />
            {t("join.title")}
          </CardTitle>
          <CardDescription>
            {t("join.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!teamInfo ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="inviteCode">{t("join.label")}</Label>
                <Input
                  id="inviteCode"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder={t("join.placeholder")}
                  className="text-2xl font-bold text-center tracking-wider"
                  maxLength={6}
                />
              </div>
              <Button className="w-full" onClick={verifyInviteCode} disabled={loading || !inviteCode}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("join.button")}
              </Button>
            </>
          ) : (
            <>
              <div className="bg-muted rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-center mb-4">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">{t("join.joining")}</p>
                  <h3 className="text-xl font-bold">{teamInfo.name}</h3>
                  <p className="text-sm text-muted-foreground">{teamInfo.club_name} • {teamInfo.age_group}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setTeamInfo(null)}>
                  {t("join.cancel")}
                </Button>
                <Button className="flex-1" onClick={joinTeam}>
                  {t("join.confirm")}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
