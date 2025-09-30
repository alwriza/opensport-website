import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadarSkillChart } from "@/components/radar-chart";
import { Upload, User, Trophy, TrendingUp, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface PlayerData {
  id: string;
  full_name: string;
  email: string;
  date_of_birth: string;
  nationality: string;
  position: string;
  academy: string;
  height: number;
  weight: number;
  video_url: string | null;
  created_at: string;
}

export default function PlayerDashboard() {
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      const { data, error } = await supabase
        .from('player_registrations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPlayers(data || []);
    } catch (error) {
      console.error('Error fetching players:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-card flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-card flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <User className="h-12 w-12 text-muted-foreground mx-auto" />
            <h2 className="text-xl font-bold">No Players Yet</h2>
            <p className="text-muted-foreground">Register your first player to see their dashboard.</p>
            <Button asChild>
              <Link to="/register">Register Now</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedPlayer = players[0];
  const age = new Date().getFullYear() - new Date(selectedPlayer.date_of_birth).getFullYear();

  return (
    <div className="min-h-screen bg-gradient-card">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Player Dashboard</h1>
          <p className="text-muted-foreground">Track your progress and get personalized training recommendations</p>
        </div>

        {/* Player Profile Card */}
        <Card className="mb-8 shadow-card">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl">{selectedPlayer.full_name}</CardTitle>
                  <CardDescription className="text-lg">
                    {selectedPlayer.position} • {selectedPlayer.academy}
                  </CardDescription>
                </div>
              </div>
              <Badge variant="secondary">Active Player</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Age:</span>
                <div className="font-medium">{age} years</div>
              </div>
              <div>
                <span className="text-muted-foreground">Height:</span>
                <div className="font-medium">{selectedPlayer.height} cm</div>
              </div>
              <div>
                <span className="text-muted-foreground">Weight:</span>
                <div className="font-medium">{selectedPlayer.weight} kg</div>
              </div>
              <div>
                <span className="text-muted-foreground">Nationality:</span>
                <div className="font-medium">{selectedPlayer.nationality}</div>
              </div>
            </div>
            {selectedPlayer.video_url && (
              <div className="mt-4">
                <span className="text-sm text-muted-foreground">Training Video:</span>
                <div className="mt-2">
                  <video controls className="w-full rounded-lg max-h-96">
                    <source src={selectedPlayer.video_url} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Analysis Coming Soon */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              AI Analysis
            </CardTitle>
            <CardDescription>
              Your detailed skill analysis will appear here once processed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">Analysis in Progress</p>
              <p className="text-muted-foreground">
                Our AI is analyzing your training video. This typically takes 24-48 hours.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Upload New Video */}
        <Card className="mt-8 shadow-card border-dashed border-2">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
              <div>
                <h3 className="text-lg font-medium mb-2">Upload New Training Video</h3>
                <p className="text-muted-foreground mb-4">
                  Get fresh AI analysis by uploading a new training or match clip
                </p>
                <Button asChild>
                  <Link to="/register">Upload Video</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}