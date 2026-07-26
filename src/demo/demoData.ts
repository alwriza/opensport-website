import { Database } from "@/integrations/supabase/types";

export type DemoSkill = NonNullable<Database["public"]["Tables"]["skills"]["Row"]>;
export type DemoSkillLevel = NonNullable<Database["public"]["Tables"]["skill_levels"]["Row"]> & { skills?: DemoSkill };
export type DemoPlayerProgress = { total_xp: number; level: number; current_streak: number; longest_streak: number; last_activity_date: string };
export type DemoSkillProgress = { skill_id: string; completed_levels: string[]; is_completed: boolean };
export type DemoVideo = NonNullable<Database["public"]["Tables"]["videos"]["Row"]>;
export type DemoAnalysis = NonNullable<Database["public"]["Tables"]["analyses"]["Row"]>;
export type DemoCoachTeam = { id: string; name: string; age_group: string; season: string; invite_code: string; clubs: { name: string } };
export type DemoRosterPlayer = { id: string; name: string; age: number; position: string; club: string; height: number; weight: number; roster_id: string; jersey_number: number; latest_score: number | null; last_upload: string | null; recent_scores: number[]; trend: number; metrics: { stability: number; power: number; technique: number; balance: number }; status: string };
export type DemoPlayerStat = { id: string; user_id: string; highest_rating: number; last_rating: number; shots_count: number; users: { name: string; avatar_url: string } };

export interface DemoData {
  user: { id: string; email: string; firstName: string; lastName: string; username: string; imageUrl: string };
  coachProfile: { id: string; auth_user_id: string; name: string; email: string; role: string; weight: number; terms_accepted_at: string; privacy_accepted_at: string };
  videos: DemoVideo[];
  analyses: DemoAnalysis[];
  latestAnalysis: DemoAnalysis;
  playerStats: DemoPlayerStat[];
  trainingStats: { progress: DemoPlayerProgress; skills: DemoSkillProgress[] };
  skills: DemoSkill[];
  skillLevels: DemoSkillLevel[];
  myTeams: { roster_id: string; team_id: string; team_name: string; age_group: string; club_name: string; status: string }[];
  teams: DemoCoachTeam[];
  roster: DemoRosterPlayer[];
  latestRecommendations: DemoSkillLevel[];
}

const SKILLS_DATA: DemoSkill[] = [
  { id: "skill-1", name: "Passing Accuracy", category: "passing", description: "Master short and long passing techniques", icon: "🎯", order_index: 1 },
  { id: "skill-2", name: "First Touch", category: "technical", description: "Improve ball control and first touch", icon: "⚡", order_index: 2 },
  { id: "skill-3", name: "Ball Control Basics", category: "technical", description: "Develop fundamental ball control skills", icon: "🦶", order_index: 3 },
  { id: "skill-4", name: "Speed Dribbling", category: "dribbling", description: "Enhance dribbling speed and agility", icon: "💨", order_index: 4 },
  { id: "skill-5", name: "Shooting Precision", category: "shooting", description: "Improve shooting accuracy and power", icon: "⚽", order_index: 5 },
  { id: "skill-6", name: "Defensive Positioning", category: "defensive", description: "Learn proper defensive stance and positioning", icon: "🛡️", order_index: 6 },
  { id: "skill-7", name: "Speed & Acceleration", category: "physical", description: "Build explosive speed and acceleration", icon: "🏃", order_index: 7 },
  { id: "skill-8", name: "Balance & Core", category: "physical", description: "Strengthen balance and core stability", icon: "⚖️", order_index: 8 },
  { id: "skill-9", name: "1v1 Attacking", category: "attacking", description: "Master one-on-one attacking moves", icon: "⚔️", order_index: 9 },
  { id: "skill-10", name: "Game Awareness", category: "mental", description: "Develop tactical awareness and decision making", icon: "🧠", order_index: 10 },
];

