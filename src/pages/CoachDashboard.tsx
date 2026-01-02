import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockPlayers, Player } from "@/lib/mock-data";
import { Search, Filter, Users, TrendingUp, Trophy, User, MapPin, Calendar } from "lucide-react";

export default function CoachDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [positionFilter, setPositionFilter] = useState("all");
  const [sortBy, setSortBy] = useState("overall");

  const filteredAndSortedPlayers = useMemo(() => {
    let filtered = mockPlayers.filter(player => {
      const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          player.academy.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPosition = positionFilter === "all" || player.position === positionFilter;
      return matchesSearch && matchesPosition;
    });

    filtered.sort((a, b) => {
      if (sortBy === "overall") {
        const aOverall = Object.values(a.scores).reduce((sum, score) => sum + score, 0) / 5;
        const bOverall = Object.values(b.scores).reduce((sum, score) => sum + score, 0) / 5;
        return bOverall - aOverall;
      }
      if (sortBy === "age") return a.age - b.age;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return 0;
    });

    return filtered;
  }, [searchTerm, positionFilter, sortBy]);

  const positions = [...new Set(mockPlayers.map(player => player.position))];

  const getOverallScore = (player: Player) => {
    return Math.round(Object.values(player.scores).reduce((sum, score) => sum + score, 0) / 5);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "bg-primary text-primary-foreground";
    if (score >= 80) return "bg-success text-white";
    if (score >= 70) return "bg-warning text-black";
    return "bg-muted text-muted-foreground";
  };

  const getScoreGrade = (score: number) => {
    if (score >= 90) return "Elite";
    if (score >= 80) return "Excellent";
    if (score >= 70) return "Good";
    return "Developing";
  };

  const getTopSkill = (player: Player) => {
    const entries = Object.entries(player.scores);
    const topSkill = entries.reduce((max, current) => current[1] > max[1] ? current : max);
    return { skill: topSkill[0], score: topSkill[1] };
  };

  const formatSkillName = (skill: string) => {
    return skill
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="min-h-screen bg-gradient-card">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2 hero-title">COACH DASHBOARD</h1>
          <p className="text-muted-foreground text-lg">Discover and evaluate talented young players</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-card border-2 border-primary/20 hover:border-primary/40 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">Total Players</p>
                  <p className="text-3xl font-bold text-primary">{mockPlayers.length}</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-2 border-primary/20 hover:border-primary/40 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">Avg Age</p>
                  <p className="text-3xl font-bold text-primary">
                    {Math.round(mockPlayers.reduce((sum, p) => sum + p.age, 0) / mockPlayers.length)}
                  </p>
                </div>
                <div className="p-3 bg-primary/10 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-2 border-primary/20 hover:border-primary/40 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">Top Rated</p>
                  <p className="text-3xl font-bold text-primary">
                    {Math.max(...mockPlayers.map(getOverallScore))}
                  </p>
                </div>
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Trophy className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-2 border-primary/20 hover:border-primary/40 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">Academies</p>
                  <p className="text-3xl font-bold text-primary">
                    {new Set(mockPlayers.map(p => p.academy)).size}
                  </p>
                </div>
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Filter className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8 shadow-card border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="text-2xl">Filter & Search Players</CardTitle>
            <CardDescription>Find the perfect players for your team</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or academy..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={positionFilter} onValueChange={setPositionFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Positions</SelectItem>
                  {positions.map(position => (
                    <SelectItem key={position} value={position}>{position}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overall">Overall Score</SelectItem>
                  <SelectItem value="age">Age</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Players Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedPlayers.map((player) => {
            const overallScore = getOverallScore(player);
            const topSkill = getTopSkill(player);
            
            return (
              <Card 
                key={player.id} 
                className="shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 border-2 border-primary/10 hover:border-primary/30 bg-card/50 backdrop-blur-sm overflow-hidden"
              >
                {/* Header with Score Badge */}
                <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 border-b border-primary/10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center ring-2 ring-primary/30">
                        <User className="h-7 w-7 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-foreground mb-1">{player.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="outline" className="border-primary/50 text-primary font-medium">
                            {player.position}
                          </Badge>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {player.age} yrs
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className={`px-4 py-2 rounded-lg font-bold text-xl ${getScoreColor(overallScore)}`}>
                        {overallScore}
                      </div>
                      <span className="text-xs text-muted-foreground font-medium">
                        {getScoreGrade(overallScore)}
                      </span>
                    </div>
                  </div>
                </div>

                <CardContent className="p-6 space-y-5">
                  {/* Academy */}
                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Academy</p>
                      <p className="font-semibold text-foreground">{player.academy}</p>
                    </div>
                  </div>
                  
                  {/* Top Skill */}
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Best Attribute</p>
                    <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/20">
                      <span className="font-bold text-foreground">
                        {formatSkillName(topSkill.skill)}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary rounded-full transition-all" 
                            style={{ width: `${topSkill.score}%` }}
                          />
                        </div>
                        <span className="font-bold text-primary min-w-[3rem] text-right">
                          {topSkill.score}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Physical Stats */}
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Physical</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-muted/50 rounded-lg p-3 text-center border border-border">
                        <div className="text-2xl font-bold text-foreground mb-1">{player.height}</div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide">cm</div>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3 text-center border border-border">
                        <div className="text-2xl font-bold text-foreground mb-1">{player.weight}</div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide">kg</div>
                      </div>
                    </div>
                  </div>

                  {/* All Skills Overview */}
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Skills Overview</p>
                    <div className="space-y-2">
                      {Object.entries(player.scores).map(([skill, score]) => (
                        <div key={skill} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{formatSkillName(skill)}</span>
                          <span className="font-semibold text-foreground">{score}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button 
                    className="w-full bg-primary hover:bg-primary-dark text-primary-foreground font-semibold"
                    size="lg"
                  >
                    View Full Profile
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredAndSortedPlayers.length === 0 && (
          <Card className="shadow-card border-2 border-primary/20">
            <CardContent className="py-16 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-foreground">No players found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}