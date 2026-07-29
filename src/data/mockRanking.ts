export interface MockPlayer {
    id: string;
    rank: number;
    name: string;
    age: number;
    position: "GK" | "DEF" | "MID" | "FWD";
    team: string | null;
    city: string;
    country: string;
    avatarUrl: string | null;
    aiScore: number;
    growth: number;
    totalVideos: number;
    lastActive: string;
    trend: "up" | "down" | "stable";
}

const firstNames = [
    "╨Р╨▒╤Л╨╗╨░╨╣", "╨Р╨╗╨╕╤И╨╡╤А", "╨Р╤А╨╝╨░╨╜", "╨С╨░╤В╤Л╤А", "╨Ф╨░╨╝╨╕╤А", "╨Ф╨░╨╜╨╕╤П╤А", "╨Х╤А╨╢╨░╨╜", "╨Х╤А╨╜╨░╤А",
    "╨Ц╨░╨╜╨┤╨╛╤Б", "╨Ц╨░╤Б╥▒╨╗╨░╨╜", "╨Ш╨╗╤М╤П╤Б", "╨Ь╨░╨║╤Б╨░╤В", "╨Ь╨░╤А╨░╤В", "╨Э╥▒╤А╨╗╨░╨╜", "╨Э╥▒╤А╨╢╨░╨╜", "╨Ю╨╗╨╢╨░╤Б",
    "╨а╨░╤Е╨░╤В", "╨а╤Г╤Б╨╗╨░╨╜", "╨б╨░╨╜╨╢╨░╤А", "╨в╨╕╨╝╤Г╤А", "╨в╨░╨╗╨│╨░╤В", "╨в╨╡╨╝╨╕╤А╨╗╨░╨╜", "╨Р╨╖╨░╨╝╨░╤В", "╨Р╤Б╤Е╨░╤В",
    "╨С╨╡╨║╨╢╨░╨╜", "╥Т╨░╨╗╤Л╨╝╨╢╨░╨╜", "╨Ф╨░╤Б╤В╨░╨╜", "╨Х╤А╨║╨╡╨▒╤Г╨╗╨░╨╜", "╨Ц╨░╨╜╨▒╨╛╨╗╨░╤В", "╨Ь╨╡╨╣╤А╨░╨╝╨▒╨╡╨║",
];

const lastNames = [
    "╨б╨╡╤А╤Ц╨║", "╨Ю╨╝╨░╤А╨╛╨▓", "╨Р╤Е╨╝╨╡╤В╨╛╨▓", "╨Ъ╤Г╤Б╨░╨╕╨╜╨╛╨▓", "╨Э╤Г╤А╨╝╨░╨│╨░╨╝╨▒╨╡╤В╨╛╨▓", "╨Ш╤Б╨║╨░╨║╨╛╨▓",
    "╨в╤Г╤А╤Б╤Л╨╜╨▒╨░╨╡╨▓", "╨Ц╤Г╨╝╨░╨▒╨╡╨║", "╨б╨░╨┤╤Л╨║╨╛╨▓", "╨Р╨▒╨┤╤А╨░╤Е╨╝╨░╨╜╨╛╨▓", "╨Ъ╤Г╤Б╨░╨╕╨╜╨╛╨▓", "╨С╨╡╨║╨╡╤В╨░╨╡╨▓",
    "╨Х╤А╨╝╨╡╨║╨╛╨▓", "╨Ц╨░╨┐╨░╤А╨╛╨▓", "╨Ч╨░╨║╨╕╤А╨╛╨▓", "╨Ш╨▒╤А╨░╨╡╨▓", "╨Ъ╨░╨╗╨╝╤Л╤А╨╖╨░╨╡╨▓", "╨Ь╨░╤Е╨░╨╜╨╛╨▓",
    "╨Э╤Г╤А╨┐╨╡╨╕╤Б╨╛╨▓", "╨б╨░╨┐╨░╤А╨▒╨░╨╡╨▓", "╨в╨╛╨╗╨╡╨│╨╡╨╜╨╛╨▓", "╨г╨╝╨╕╤А╨╖╨░╨║╨╛╨▓", "╨и╨░╤А╨╕╨┐╨╛╨▓", "╨о╤Б╤Г╨┐╨╛╨▓",
];