const SKILL_LEVELS_DATA: DemoSkillLevel[] = [
  { id: "sl-1", skill_id: "skill-1", level_name: "beginner", level_order: 1, youtube_url: "https://www.youtube.com/watch?v=F8LCioV8z_s", video_title: "5 Soccer Passing Drills | adidas", duration_minutes: 12, target_metrics: ["technique"], xp_reward: 50 },
  { id: "sl-2", skill_id: "skill-1", level_name: "intermediate", level_order: 2, youtube_url: "https://www.youtube.com/watch?v=-V88Iy1X-is", video_title: "New Passing Drills to Improve Speed & Accuracy", duration_minutes: 15, target_metrics: ["technique"], xp_reward: 100 },
  { id: "sl-3", skill_id: "skill-1", level_name: "advanced", level_order: 3, youtube_url: "https://www.youtube.com/watch?v=0kGgL_aglEE", video_title: "Passing & 1st Touch Drill (ADVANCED)", duration_minutes: 10, target_metrics: ["technique"], xp_reward: 150 },
  { id: "sl-4", skill_id: "skill-2", level_name: "beginner", level_order: 1, youtube_url: "https://www.youtube.com/watch?v=ud84rp3Vphs", video_title: "10 Exercises To Master Your First Touch", duration_minutes: 14, target_metrics: ["technique"], xp_reward: 50 },
  { id: "sl-5", skill_id: "skill-2", level_name: "intermediate", level_order: 2, youtube_url: "https://www.youtube.com/watch?v=el7QvVnprOk", video_title: "Perfect Your First Touch | 5 First Touch Exercises", duration_minutes: 12, target_metrics: ["technique"], xp_reward: 100 },
  { id: "sl-6", skill_id: "skill-2", level_name: "advanced", level_order: 3, youtube_url: "https://www.youtube.com/watch?v=8xfWkNLdVYE", video_title: "How I Coach First Touch Under Pressure", duration_minutes: 16, target_metrics: ["technique", "balance"], xp_reward: 150 },
  { id: "sl-7", skill_id: "skill-3", level_name: "beginner", level_order: 1, youtube_url: "https://www.youtube.com/watch?v=e5RxAJM-oxc", video_title: "10 EASY Ball Mastery Exercises For Beginners", duration_minutes: 10, target_metrics: ["technique"], xp_reward: 50 },
  { id: "sl-8", skill_id: "skill-3", level_name: "intermediate", level_order: 2, youtube_url: "https://www.youtube.com/watch?v=Fj3Jsn0Pa7c", video_title: "10 Close Control Dribbling Exercises", duration_minutes: 15, target_metrics: ["technique", "balance"], xp_reward: 100 },
  { id: "sl-9", skill_id: "skill-3", level_name: "advanced", level_order: 3, youtube_url: "https://www.youtube.com/watch?v=ezi5VhbOgsQ", video_title: "Tight Space Control Training Drills", duration_minutes: 12, target_metrics: ["technique", "balance"], xp_reward: 150 },
  { id: "sl-10", skill_id: "skill-4", level_name: "beginner", level_order: 1, youtube_url: "https://www.youtube.com/watch?v=QqjaavLXdHs", video_title: "5 Close Control Dribbling Drills", duration_minutes: 10, target_metrics: ["technique"], xp_reward: 50 },
  { id: "sl-11", skill_id: "skill-4", level_name: "intermediate", level_order: 2, youtube_url: "https://www.youtube.com/watch?v=NMfLJynwyTk", video_title: "32 Close Control Dribbling Cone Drills", duration_minutes: 18, target_metrics: ["technique", "power"], xp_reward: 100 },
  { id: "sl-12", skill_id: "skill-4", level_name: "advanced", level_order: 3, youtube_url: "https://www.youtube.com/watch?v=i3jSMolxtsE", video_title: "How To Train Solo Like a Pro | Dribbling & Ball Mastery", duration_minutes: 20, target_metrics: ["technique", "power"], xp_reward: 150 },
  { id: "sl-13", skill_id: "skill-5", level_name: "beginner", level_order: 1, youtube_url: "https://www.youtube.com/watch?v=ARGE2_MjaNY", video_title: "Passing - Technique - Shooting - Soccer Drills", duration_minutes: 12, target_metrics: ["technique", "power"], xp_reward: 50 },
  { id: "sl-14", skill_id: "skill-5", level_name: "intermediate", level_order: 2, youtube_url: "https://www.youtube.com/watch?v=BdCBar17CTU", video_title: "Striker Masterclass | 5 Drills To Improve Finishing", duration_minutes: 16, target_metrics: ["technique", "power"], xp_reward: 100 },
  { id: "sl-15", skill_id: "skill-5", level_name: "advanced", level_order: 3, youtube_url: "https://www.youtube.com/watch?v=BdCBar17CTU", video_title: "Advanced Striker Training", duration_minutes: 16, target_metrics: ["technique", "power"], xp_reward: 150 },
  { id: "sl-16", skill_id: "skill-6", level_name: "beginner", level_order: 1, youtube_url: "https://www.youtube.com/watch?v=FS1LrWzSSmQ", video_title: "LOADS OF SOCCER DRILLS FOR BEGINNERS", duration_minutes: 15, target_metrics: ["balance", "technique"], xp_reward: 50 },
  { id: "sl-17", skill_id: "skill-6", level_name: "intermediate", level_order: 2, youtube_url: "https://www.youtube.com/watch?v=0F_sLDwOMNc", video_title: "25 Partner Passing Drills | PRO LEVEL", duration_minutes: 18, target_metrics: ["balance", "technique"], xp_reward: 100 },
  { id: "sl-18", skill_id: "skill-6", level_name: "advanced", level_order: 3, youtube_url: "https://www.youtube.com/watch?v=h3o-MKSehJA", video_title: "Full Partner Training Session", duration_minutes: 20, target_metrics: ["balance", "technique"], xp_reward: 150 },
  { id: "sl-19", skill_id: "skill-7", level_name: "beginner", level_order: 1, youtube_url: "https://www.youtube.com/watch?v=rSlJU8cO9js", video_title: "Fast Feet & Agility Training", duration_minutes: 12, target_metrics: ["power"], xp_reward: 50 },
  { id: "sl-20", skill_id: "skill-7", level_name: "intermediate", level_order: 2, youtube_url: "https://www.youtube.com/watch?v=nckkvbxgnUM", video_title: "Quick 15 Minute Soccer Training | Ball Control", duration_minutes: 15, target_metrics: ["power"], xp_reward: 100 },
  { id: "sl-21", skill_id: "skill-7", level_name: "advanced", level_order: 3, youtube_url: "https://www.youtube.com/watch?v=5IR4Ecfssyw", video_title: "Advanced Speed Training", duration_minutes: 14, target_metrics: ["power"], xp_reward: 150 },
  { id: "sl-22", skill_id: "skill-8", level_name: "beginner", level_order: 1, youtube_url: "https://www.youtube.com/watch?v=i3jSMolxtsE", video_title: "How To Train Solo Like a Pro", duration_minutes: 20, target_metrics: ["stability", "balance"], xp_reward: 50 },
  { id: "sl-23", skill_id: "skill-8", level_name: "intermediate", level_order: 2, youtube_url: "https://www.youtube.com/watch?v=NMfLJynwyTk", video_title: "10 Close Control Dribbling Cone Drills", duration_minutes: 18, target_metrics: ["stability", "balance"], xp_reward: 100 },
  { id: "sl-24", skill_id: "skill-8", level_name: "advanced", level_order: 3, youtube_url: "https://www.youtube.com/watch?v=ezi5VhbOgsQ", video_title: "Tight Space Control Training Drills", duration_minutes: 12, target_metrics: ["stability", "balance"], xp_reward: 150 },
  { id: "sl-25", skill_id: "skill-9", level_name: "beginner", level_order: 1, youtube_url: "https://www.youtube.com/watch?v=QqjaavLXdHs", video_title: "5 Close Control Dribbling Drills", duration_minutes: 10, target_metrics: ["technique"], xp_reward: 50 },
  { id: "sl-26", skill_id: "skill-9", level_name: "intermediate", level_order: 2, youtube_url: "https://www.youtube.com/watch?v=NMfLJynwyTk", video_title: "32 Close Control Dribbling Cone Drills", duration_minutes: 18, target_metrics: ["technique", "power"], xp_reward: 100 },
  { id: "sl-27", skill_id: "skill-9", level_name: "advanced", level_order: 3, youtube_url: "https://www.youtube.com/watch?v=i3jSMolxtsE", video_title: "How To Train Solo Like a Pro", duration_minutes: 20, target_metrics: ["technique", "power"], xp_reward: 150 },
  { id: "sl-28", skill_id: "skill-10", level_name: "beginner", level_order: 1, youtube_url: "https://www.youtube.com/watch?v=FS1LrWzSSmQ", video_title: "LOADS OF SOCCER DRILLS FOR BEGINNERS", duration_minutes: 15, target_metrics: ["technique"], xp_reward: 50 },
  { id: "sl-29", skill_id: "skill-10", level_name: "intermediate", level_order: 2, youtube_url: "https://www.youtube.com/watch?v=-F6OecCUHLA", video_title: "Passing & 1st Touch Combinations", duration_minutes: 12, target_metrics: ["technique"], xp_reward: 100 },
  { id: "sl-30", skill_id: "skill-10", level_name: "advanced", level_order: 3, youtube_url: "https://www.youtube.com/watch?v=moLy3vQ1q_E", video_title: "4v2 Rondo | Possession Exercise", duration_minutes: 14, target_metrics: ["technique", "balance"], xp_reward: 150 },
];

