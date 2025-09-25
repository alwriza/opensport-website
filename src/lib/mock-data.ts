export interface Player {
  id: string;
  name: string;
  age: number;
  position: string;
  academy: string;
  height: number;
  weight: number;
  scores: {
    speed: number;
    stamina: number;
    ballControl: number;
    tacticalVision: number;
    teamwork: number;
  };
  videoUrl?: string;
  registeredDate: string;
}

export const mockPlayers: Player[] = [
  {
    id: "1",
    name: "Marcus Silva",
    age: 17,
    position: "Forward",
    academy: "Barcelona Youth Academy",
    height: 175,
    weight: 68,
    scores: {
      speed: 88,
      stamina: 75,
      ballControl: 92,
      tacticalVision: 78,
      teamwork: 85,
    },
    registeredDate: "2024-01-15",
  },
  {
    id: "2",
    name: "Amelia Johnson",
    age: 16,
    position: "Midfielder",
    academy: "Manchester United Academy",
    height: 165,
    weight: 58,
    scores: {
      speed: 82,
      stamina: 94,
      ballControl: 89,
      tacticalVision: 91,
      teamwork: 96,
    },
    registeredDate: "2024-02-03",
  },
  {
    id: "3",
    name: "Carlos Rodriguez",
    age: 18,
    position: "Defender",
    academy: "Real Madrid Academy",
    height: 180,
    weight: 75,
    scores: {
      speed: 74,
      stamina: 87,
      ballControl: 76,
      tacticalVision: 93,
      teamwork: 88,
    },
    registeredDate: "2024-01-28",
  },
  {
    id: "4",
    name: "Sofia Andersson",
    age: 17,
    position: "Goalkeeper",
    academy: "Ajax Youth Academy",
    height: 170,
    weight: 62,
    scores: {
      speed: 68,
      stamina: 82,
      ballControl: 71,
      tacticalVision: 89,
      teamwork: 79,
    },
    registeredDate: "2024-02-10",
  },
  {
    id: "5",
    name: "Kwame Asante",
    age: 16,
    position: "Midfielder",
    academy: "Chelsea Academy",
    height: 172,
    weight: 65,
    scores: {
      speed: 91,
      stamina: 88,
      ballControl: 94,
      tacticalVision: 85,
      teamwork: 90,
    },
    registeredDate: "2024-02-18",
  },
];

export function getPlayerSkillData(player: Player) {
  return [
    { skill: "Speed", score: player.scores.speed, fullMark: 100 },
    { skill: "Stamina", score: player.scores.stamina, fullMark: 100 },
    { skill: "Ball Control", score: player.scores.ballControl, fullMark: 100 },
    { skill: "Tactical Vision", score: player.scores.tacticalVision, fullMark: 100 },
    { skill: "Teamwork", score: player.scores.teamwork, fullMark: 100 },
  ];
}

export function getTrainingTips(scores: Player['scores']): string[] {
  const tips: string[] = [];
  const skillMap = {
    speed: "Focus on sprint intervals and agility ladder drills to improve your explosive pace.",
    stamina: "Incorporate long-distance running and interval training to build endurance.",
    ballControl: "Practice close dribbling, juggling, and first-touch drills daily.",
    tacticalVision: "Study game footage and practice reading the field during small-sided games.",
    teamwork: "Work on communication skills and participate in more team building exercises.",
  };

  // Find the two lowest scores
  const scoresArray = Object.entries(scores).map(([skill, score]) => ({ skill, score }));
  scoresArray.sort((a, b) => a.score - b.score);
  
  // Add tips for the two lowest scores
  tips.push(skillMap[scoresArray[0].skill as keyof typeof skillMap]);
  if (scoresArray[1].score < 85) {
    tips.push(skillMap[scoresArray[1].skill as keyof typeof skillMap]);
  }

  // Add a general tip
  tips.push("Remember: consistency in training is key to improvement. Set daily goals and track your progress.");

  return tips.slice(0, 3);
}