const cities = [
    "╨Р╨╗╨╝╨░╤В╤Л", "╨Р╤Б╤В╨░╨╜╨░", "╨и╤Л╨╝╨║╨╡╨╜╤В", "╥Ъ╨░╤А╨░╥У╨░╨╜╨┤╤Л", "╨Р╥Ы╤В╙й╨▒╨╡", "╨в╨░╤А╨░╨╖",
    "╨Я╨░╨▓╨╗╨╛╨┤╨░╤А", "╨Ю╤А╨░╨╗", "╨Ъ╙й╨║╤И╨╡╤В╨░╤Г", "╨в╥п╤А╨║╤Ц╤Б╤В╨░╨╜", "╨Р╤В╤Л╤А╨░╤Г", "╨б╨╡╨╝╨╡╨╣",
    "╙и╤Б╨║╨╡╨╝╨╡╨╜", "╥Ъ╨╛╤Б╤В╨░╨╜╨░╨╣", "╥Ъ╤Л╨╖╤Л╨╗╨╛╤А╨┤╨░", "╨Я╨╡╤В╤А╨╛╨┐╨░╨▓╨╗", "╨в╨░╨╗╨┤╤Л╥Ы╨╛╤А╥У╨░╨╜", "╨Ц╨╡╨╖╥Ы╨░╨╖╥У╨░╨╜",
];

const teams = [
    "╨Ъ╨░╨╣╤А╨░╤В", "╨Р╤Б╤В╨░╨╜╨░", "╨в╨╛╨▒╨╛╨╗", "╨и╨░╤Е╤В╨╡╤А", "╨Ю╤А╨┤╨░╨▒╨░╤Б╤Л", "╨Р╨║╨╢╨░╨╣╤Л╨║",
    "╨Ъ╨░╨╣╤Б╨░╤А", "╨Ц╨╡╤В╤Л╤Б╤Г", "╨в╨░╤А╨░╨╖", "╨Р╤В╤Л╤А╨░╤Г", "╨Ъ╤Л╨╖╤Л╨╗-╨Ц╨░╤А", "╨Ь╨░╨║╤В╨░╨░╤А╨░╨╗",
    null, null, null,
];

const positions: ("GK" | "DEF" | "MID" | "FWD")[] = ["GK", "DEF", "MID", "FWD"];

function rand(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
    return arr[rand(0, arr.length - 1)];
}

function generatePlayer(index: number): MockPlayer {
    const scoreBase = Math.max(0, 100 - index * 1.8);
    const score = Math.max(50, Math.round((scoreBase + rand(-5, 5)) * 10) / 10);

    return {
        id: `mock-${index + 1}`,
        rank: index + 1,
        name: `${pick(firstNames)} ${pick(lastNames)}`,
        age: rand(14, 19),
        position: pick(positions),
        team: pick(teams),
        city: pick(cities),
        country: "╥Ъ╨░╨╖╨░╥Ы╤Б╤В╨░╨╜",
        avatarUrl: null,
        aiScore: score,
        growth: Math.round((rand(-15, 20) + Math.random()) * 10) / 10,
        totalVideos: rand(1, 48),
        lastActive: index < 5 ? "today" : index < 15 ? "1 day ago" : index < 30 ? "3 days ago" : "1 week ago",
        trend: score >= 88 ? "up" : score <= 65 ? "down" : "stable",
    };
}

export const MOCK_PLAYERS: MockPlayer[] = Array.from({ length: 50 }, (_, i) => generatePlayer(i));
