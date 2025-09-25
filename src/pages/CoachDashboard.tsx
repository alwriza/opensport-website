import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockPlayers, Player } from "@/lib/mock-data";
import { Search, Filter, Users, TrendingUp, Trophy, User } from "lucide-react";

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
    if (score >= 90) return "text-green-600 bg-green-50";
    if (score >= 80) return "text-blue-600 bg-blue-50";
    if (score >= 70) return "text-yellow-600 bg-yellow-50";
    return "text-orange-600 bg-orange-50";
  };

  const getTopSkill = (player: Player) => {
    const entries = Object.entries(player.scores);
    const topSkill = entries.reduce((max, current) => current[1] > max[1] ? current : max);
    return { skill: topSkill[0], score: topSkill[1] };
  };

  return (
    <div className="min-h-screen bg-gradient-card">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Coach Dashboard</h1>
          <p className="text-muted-foreground">Discover and evaluate talented young players</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Players</p>
                  <p className="text-2xl font-bold text-primary">{mockPlayers.length}</p>
                </div>
                <Users className="h-8 w-8 text-primary/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Age</p>
                  <p className="text-2xl font-bold text-primary">
                    {Math.round(mockPlayers.reduce((sum, p) => sum + p.age, 0) / mockPlayers.length)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-primary/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Top Rated</p>
                  <p className="text-2xl font-bold text-primary">
                    {Math.max(...mockPlayers.map(getOverallScore))}
                  </p>
                </div>
                <Trophy className="h-8 w-8 text-primary/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Academies</p>
                  <p className="text-2xl font-bold text-primary">
                    {new Set(mockPlayers.map(p => p.academy)).size}
                  </p>
                </div>
                <Filter className="h-8 w-8 text-primary/60" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8 shadow-card">
          <CardHeader>
            <CardTitle>Filter & Search Players</CardTitle>
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
              <Card key={player.id} className="shadow-card hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{player.name}</CardTitle>
                        <CardDescription>{player.position} • Age {player.age}</CardDescription>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(overallScore)}`}>
                      {overallScore}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Academy</p>
                    <p className="font-medium">{player.academy}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Top Skill</p>
                    <div className="flex items-center justify-between">
                      <span className="capitalize font-medium">
                        {topSkill.skill.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <Badge variant="secondary">{topSkill.score}/100</Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="text-center p-2 bg-muted rounded">
                      <div className="font-medium">{player.height}cm</div>
                      <div className="text-muted-foreground">Height</div>
                    </div>
                    <div className="text-center p-2 bg-muted rounded">
                      <div className="font-medium">{player.weight}kg</div>
                      <div className="text-muted-foreground">Weight</div>
                    </div>
                  </div>

                  <Button className="w-full" variant="outline">
                    View Full Profile
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredAndSortedPlayers.length === 0 && (
          <Card className="shadow-card">
            <CardContent className="py-12 text-center">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No players found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filter criteria</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}