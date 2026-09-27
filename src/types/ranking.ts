export interface RankingPlayer {
  id: string;
  rank: number;
  name: string;
  age: number | null;
  position: string;
  team: string | null;
  city: string;
  country: string;
  avatarUrl: string | null;
  aiScore: number;
  growth: number | null;
  totalVideos: number;
  lastActive: string;
  trend: string;
}
