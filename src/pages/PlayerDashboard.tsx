import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadarSkillChart } from "@/components/radar-chart";
import { mockPlayers, getPlayerSkillData, getTrainingTips } from "@/lib/mock-data";
import { Upload, User, Calendar, Trophy, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

export default function PlayerDashboard() {
  // For demo, we'll use the first player
  const [selectedPlayer] = useState(mockPlayers[0]);
  const skillData = getPlayerSkillData(selectedPlayer);
  const trainingTips = getTrainingTips(selectedPlayer.scores);
  
  const overallScore = Math.round(
    Object.values(selectedPlayer.scores).reduce((sum, score) => sum + score, 0) / 5
  );

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 80) return "text-blue-600";
    if (score >= 70) return "text-yellow-600";
    return "text-orange-600";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return "Excellent";
    if (score >= 80) return "Good";
    if (score >= 70) return "Average";
    return "Needs Work";
  };

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
                  <CardTitle className="text-2xl">{selectedPlayer.name}</CardTitle>
                  <CardDescription className="text-lg">
                    {selectedPlayer.position} • {selectedPlayer.academy}
                  </CardDescription>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-3xl font-bold ${getScoreColor(overallScore)}`}>
                  {overallScore}
                </div>
                <Badge variant="secondary">{getScoreBadge(overallScore)}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Age:</span>
                <div className="font-medium">{selectedPlayer.age} years</div>
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
                <span className="text-muted-foreground">Registered:</span>
                <div className="font-medium">{new Date(selectedPlayer.registeredDate).toLocaleDateString()}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Skills Radar Chart */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                Skills Analysis
              </CardTitle>
              <CardDescription>
                Your AI-evaluated performance across key football skills
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadarSkillChart data={skillData} />
            </CardContent>
          </Card>

          {/* Individual Scores */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Detailed Scores
              </CardTitle>
              <CardDescription>
                Breakdown of your skills with progress indicators
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries(selectedPlayer.scores).map(([skill, score]) => (
                <div key={skill} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium capitalize">
                      {skill.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span className={`font-bold ${getScoreColor(score)}`}>
                      {score}/100
                    </span>
                  </div>
                  <Progress value={score} className="h-2" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Training Recommendations */}
        <Card className="mt-8 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Personalized Training Tips
            </CardTitle>
            <CardDescription>
              AI-generated recommendations to improve your weakest areas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {trainingTips.map((tip, index) => (
                <div key={index} className="p-4 rounded-lg bg-muted">
                  <div className="font-medium text-primary mb-2">Tip #{index + 1}</div>
                  <p className="text-sm text-muted-foreground">{tip}</p>
                </div>
              ))}
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