

import { NextRequest, NextResponse } from "next/server";


const ESPN_TO_MLB: Record<string, number> = {
  "2":  111, // Red Sox
  "10": 147, // Yankees
  "14": 141, // Blue Jays
  "1":  110, // Orioles
  "30": 139, // Rays
  "5":  114, // Guardians
  "7":  118, // Royals
  "9":  142, // Twins
  "6":  116, // Tigers
  "4":  145, // White Sox
  "13": 140, // Rangers
  "18": 117, // Astros
  "12": 136, // Mariners
  "3":  108, // Angels
  "11": 133, // Athletics
  "15": 144, // Braves
  "22": 143, // Phillies
  "21": 121, // Mets
  "20": 120, // Nationals
  "28": 146, // Marlins
  "8":  158, // Brewers
  "16": 112, // Cubs
  "24": 138, // Cardinals
  "17": 113, // Reds
  "23": 134, // Pirates
  "19": 119, // Dodgers
  "29": 109, // Diamondbacks
  "26": 137, // Giants
  "27": 115, // Rockies
  "25": 135, // Padres
};

interface PitcherInfo {
  name: string;
  hand: string;
  record: string;
  era: string;
  ip: string;
  so: string;
}

interface PlayerEntry {
  order: number;
  name: string;
  hand: string;
  position: string;
}

interface TeamPreGame {
  teamName: string;
  winPct: number | null;
  pitcher: PitcherInfo;
  lineup: PlayerEntry[];
}

interface PreGameData {
  away: TeamPreGame;
  home: TeamPreGame;
  isHome: boolean;
}

function extractPitcher(teamData: any): PitcherInfo {
  const p = teamData?.probablePitcher;
  if (!p) return { name: "TBD", hand: "", record: "", era: "", ip: "", so: "" };

  const stats = p.stats?.find((s: any) => s.type?.displayName === "statsSingleSeason")?.stat ?? {};
  const hand = p.pitchHand?.code ?? "";
  const wins = stats.wins ?? 0;
  const losses = stats.losses ?? 0;

  return {
    name: p.fullName ?? p.lastName ?? "TBD",
    hand,
    record: `${wins}-${losses}`,
    era: stats.era ?? "",
    ip: stats.inningsPitched ?? "",
    so: String(stats.strikeOuts ?? ""),
  };
}

function extractLineup(lineupData: any[]): PlayerEntry[] {
  if (!lineupData?.length) return [];
  return lineupData.map((entry: any, i: number) => ({
    order: i + 1,
    name: entry.fullName ?? entry.lastName ?? "Unknown",
    hand: entry.batSide?.code ?? "",
    position: entry.primaryPosition?.abbreviation ?? "",
  }));
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const espnTeamId = searchParams.get("teamId") ?? "";
  const date = searchParams.get("date") ?? new Date().toISOString().split("T")[0];

  const mlbTeamId = ESPN_TO_MLB[espnTeamId];
  if (!mlbTeamId) {
    return NextResponse.json({ pregame: null }, { status: 200 });
  }

  try {
    const url =
      `https://statsapi.mlb.com/api/v1/schedule` +
      `?sportId=1&date=${date}` +
      `&hydrate=lineups,probablePitcher(note,stats),team,record` +
      `&teamId=${mlbTeamId}`;

    const res = await fetch(url, { next: { revalidate: 120 } }); // cache 2 min
    const json = await res.json();

    const game = json.dates?.[0]?.games?.[0];
    if (!game) return NextResponse.json({ pregame: null });

    const awayTeamData = game.teams?.away;
    const homeTeamData = game.teams?.home;
    const lineups      = game.lineups ?? {};

    // win% from record
    function winPct(teamData: any): number | null {
      const rec = teamData?.leagueRecord;
      if (!rec) return null;
      const total = (rec.wins ?? 0) + (rec.losses ?? 0);
      return total > 0 ? Math.round((rec.wins / total) * 1000) / 10 : null;
    }

    const isHome = homeTeamData?.team?.id === mlbTeamId;

    const pregame: PreGameData = {
      away: {
        teamName: awayTeamData?.team?.clubName ?? "Away",
        winPct:   winPct(awayTeamData),
        pitcher:  extractPitcher(awayTeamData),
        lineup:   extractLineup(lineups.awayPlayers ?? []),
      },
      home: {
        teamName: homeTeamData?.team?.clubName ?? "Home",
        winPct:   winPct(homeTeamData),
        pitcher:  extractPitcher(homeTeamData),
        lineup:   extractLineup(lineups.homePlayers ?? []),
      },
      isHome,
    };

    return NextResponse.json({ pregame });
  } catch (err) {
    console.error("pregame fetch failed", err);
    return NextResponse.json({ pregame: null });
  }
}