export const DEMO_DATA: DemoData = {
  user: {
    id: "demo-user-id",
    email: "demo@opensport.app",
    firstName: "Demo",
    lastName: "Player",
    username: "demo_player",
    imageUrl: "",
  },
  coachProfile: {
    id: "coach-demo-id",
    auth_user_id: "demo-user-id",
    name: "Demo Coach",
    email: "coach@demo.com",
    role: "head_coach",
    age: 25,
    position: "Forward",
    club: "OpenSport FC",
    height: 178,
    weight: 75,
    terms_accepted_at: new Date().toISOString(),
    privacy_accepted_at: new Date().toISOString(),
  },
  videos: [
    {
      id: "demo-video-1",
      user_id: "demo-user-id",
      storage_path: "bd5aa96f-6963-4067-99c4-80e474064a3f.mp4",
      filename: "training-session-1.mp4",
      file_size_mb: 15.2,
      status: "completed",
      uploaded_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: "demo-video-2",
      user_id: "demo-user-id",
      storage_path: "bd5aa96f-6963-4067-99c4-80e474064a3f.mp4",
      filename: "match-highlight.mp4",
      file_size_mb: 22.8,
      status: "completed",
      uploaded_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
    {
      id: "demo-video-3",
      user_id: "demo-user-id",
      storage_path: "bd5aa96f-6963-4067-99c4-80e474064a3f.mp4",
      filename: "drill-session.mp4",
      file_size_mb: 8.5,
      status: "processing",
      uploaded_at: new Date(Date.now() - 3600000).toISOString(),
    },
  ],
  analyses: [
    {
      id: "demo-analysis-1",
      user_id: "demo-user-id",
      video_id: "demo-video-1",
      stability: 78,
      power: 65,
      technique: 82,
      balance: 71,
      overall: 74,
      feedback: "Good form overall. Focus on generating more power from your hips.",
      tags: ["right-foot", "instep-drive", "moderate-accuracy"],
      processing_time_ms: 3200,
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: "demo-analysis-2",
      user_id: "demo-user-id",
      video_id: "demo-video-2",
      stability: 85,
      power: 72,
      technique: 79,
      balance: 80,
      overall: 79,
      feedback: "Great improvement in stability. Keep working on power generation.",
      tags: ["left-foot", "volley", "high-accuracy"],
      processing_time_ms: 2800,
      created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
  ],
  latestAnalysis: {
    id: "demo-analysis-1",
    user_id: "demo-user-id",
    video_id: "demo-video-1",
    stability: 78,
    power: 65,
    technique: 82,
    balance: 71,
    overall: 74,
    feedback: "Good form overall. Focus on generating more power from your hips.",
    tags: ["right-foot", "instep-drive", "moderate-accuracy"],
    processing_time_ms: 3200,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  playerStats: [
    { id: "stat-demo-1", user_id: "demo-user-id", highest_rating: 82.5, last_rating: 74.0, shots_count: 24, users: { name: "Demo Player", avatar_url: "" } },
    { id: "stat-demo-2", user_id: "demo-other-1", highest_rating: 79.3, last_rating: 77.1, shots_count: 18, users: { name: "Marcus Silva", avatar_url: "" } },
    { id: "stat-demo-3", user_id: "demo-other-2", highest_rating: 76.8, last_rating: 75.0, shots_count: 31, users: { name: "Amelia Johnson", avatar_url: "" } },
    { id: "stat-demo-4", user_id: "demo-other-3", highest_rating: 74.2, last_rating: 72.5, shots_count: 15, users: { name: "Carlos Rodriguez", avatar_url: "" } },
    { id: "stat-demo-5", user_id: "demo-other-4", highest_rating: 71.0, last_rating: 70.2, shots_count: 22, users: { name: "Sofia Andersson", avatar_url: "" } },
    { id: "stat-demo-6", user_id: "demo-other-5", highest_rating: 0, last_rating: 0, shots_count: 0, users: { name: "Kwame Asante", avatar_url: "" } },
  ],
  trainingStats: {
    progress: {
      total_xp: 1250,
      level: 3,
      current_streak: 5,
      longest_streak: 12,
      last_activity_date: new Date().toLocaleDateString("en-CA"),
    },
    skills: [
      { skill_id: "skill-1", completed_levels: ["beginner", "intermediate"], is_completed: false },
      { skill_id: "skill-2", completed_levels: ["beginner"], is_completed: false },
      { skill_id: "skill-5", completed_levels: ["beginner"], is_completed: false },
      { skill_id: "skill-8", completed_levels: ["beginner"], is_completed: false },
    ],
  },
  skills: SKILLS_DATA,
  skillLevels: SKILL_LEVELS_DATA.map(sl => ({
    ...sl,
    skills: SKILLS_DATA.find(s => s.id === sl.skill_id),
  })),
  myTeams: [
    { roster_id: "roster-demo-1", team_id: "team-demo-1", team_name: "OpenSport FC U19", age_group: "U19", club_name: "OpenSport FC", status: "active" },
    { roster_id: "roster-demo-2", team_id: "team-demo-2", team_name: "OpenSport FC U21", age_group: "U21", club_name: "OpenSport FC Academy", status: "pending" },
  ],
  teams: [
    { id: "team-demo-1", name: "OpenSport FC U19", age_group: "U19", season: "2025/2026", invite_code: "OSFC-U19", clubs: { name: "OpenSport FC" } },
    { id: "team-demo-2", name: "OpenSport FC U21", age_group: "U21", season: "2025/2026", invite_code: "OSFC-U21", clubs: { name: "OpenSport FC Academy" } },
  ],
  roster: [
    { id: "roster-player-1", name: "Marcus Silva", age: 17, position: "Forward", club: "OpenSport FC Academy", height: 175, weight: 68, roster_id: "roster-1", jersey_number: 9, latest_score: 82.5, last_upload: new Date(Date.now() - 86400000).toISOString(), recent_scores: [82.5, 78.3, 80.1], trend: 4.2, metrics: { stability: 80, power: 85, technique: 82, balance: 78 }, status: "active" },
    { id: "roster-player-2", name: "Amelia Johnson", age: 16, position: "Midfielder", club: "OpenSport FC Academy", height: 165, weight: 58, roster_id: "roster-2", jersey_number: 8, latest_score: 79.3, last_upload: new Date(Date.now() - 86400000 * 2).toISOString(), recent_scores: [79.3, 76.5, 77.8], trend: 2.8, metrics: { stability: 82, power: 76, technique: 88, balance: 80 }, status: "active" },
    { id: "roster-player-3", name: "Carlos Rodriguez", age: 18, position: "Defender", club: "OpenSport FC Academy", height: 180, weight: 75, roster_id: "roster-3", jersey_number: 4, latest_score: 76.8, last_upload: new Date(Date.now() - 86400000 * 3).toISOString(), recent_scores: [76.8, 74.2, 75.5], trend: 2.6, metrics: { stability: 88, power: 72, technique: 74, balance: 85 }, status: "active" },
    { id: "roster-player-4", name: "Sofia Andersson", age: 17, position: "Goalkeeper", club: "OpenSport FC Academy", height: 170, weight: 62, roster_id: "roster-4", jersey_number: 1, latest_score: 74.2, last_upload: new Date(Date.now() - 86400000 * 4).toISOString(), recent_scores: [74.2, 72.0, 73.1], trend: 2.2, metrics: { stability: 90, power: 68, technique: 71, balance: 82 }, status: "active" },
    { id: "roster-player-5", name: "Kwame Asante", age: 16, position: "Midfielder", club: "OpenSport FC Academy", height: 172, weight: 65, roster_id: "roster-5", jersey_number: 10, latest_score: null, last_upload: null, recent_scores: [], trend: 0, metrics: { stability: 0, power: 0, technique: 0, balance: 0 }, status: "pending" },
  ],
  latestRecommendations: SKILL_LEVELS_DATA.slice(0, 3).map(sl => ({
    ...sl,
    skills: SKILLS_DATA.find(s => s.id === sl.skill_id),
  })),
};
