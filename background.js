const POLL_INTERVAL_LIVE = 0.25;   // 15s when live
const POLL_INTERVAL_IDLE = 5;       // 5min otherwise

const MLB_TEAMS = [
  { espnId: "2",  name: "Red Sox",      abbreviation: "BOS", city: "Boston",        color: "#BD3039" },
  { espnId: "10", name: "Yankees",      abbreviation: "NYY", city: "New York",      color: "#003087" },
  { espnId: "14", name: "Blue Jays",    abbreviation: "TOR", city: "Toronto",       color: "#134A8E" },
  { espnId: "1",  name: "Orioles",      abbreviation: "BAL", city: "Baltimore",     color: "#DF4601" },
  { espnId: "30", name: "Rays",         abbreviation: "TB",  city: "Tampa Bay",     color: "#092C5C" },
  { espnId: "5",  name: "Guardians",    abbreviation: "CLE", city: "Cleveland",     color: "#00385D" },
  { espnId: "7",  name: "Royals",       abbreviation: "KC",  city: "Kansas City",   color: "#004687" },
  { espnId: "9",  name: "Twins",        abbreviation: "MIN", city: "Minnesota",     color: "#002B5C" },
  { espnId: "6",  name: "Tigers",       abbreviation: "DET", city: "Detroit",       color: "#0C2340" },
  { espnId: "4",  name: "White Sox",    abbreviation: "CHW", city: "Chicago",       color: "#27251F" },
  { espnId: "13", name: "Rangers",      abbreviation: "TEX", city: "Texas",         color: "#003278" },
  { espnId: "18", name: "Astros",       abbreviation: "HOU", city: "Houston",       color: "#002D62" },
  { espnId: "12", name: "Mariners",     abbreviation: "SEA", city: "Seattle",       color: "#0C2C56" },
  { espnId: "3",  name: "Angels",       abbreviation: "LAA", city: "Los Angeles",   color: "#BA0021" },
  { espnId: "11", name: "Athletics",    abbreviation: "ATH", city: "Oakland",       color: "#003831" },
  { espnId: "15", name: "Braves",       abbreviation: "ATL", city: "Atlanta",       color: "#13274F" },
  { espnId: "22", name: "Phillies",     abbreviation: "PHI", city: "Philadelphia",  color: "#E81828" },
  { espnId: "21", name: "Mets",         abbreviation: "NYM", city: "New York",      color: "#002D72" },
  { espnId: "20", name: "Nationals",    abbreviation: "WSH", city: "Washington",    color: "#AB0003" },
  { espnId: "28", name: "Marlins",      abbreviation: "MIA", city: "Miami",         color: "#00A3E0" },
  { espnId: "8",  name: "Brewers",      abbreviation: "MIL", city: "Milwaukee",     color: "#12284B" },
  { espnId: "16", name: "Cubs",         abbreviation: "CHC", city: "Chicago",       color: "#0E3386" },
  { espnId: "24", name: "Cardinals",    abbreviation: "STL", city: "St. Louis",     color: "#C41E3A" },
  { espnId: "17", name: "Reds",         abbreviation: "CIN", city: "Cincinnati",    color: "#C6011F" },
  { espnId: "23", name: "Pirates",      abbreviation: "PIT", city: "Pittsburgh",    color: "#27251F" },
  { espnId: "19", name: "Dodgers",      abbreviation: "LAD", city: "Los Angeles",   color: "#005A9C" },
  { espnId: "29", name: "Diamondbacks", abbreviation: "ARI", city: "Arizona",       color: "#A71930" },
  { espnId: "26", name: "Giants",       abbreviation: "SF",  city: "San Francisco", color: "#FD5A1E" },
  { espnId: "27", name: "Rockies",      abbreviation: "COL", city: "Colorado",      color: "#333366" },
  { espnId: "25", name: "Padres",       abbreviation: "SD",  city: "San Diego",     color: "#2F241D" },
];

async function fetchScore(teamId) {
  try {
    const res = await fetch(
      "https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard"
    );
    const json = await res.json();
    const events = json.events ?? [];

    const event = events.find((ev) =>
      ev.competitions?.[0]?.competitors?.some(
        (c) => c.id === teamId || c.team?.id === teamId
      )
    );

    if (!event) {
      // No game today — get last result
      const schedRes = await fetch(
        `https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/teams/${teamId}/schedule`
      );
      const schedJson = await schedRes.json();
      const completed = (schedJson.events ?? [])
        .filter((ev) => ev.competitions?.[0]?.status?.type?.state === "post")
        .sort((a, b) =>
          new Date(b.competitions[0].date) - new Date(a.competitions[0].date)
        );

      if (completed.length > 0) {
        return parseGame(completed[0].competitions[0], teamId, false);
      }
      return null;
    }

    const comp = event.competitions[0];
    const gameId = event.id;
    const state = comp.status?.type?.state ?? "pre";

    const parsed = parseGame(comp, teamId, true);

    // For pre-game, try to fetch lineups
    if (state === "pre") {
      try {
        const summaryRes = await fetch(
          `https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/summary?event=${gameId}`
        );
        const summary = await summaryRes.json();
        parsed.awayLineup = extractLineup(summary, "away");
        parsed.homeLineup = extractLineup(summary, "home");
      } catch (_) {}
    }

    // For live games, fetch pitcher/batter from summary
    if (state === "in") {
      try {
        const summaryRes = await fetch(
          `https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/summary?event=${gameId}`
        );
        const summary = await summaryRes.json();
        const pitcherBatter = extractPitcherBatter(summary);
        parsed.pitcher = pitcherBatter.pitcher;
        parsed.batter = pitcherBatter.batter;
      } catch (_) {}
    }

    return parsed;
  } catch (e) {
    console.error("Score fetch failed:", e);
    return null;
  }
}

function extractLineup(summary, side) {
  try {
    const rosters = summary.rosters ?? summary.boxscore?.players ?? [];
    const team = rosters.find((r) => r.homeAway === side);
    if (!team) return [];
    const starters = (team.roster ?? team.statistics?.[0]?.athletes ?? [])
      .filter((a) => a.starter || a.batOrder)
      .sort((a, b) => (a.batOrder ?? 99) - (b.batOrder ?? 99))
      .slice(0, 9)
      .map((a) => ({
        name: a.athlete?.shortName ?? a.athlete?.displayName ?? "Unknown",
        position: a.position?.abbreviation ?? "",
      }));
    return starters;
  } catch (_) {
    return [];
  }
}

function extractPitcherBatter(summary) {
  try {
    const situation = summary.situation ?? summary.plays?.[summary.plays.length - 1]?.situation ?? {};
    const pitcher = situation.pitcher?.athlete ?? situation.pitcher ?? null;
    const batter = situation.batter?.athlete ?? situation.batter ?? null;

    return {
      pitcher: pitcher ? {
        name: pitcher.shortName ?? pitcher.displayName ?? "Unknown",
        era: situation.pitcher?.statistics?.find?.(s => s.name === "ERA")?.displayValue ?? null,
      } : null,
      batter: batter ? {
        name: batter.shortName ?? batter.displayName ?? "Unknown",
        avg: situation.batter?.statistics?.find?.(s => s.name === "avg")?.value ?? null,
      } : null,
    };
  } catch (_) {
    return { pitcher: null, batter: null };
  }
}

function parseGame(comp, teamId, isToday) {
  const home = comp.competitors.find((c) => c.homeAway === "home");
  const away = comp.competitors.find((c) => c.homeAway === "away");
  const state = comp.status?.type?.state ?? "pre";

  let status = "Scheduled";
  if (state === "in") status = "Live";
  else if (state === "post") status = "Final";

  const homeScore = home?.score != null ? parseInt(home.score, 10) : null;
  const awayScore = away?.score != null ? parseInt(away.score, 10) : null;

  const inning = status === "Live"
    ? (comp.status?.type?.shortDetail ?? comp.status?.type?.detail ?? null)
    : null;

  const situation = comp.situation ?? {};
  const bases = status === "Live" ? {
    first: !!situation.onFirst,
    second: !!situation.onSecond,
    third: !!situation.onThird,
  } : null;
  const count = status === "Live" ? {
    balls: situation.balls ?? 0,
    strikes: situation.strikes ?? 0,
    outs: situation.outs ?? 0,
  } : null;
  const lastPlay = situation.lastPlay?.text ?? null;

  const pageTeamIsHome = home?.id === teamId || home?.team?.id === teamId;
  const pageTeamScore = pageTeamIsHome ? homeScore : awayScore;
  const opponentScore = pageTeamIsHome ? awayScore : homeScore;

  let result = null;
  if (status === "Final" && pageTeamScore != null && opponentScore != null) {
    result = pageTeamScore > opponentScore ? "W" : "L";
  }

  const rawDate = comp.date ?? "";
  const gameDate = rawDate
    ? new Date(rawDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "TBD";

  // Game time for pre-game
  const gameTime = status === "Scheduled" && rawDate
    ? new Date(rawDate).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZoneName: "short" })
    : null;

  return {
    status,
    isToday,
    inning,
    bases,
    count,
    lastPlay,
    pitcher: null,
    batter: null,
    awayLineup: [],
    homeLineup: [],
    homeTeam: {
      espnId: home?.id ?? home?.team?.id ?? null,
      abbreviation: home?.team?.abbreviation ?? home?.abbreviation ?? "???",
      score: homeScore,
    },
    awayTeam: {
      espnId: away?.id ?? away?.team?.id ?? null,
      abbreviation: away?.team?.abbreviation ?? away?.abbreviation ?? "???",
      score: awayScore,
    },
    result,
    gameDate,
    gameTime,
    isHome: pageTeamIsHome,
  };
}

async function poll() {
  const { selectedTeamId } = await chrome.storage.sync.get("selectedTeamId");
  if (!selectedTeamId) return;

  const score = await fetchScore(selectedTeamId);
  await chrome.storage.local.set({ cachedScore: score, lastUpdated: Date.now() });

  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    try {
      await chrome.tabs.sendMessage(tab.id, { type: "SCORE_UPDATE", score });
    } catch (_) {}
  }

  const isLive = score?.status === "Live";
  chrome.alarms.create("pollScore", {
    delayInMinutes: isLive ? POLL_INTERVAL_LIVE : POLL_INTERVAL_IDLE,
  });
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "pollScore") poll();
});

chrome.storage.onChanged.addListener((changes) => {
  if (changes.selectedTeamId) {
    chrome.storage.local.remove("cachedScore");
    poll();
  }
});

poll();

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "REFRESH") {
    poll().then(() => sendResponse({ ok: true }));
    return true;
  }
  if (msg.type === "GET_TEAMS") {
    sendResponse({ teams: MLB_TEAMS });
  }
});
