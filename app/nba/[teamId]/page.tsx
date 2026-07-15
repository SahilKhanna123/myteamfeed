"use client";

import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useState, useEffect } from "react";
import { supabase } from '@/lib/supabase'

const NBA_TEAMS = [
  { espnId: "2",  name: "Celtics",       abbreviation: "BOS", city: "Boston",        color: "#007A33", conference: "East", division: "Atlantic" },
  { espnId: "17", name: "Nets",          abbreviation: "BKN", city: "Brooklyn",      color: "#000000", conference: "East", division: "Atlantic" },
  { espnId: "18", name: "Knicks",        abbreviation: "NY",  city: "New York",      color: "#006BB6", conference: "East", division: "Atlantic" },
  { espnId: "20", name: "76ers",         abbreviation: "PHI", city: "Philadelphia",  color: "#006BB6", conference: "East", division: "Atlantic" },
  { espnId: "28", name: "Raptors",       abbreviation: "TOR", city: "Toronto",       color: "#CE1141", conference: "East", division: "Atlantic" },
  { espnId: "4",  name: "Bulls",         abbreviation: "CHI", city: "Chicago",       color: "#CE1141", conference: "East", division: "Central" },
  { espnId: "5",  name: "Cavaliers",     abbreviation: "CLE", city: "Cleveland",     color: "#860038", conference: "East", division: "Central" },
  { espnId: "8",  name: "Pistons",       abbreviation: "DET", city: "Detroit",       color: "#C8102E", conference: "East", division: "Central" },
  { espnId: "11", name: "Pacers",        abbreviation: "IND", city: "Indiana",       color: "#002D62", conference: "East", division: "Central" },
  { espnId: "15", name: "Bucks",         abbreviation: "MIL", city: "Milwaukee",     color: "#00471B", conference: "East", division: "Central" },
  { espnId: "1",  name: "Hawks",         abbreviation: "ATL", city: "Atlanta",       color: "#E03A3E", conference: "East", division: "Southeast" },
  { espnId: "30", name: "Hornets",       abbreviation: "CHA", city: "Charlotte",     color: "#1D1160", conference: "East", division: "Southeast" },
  { espnId: "14", name: "Heat",          abbreviation: "MIA", city: "Miami",         color: "#98002E", conference: "East", division: "Southeast" },
  { espnId: "19", name: "Magic",         abbreviation: "ORL", city: "Orlando",       color: "#0077C0", conference: "East", division: "Southeast" },
  { espnId: "27", name: "Wizards",       abbreviation: "WSH", city: "Washington",    color: "#002B5C", conference: "East", division: "Southeast" },
  { espnId: "7",  name: "Mavericks",     abbreviation: "DAL", city: "Dallas",        color: "#00538C", conference: "West", division: "Southwest" },
  { espnId: "16", name: "Rockets",       abbreviation: "HOU", city: "Houston",       color: "#CE1141", conference: "West", division: "Southwest" },
  { espnId: "29", name: "Grizzlies",     abbreviation: "MEM", city: "Memphis",       color: "#5D76A9", conference: "West", division: "Southwest" },
  { espnId: "3",  name: "Pelicans",      abbreviation: "NO",  city: "New Orleans",   color: "#0C2340", conference: "West", division: "Southwest" },
  { espnId: "24", name: "Spurs",         abbreviation: "SA",  city: "San Antonio",   color: "#C4CED4", conference: "West", division: "Southwest" },
  { espnId: "6",  name: "Nuggets",       abbreviation: "DEN", city: "Denver",        color: "#0E2240", conference: "West", division: "Northwest" },
  { espnId: "23", name: "Timberwolves",  abbreviation: "MIN", city: "Minnesota",     color: "#0C2340", conference: "West", division: "Northwest" },
  { espnId: "25", name: "Thunder",       abbreviation: "OKC", city: "Oklahoma City", color: "#007AC1", conference: "West", division: "Northwest" },
  { espnId: "22", name: "Trail Blazers", abbreviation: "POR", city: "Portland",      color: "#E03A3E", conference: "West", division: "Northwest" },
  { espnId: "26", name: "Jazz",          abbreviation: "UTAH",city: "Utah",          color: "#002B5C", conference: "West", division: "Northwest" },
  { espnId: "9",  name: "Warriors",      abbreviation: "GS",  city: "Golden State",  color: "#1D428A", conference: "West", division: "Pacific" },
  { espnId: "12", name: "Clippers",      abbreviation: "LAC", city: "LA",            color: "#C8102E", conference: "West", division: "Pacific" },
  { espnId: "13", name: "Lakers",        abbreviation: "LAL", city: "LA",            color: "#552583", conference: "West", division: "Pacific" },
  { espnId: "21", name: "Suns",          abbreviation: "PHX", city: "Phoenix",       color: "#1D1160", conference: "West", division: "Pacific" },
  { espnId: "10", name: "Kings",         abbreviation: "SAC", city: "Sacramento",    color: "#5A2D81", conference: "West", division: "Pacific" },
] as const;

type GameStatus = "Final" | "Live" | "Scheduled";

interface GameData {
  status: GameStatus;
  quarter: string | null;
  homeTeam: { abbreviation: string; score: number | null };
  awayTeam: { abbreviation: string; score: number | null };
  date: string;
  venue: string;
  result: "W" | "L" | null;
  isToday: boolean;
}

function parseCompetition(comp: any, teamId: string, isToday: boolean): GameData {
  const home = comp.competitors.find((c: any) => c.homeAway === "home");
  const away = comp.competitors.find((c: any) => c.homeAway === "away");
  const statusState: string = comp.status?.type?.state ?? "pre";

  let status: GameStatus = "Scheduled";
  if (statusState === "in") status = "Live";
  else if (statusState === "post") status = "Final";

  let quarter: string | null = null;
  if (status === "Live") {
    quarter = comp.status?.type?.detail ?? (comp.status?.period ? `Q${comp.status.period}` : null);
  }

  const homeScore = home?.score != null ? parseInt(home.score, 10) : null;
  const awayScore = away?.score != null ? parseInt(away.score, 10) : null;

  let result: "W" | "L" | null = null;
  if (status === "Final" && homeScore != null && awayScore != null) {
    const pageTeamIsHome = home?.id === teamId || home?.team?.id === teamId;
    const pageTeamScore = pageTeamIsHome ? homeScore : awayScore;
    const opponentScore = pageTeamIsHome ? awayScore : homeScore;
    result = pageTeamScore > opponentScore ? "W" : "L";
  }

  const rawDate = comp.date ?? comp.startDate ?? "";
  const dateStr = rawDate
    ? new Date(rawDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "TBD";

  let displayDate = dateStr;
  if (status === "Scheduled" && rawDate) {
    const timeStr = new Date(rawDate).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZoneName: "short" });
    displayDate = `${dateStr} · ${timeStr}`;
  }

  return {
    status,
    quarter,
    homeTeam: { abbreviation: home?.team?.abbreviation ?? home?.abbreviation ?? "???", score: homeScore },
    awayTeam: { abbreviation: away?.team?.abbreviation ?? away?.abbreviation ?? "???", score: awayScore },
    date: displayDate,
    venue: comp.venue?.fullName ?? "TBD",
    result,
    isToday,
  };
}

function useGameData(teamId: string) {
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teamId) return;

    async function load() {
      setLoading(true);
      try {
        const scoreboardRes = await fetch(
          "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard"
        );
        const scoreboardJson = await scoreboardRes.json();
        const todayEvents: any[] = scoreboardJson.events ?? [];

        const todayGame = todayEvents.find((ev) =>
          ev.competitions?.[0]?.competitors?.some((c: any) => c.id === teamId || c.team?.id === teamId)
        );

        if (todayGame) {
          setGameData(parseCompetition(todayGame.competitions[0], teamId, true));
          setLoading(false);
          return;
        }

        for (let daysBack = 1; daysBack <= 7; daysBack++) {
          const d = new Date();
          d.setDate(d.getDate() - daysBack);
          const ds = d.toISOString().slice(0, 10).replace(/-/g, "");

          const res = await fetch(
            `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${ds}`
          );
          const json = await res.json();
          const events: any[] = json.events ?? [];

          const game = events.find((ev) =>
            ev.competitions?.[0]?.competitors?.some((c: any) => c.id === teamId || c.team?.id === teamId)
          );

          if (game) {
            setGameData(parseCompetition(game.competitions[0], teamId, false));
            setLoading(false);
            return;
          }
        }

        setGameData(null);
      } catch (err) {
        console.error("Failed to load game data", err);
        setGameData(null);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [teamId]);

  return { gameData, loading };
}

interface Article {
  id: string;
  source: string;
  title: string;
  summary: string;
  url: string;
  time: string;
}

function useNewsData(teamName: string, teamCity: string) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const query = encodeURIComponent(`${teamCity} ${teamName}`);
        const res = await fetch(`/api/news?team=${query}`);
        const json = await res.json();
        setArticles(json.articles ?? []);
      } catch (e) {
        console.error("News fetch failed", e);
        setArticles([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [teamName, teamCity]);

  return { articles, loading };
}

interface TeamRecord {
  wins: number;
  losses: number;
  winPct: string | null;
}

function useTeamRecord(teamId: string) {
  const [record, setRecord] = useState<TeamRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teamId) return;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${teamId}`);
        const json = await res.json();

        const items = json.team?.record?.items ?? [];
        const overall = items.find((i: any) => i.type === "total") ?? items[0];

        if (overall) {
          const stats = overall.stats ?? [];
          const wins = stats.find((s: any) => s.name === "wins")?.value ?? null;
          const losses = stats.find((s: any) => s.name === "losses")?.value ?? null;
          const winPct = stats.find((s: any) => s.name === "winPercent")?.value ?? null;

          setRecord({
            wins: wins != null ? Math.round(wins) : 0,
            losses: losses != null ? Math.round(losses) : 0,
            winPct: winPct != null ? winPct.toFixed(3).replace(/^0/, "") : null,
          });
        } else {
          setRecord(null);
        }
      } catch (err) {
        console.error("Failed to load team record", err);
        setRecord(null);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [teamId]);

  return { record, loading };
}

// ─── Live Game Panel (basketball) ──────────────────────────────────────────
interface LiveData {
  quarterScores: { home: number[]; away: number[] };
  homeAbbr: string;
  awayAbbr: string;
  clock: string;
  quarterLabel: string;
  lastPlay: string | null;
}

function useLiveGameData(teamId: string, isLive: boolean): { liveData: LiveData | null; loading: boolean } {
  const [liveData, setLiveData] = useState<LiveData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLive) {
      setLoading(false);
      return;
    }

    async function fetchLive() {
      try {
        const res = await fetch("https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard");
        const json = await res.json();
        const events: any[] = json.events ?? [];

        const event = events.find((ev) =>
          ev.competitions?.[0]?.competitors?.some((c: any) => c.id === teamId || c.team?.id === teamId)
        );

        if (!event) {
          setLiveData(null);
          setLoading(false);
          return;
        }

        const comp = event.competitions[0];
        const status = comp.status ?? {};
        const home = comp.competitors.find((c: any) => c.homeAway === "home");
        const away = comp.competitors.find((c: any) => c.homeAway === "away");

        const homeLinescores: number[] = (home?.linescores ?? []).map((l: any) => Number(l.value ?? l.displayValue ?? 0));
        const awayLinescores: number[] = (away?.linescores ?? []).map((l: any) => Number(l.value ?? l.displayValue ?? 0));

        setLiveData({
          quarterScores: { home: homeLinescores, away: awayLinescores },
          homeAbbr: home?.team?.abbreviation ?? "???",
          awayAbbr: away?.team?.abbreviation ?? "???",
          clock: status.displayClock ?? "",
          quarterLabel: status.type?.detail ?? (status.period ? `Q${status.period}` : ""),
          lastPlay: comp.situation?.lastPlay?.text ?? null,
        });
      } catch (e) {
        console.error("ESPN live fetch failed", e);
        setLiveData(null);
      } finally {
        setLoading(false);
      }
    }

    fetchLive();
    const interval = setInterval(fetchLive, 15000);
    return () => clearInterval(interval);
  }, [teamId, isLive]);

  return { liveData, loading };
}

function useFact(teamId: string, teamName: string) {
  const [fact, setFact] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/fact?teamId=${teamId}&teamName=${encodeURIComponent(teamName)}&sport=nba`);
        const json = await res.json();
        setFact(json.fact_text);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [teamId, teamName]);

  return { fact, loading };
}

function LiveGamePanel({ teamId, isLive }: { teamId: string; isLive: boolean }) {
  const { liveData, loading } = useLiveGameData(teamId, isLive);

  if (!isLive) return null;
  if (loading) {
    return (
      <div className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div className="skeleton" style={{ width: 120, height: 12 }} />
        <div className="skeleton" style={{ width: "100%", height: 80 }} />
      </div>
    );
  }
  if (!liveData) return null;

  const { quarterScores, homeAbbr, awayAbbr, clock, quarterLabel, lastPlay } = liveData;
  const numQuarters = Math.max(quarterScores.home.length, quarterScores.away.length, 4);

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{
          fontFamily: "'Oswald', sans-serif", fontSize: 13, fontWeight: 600,
          color: "var(--color)", letterSpacing: "0.04em", textTransform: "uppercase"
        }}>
          {quarterLabel}
        </span>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#71717a", fontWeight: 500 }}>
          ⏱ {clock}
        </span>
      </div>

      {/* Quarter-by-quarter box score */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'DM Sans', sans-serif", fontSize: 12 }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "4px 8px", color: "#a1a1aa", fontWeight: 500 }}></th>
              {Array.from({ length: numQuarters }).map((_, i) => (
                <th key={i} style={{ padding: "4px 8px", color: "#a1a1aa", fontWeight: 500 }}>Q{i + 1}</th>
              ))}
              <th style={{ padding: "4px 8px", color: "#18181b", fontWeight: 700 }}>T</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: "4px 8px", fontWeight: 600, color: "#18181b" }}>{awayAbbr}</td>
              {Array.from({ length: numQuarters }).map((_, i) => (
                <td key={i} style={{ textAlign: "center", padding: "4px 8px", color: "#3f3f46" }}>
                  {quarterScores.away[i] ?? "–"}
                </td>
              ))}
              <td style={{ textAlign: "center", padding: "4px 8px", fontWeight: 700, color: "#18181b" }}>
                {quarterScores.away.reduce((a, b) => a + b, 0)}
              </td>
            </tr>
            <tr>
              <td style={{ padding: "4px 8px", fontWeight: 600, color: "#18181b" }}>{homeAbbr}</td>
              {Array.from({ length: numQuarters }).map((_, i) => (
                <td key={i} style={{ textAlign: "center", padding: "4px 8px", color: "#3f3f46" }}>
                  {quarterScores.home[i] ?? "–"}
                </td>
              ))}
              <td style={{ textAlign: "center", padding: "4px 8px", fontWeight: 700, color: "#18181b" }}>
                {quarterScores.home.reduce((a, b) => a + b, 0)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {lastPlay && (
        <div style={{
          paddingTop: 12, borderTop: "1px solid #f4f4f5",
          fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#71717a", lineHeight: 1.5
        }}>
          <span style={{ fontWeight: 600, color: "#a1a1aa", textTransform: "uppercase", fontSize: 9, letterSpacing: "0.1em" }}>
            Last Play ·{" "}
          </span>
          {lastPlay}
        </div>
      )}
    </div>
  );
}

// ─── Hot Takes (sport-aware) ────────────────────────────────────────────────
interface HotTakeReply {
  id: string;
  author_name: string;
  text: string;
  created_at: string;
  user_id: string;
}

interface HotTake {
  id: string;
  author_name: string;
  text: string;
  likes: number;
  created_at: string;
  user_id: string;
  liked_by_me: boolean;
  replies: HotTakeReply[];
}

function useHotTakes(teamId: string, sport: string) {
  const [hotTakes, setHotTakes] = useState<HotTake[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);

      const { data: takes, error } = await supabase
        .from("hot_takes")
        .select("*")
        .eq("team_id", teamId)
        .eq("sport", sport)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const takeIds = (takes ?? []).map((t) => t.id);

      const [{ data: replies }, { data: myLikes }] = await Promise.all([
        takeIds.length
          ? supabase.from("hot_take_replies").select("*").in("hot_take_id", takeIds).order("created_at", { ascending: true })
          : Promise.resolve({ data: [] as any[] }),
        user && takeIds.length
          ? supabase.from("hot_take_likes").select("hot_take_id").eq("user_id", user.id).in("hot_take_id", takeIds)
          : Promise.resolve({ data: [] as any[] }),
      ]);

      const likedIds = new Set((myLikes ?? []).map((l: any) => l.hot_take_id));

      const merged: HotTake[] = (takes ?? []).map((t: any) => ({
        ...t,
        liked_by_me: likedIds.has(t.id),
        replies: (replies ?? []).filter((r: any) => r.hot_take_id === t.id),
      }));

      setHotTakes(merged);
    } catch (e) {
      console.error("Failed to load hot takes", e);
      setHotTakes([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [teamId, sport]);

  async function postTake(text: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const name = user.user_metadata?.display_name || user.email?.split("@")[0] || "Fan";
    await supabase.from("hot_takes").insert({
      team_id: teamId,
      sport,
      user_id: user.id,
      author_name: name,
      text,
    });
    await load();
  }

  async function toggleLike(take: HotTake) {
    if (!userId) return;
    if (take.liked_by_me) {
      await supabase.from("hot_take_likes").delete().eq("hot_take_id", take.id).eq("user_id", userId);
    } else {
      await supabase.from("hot_take_likes").insert({ hot_take_id: take.id, user_id: userId });
    }
    setHotTakes((prev) =>
      prev.map((t) =>
        t.id === take.id
          ? { ...t, liked_by_me: !t.liked_by_me, likes: t.likes + (t.liked_by_me ? -1 : 1) }
          : t
      )
    );
  }

  async function postReply(takeId: string, text: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const name = user.user_metadata?.display_name || user.email?.split("@")[0] || "Fan";
    await supabase.from("hot_take_replies").insert({
      hot_take_id: takeId,
      sport,
      user_id: user.id,
      author_name: name,
      text,
    });
    await load();
  }

  return { hotTakes, loading, postTake, toggleLike, postReply, userId };
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function HotTakeCard({
  take, onLike, onReply,
}: { take: HotTake; onLike: () => void; onReply: (text: string) => void }) {
  const [showReplies, setShowReplies] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submitReply() {
    if (!replyText.trim()) return;
    setSubmitting(true);
    await onReply(replyText.trim());
    setReplyText("");
    setSubmitting(false);
  }

  return (
    <div className="card">
      <div className="reddit-top">
        <span className="reddit-author">{take.author_name}</span>
        <span className="reddit-ago">{timeAgo(take.created_at)}</span>
      </div>
      <p className="reddit-text" style={{ fontStyle: "normal" }}>{take.text}</p>
      <div className="reddit-footer">
        <button
          onClick={onLike}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "none", border: "none", cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500,
            color: take.liked_by_me ? "var(--color)" : "#a1a1aa",
          }}
        >
          {take.liked_by_me ? "❤️" : "🤍"} {take.likes}
        </button>
        <button
          onClick={() => setShowReplies((s) => !s)}
          style={{
            background: "none", border: "none", cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 500,
            color: "#a1a1aa",
          }}
        >
          💬 {take.replies.length} {take.replies.length === 1 ? "reply" : "replies"}
        </button>
      </div>

      {showReplies && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #f4f4f5", display: "flex", flexDirection: "column", gap: 10 }}>
          {take.replies.map((r) => (
            <div key={r.id} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, color: "var(--color)" }}>
                  {r.author_name}
                </span>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: "#a1a1aa" }}>
                  {timeAgo(r.created_at)}
                </span>
              </div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#3f3f46" }}>{r.text}</p>
            </div>
          ))}

          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <input
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write a reply…"
              onKeyDown={(e) => e.key === "Enter" && submitReply()}
              style={{
                flex: 1, fontFamily: "'DM Sans', sans-serif", fontSize: 12,
                padding: "8px 10px", borderRadius: 8, border: "1.5px solid #e4e4e7", outline: "none",
              }}
            />
            <button
              onClick={submitReply}
              disabled={submitting || !replyText.trim()}
              style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600,
                color: "#fff", background: "var(--color)", border: "none",
                borderRadius: 8, padding: "0 14px", cursor: "pointer",
                opacity: submitting || !replyText.trim() ? 0.5 : 1,
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function HotTakesSection({ teamId, sport }: { teamId: string; sport: string }) {
  const { hotTakes, loading, postTake, toggleLike, postReply, userId } = useHotTakes(teamId, sport);
  const [newTake, setNewTake] = useState("");
  const [posting, setPosting] = useState(false);

  async function submit() {
    if (!newTake.trim()) return;
    setPosting(true);
    await postTake(newTake.trim());
    setNewTake("");
    setPosting(false);
  }

  return (
    <div>
      <p className="section-label">Fan Hot Takes</p>

      {userId ? (
        <div className="card" style={{ marginBottom: 12, display: "flex", gap: 8 }}>
          <input
            value={newTake}
            onChange={(e) => setNewTake(e.target.value)}
            placeholder="Drop your hot take…"
            onKeyDown={(e) => e.key === "Enter" && submit()}
            style={{
              flex: 1, fontFamily: "'DM Sans', sans-serif", fontSize: 13,
              padding: "10px 12px", borderRadius: 10, border: "1.5px solid #e4e4e7", outline: "none",
            }}
          />
          <button
            onClick={submit}
            disabled={posting || !newTake.trim()}
            style={{
              fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600,
              color: "#fff", background: "var(--color)", border: "none",
              borderRadius: 10, padding: "0 18px", cursor: "pointer",
              opacity: posting || !newTake.trim() ? 0.5 : 1,
            }}
          >
            Post
          </button>
        </div>
      ) : (
        <div className="card" style={{ marginBottom: 12, textAlign: "center", padding: "16px 20px" }}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#a1a1aa" }}>
            Sign in to post a hot take.
          </p>
        </div>
      )}

      {loading ? (
        <div className="card">
          <div className="skeleton" style={{ width: "40%", height: 12, marginBottom: 12 }} />
          <div className="skeleton" style={{ width: "100%", height: 60 }} />
        </div>
      ) : hotTakes.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "24px 20px" }}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#a1a1aa" }}>
            No hot takes yet — be the first.
          </p>
        </div>
      ) : (
        <div className="articles-stack">
          {hotTakes.map((t) => (
            <HotTakeCard key={t.id} take={t} onLike={() => toggleLike(t)} onReply={(text) => postReply(t.id, text)} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function NBATeamFeedPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.teamId as string;
  const team = NBA_TEAMS.find((t) => t.espnId === teamId);
  const { record, loading: recordLoading } = useTeamRecord(teamId);
  const { gameData, loading: gameLoading } = useGameData(teamId);
  const { articles, loading: newsLoading } = useNewsData(team?.name ?? "", team?.city ?? "");
  const { fact, loading: factLoading } = useFact(teamId, team ? `${team.city} ${team.name}` : "");

  if (!team) {
    return (
      <div style={{ padding: "48px", textAlign: "center", fontFamily: "sans-serif", color: "#18181b" }}>
        <p>Team not found.</p>
        <button onClick={() => router.push("/nba")} style={{ marginTop: "16px", cursor: "pointer", padding: "8px 16px" }}>
          ← Back to teams
        </button>
      </div>
    );
  }

  const isWin = gameData?.result === "W";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #fafafa; }
        .page { min-height: 100vh; background: #fafafa; padding-bottom: 80px; }
        .hero { background: #fff; border-bottom: 1px solid #e4e4e7; padding: 32px 24px 28px; }
        .hero-inner { max-width: 680px; margin: 0 auto; }
        .back-btn {
          display: inline-flex; align-items: center; gap: 5px;
          font-family: 'DM Sans', sans-serif; font-size: 12px; color: #a1a1aa;
          background: none; border: none; cursor: pointer; padding: 0;
          margin-bottom: 18px; transition: color 0.15s;
        }
        .back-btn:hover { color: #18181b; }
        .team-identity { display: flex; align-items: center; gap: 14px; }
        .team-logo-circle {
          width: 60px; height: 60px; border-radius: 50%; background: var(--faint);
          border: 2px solid var(--faint); display: flex; align-items: center; justify-content: center;
          overflow: hidden; flex-shrink: 0;
        }
        .team-name {
          font-family: 'Oswald', sans-serif; font-size: clamp(26px, 5vw, 40px);
          font-weight: 700; color: #18181b; line-height: 1; letter-spacing: -0.01em;
        }
        .team-sub { font-family: 'DM Sans', sans-serif; font-size: 12px; color: #a1a1aa; margin-top: 4px; }
        .feed { max-width: 680px; margin: 0 auto; padding: 24px 24px 0; display: flex; flex-direction: column; gap: 20px; }
        .section-label {
          font-family: 'DM Sans', sans-serif; font-size: 10px; font-weight: 500;
          letter-spacing: 0.14em; text-transform: uppercase; color: #a1a1aa; margin-bottom: 8px;
          display: flex; align-items: center; gap: 8px;
        }
        .section-label::after { content: ''; flex: 1; height: 1px; background: #e4e4e7; }
        .card { background: #fff; border: 1.5px solid #e4e4e7; border-radius: 16px; padding: 20px; }
        .skeleton {
          background: linear-gradient(90deg, #f4f4f5 25%, #e4e4e7 50%, #f4f4f5 75%);
          background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: 8px;
        }
        @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
        .score-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
        .status-pill {
          font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 500;
          letter-spacing: 0.07em; text-transform: uppercase; padding: 3px 10px; border-radius: 100px;
        }
        .pill-final { background: #f4f4f5; color: #71717a; }
        .pill-live { background: #fef2f2; color: #dc2626; }
        .pill-scheduled { background: #eff6ff; color: #2563eb; }
        .result-badge {
          font-family: 'Oswald', sans-serif; font-size: 13px; font-weight: 700;
          letter-spacing: 0.05em; padding: 3px 12px; border-radius: 100px;
        }
        .badge-w { background: #f0fdf4; color: #16a34a; }
        .badge-l { background: #fef2f2; color: #dc2626; }
        .matchup { display: flex; align-items: flex-end; justify-content: center; gap: 0; }
        .score-team { display: flex; flex-direction: column; align-items: center; gap: 6px; flex: 1; }
        .score-logo {
          width: 42px; height: 42px; border-radius: 50%; background: #f4f4f5;
          display: flex; align-items: center; justify-content: center; overflow: hidden;
        }
        .score-abbr { font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 500; color: #71717a; letter-spacing: 0.04em; }
        .score-num { font-family: 'Oswald', sans-serif; font-size: 48px; font-weight: 700; line-height: 1; color: #18181b; }
        .score-num.muted { color: #d4d4d8; }
        .score-sep { font-family: 'Oswald', sans-serif; font-size: 32px; font-weight: 300; color: #e4e4e7; padding: 0 12px; padding-bottom: 14px; }
        .score-footer {
          font-family: 'DM Sans', sans-serif; font-size: 11px; color: #a1a1aa; text-align: center;
          margin-top: 16px; padding-top: 14px; border-top: 1px solid #f4f4f5;
        }
        .articles-stack { display: flex; flex-direction: column; gap: 10px; }
        .article-card {
          background: #fff; border: 1.5px solid #e4e4e7; border-radius: 16px; padding: 18px 20px;
          cursor: pointer; transition: border-color 0.15s, box-shadow 0.15s;
          display: flex; flex-direction: column; gap: 7px;
        }
        .article-card:hover { border-color: var(--color); box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
        .article-row1 { display: flex; align-items: center; justify-content: space-between; }
        .article-source {
          font-family: 'DM Sans', sans-serif; font-size: 10px; font-weight: 600;
          letter-spacing: 0.1em; text-transform: uppercase; color: var(--color);
        }
        .article-time { font-family: 'DM Sans', sans-serif; font-size: 11px; color: #a1a1aa; }
        .article-title {
          font-family: 'Oswald', sans-serif; font-size: 16px; font-weight: 600; color: #18181b;
          line-height: 1.25; letter-spacing: 0.01em;
        }
        .article-summary { font-family: 'DM Sans', sans-serif; font-size: 13px; color: #71717a; line-height: 1.55; font-weight: 300; }
        .article-cta { font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500; color: var(--color); margin-top: 2px; }
        .fact-card {
          background: var(--faint); border: 1.5px solid #e4e4e7; border-left: 4px solid var(--color);
          border-radius: 0 16px 16px 0; padding: 18px 20px;
        }
        .fact-eyebrow {
          font-family: 'DM Sans', sans-serif; font-size: 10px; font-weight: 600;
          letter-spacing: 0.12em; text-transform: uppercase; color: var(--color); margin-bottom: 8px;
        }
        .fact-text { font-family: 'DM Sans', sans-serif; font-size: 14px; color: #3f3f46; line-height: 1.65; }
        .reddit-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
        .reddit-author { font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500; color: #FF4500; }
        .reddit-text {
          font-family: 'DM Sans', sans-serif; font-size: 14px; color: #18181b; line-height: 1.65; font-style: italic;
        }
        .reddit-text::before { content: '"'; }
        .reddit-text::after { content: '"'; }
        .reddit-footer {
          display: flex; align-items: center; justify-content: space-between;
          margin-top: 12px; padding-top: 12px; border-top: 1px solid #f4f4f5;
        }
        .reddit-ago { font-family: 'DM Sans', sans-serif; font-size: 11px; color: #a1a1aa; }
        @media (max-width: 480px) {
          .hero { padding: 20px 16px; }
          .feed { padding: 16px 16px 0; }
          .score-num { font-size: 40px; }
        }
      `}</style>

      <div className="page" style={{ "--color": team.color, "--faint": `${team.color}12` } as React.CSSProperties}>
        <div className="hero">
          <div className="hero-inner">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <button className="back-btn" onClick={() => router.push('/')}>
                  🏆 All Sports
                </button>

                <button className="back-btn" onClick={async () => {
                  const { data: { user } } = await supabase.auth.getUser()
                  if (user) {
                    await supabase.from('user_team').delete().eq('user_id', user.id).eq('sport', 'nba')
                  }
                  router.push('/nba')
                }}>
                  ⭐ Change Team
                </button>
              </div>

              <button
                onClick={async () => {
                  await supabase.auth.signOut()
                  router.push('/login')
                }}
                style={{
                  fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#a1a1aa',
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                }}
              >
                Sign out
              </button>
            </div>

            <div className="team-identity">
              <div className="team-logo-circle">
                <Image
                  src={`/logos/nba/${team.abbreviation.toLowerCase()}.png`}
                  alt={team.name}
                  width={46} height={46}
                  style={{ objectFit: "contain" }}
                />
              </div>
              <div>
                <h1 className="team-name">{team.city} {team.name}</h1>
                <p className="team-sub">
                  {team.division} · {team.conference}
                  {!recordLoading && record && (
                    <> &nbsp;·&nbsp; {record.wins}-{record.losses}{record.winPct ? ` (${record.winPct})` : ""}</>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="feed">
          <div>
            <p className="section-label">{gameData?.isToday ? "Today's Game" : "Most Recent Game"}</p>

            {gameLoading ? (
              <div className="card">
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
                  <div className="skeleton" style={{ width: 60, height: 22 }} />
                  <div className="skeleton" style={{ width: 50, height: 22 }} />
                </div>
                <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 12 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flex: 1 }}>
                    <div className="skeleton" style={{ width: 42, height: 42, borderRadius: "50%" }} />
                    <div className="skeleton" style={{ width: 36, height: 12 }} />
                    <div className="skeleton" style={{ width: 48, height: 52 }} />
                  </div>
                  <div className="skeleton" style={{ width: 20, height: 32, marginBottom: 14 }} />
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, flex: 1 }}>
                    <div className="skeleton" style={{ width: 42, height: 42, borderRadius: "50%" }} />
                    <div className="skeleton" style={{ width: 36, height: 12 }} />
                    <div className="skeleton" style={{ width: 48, height: 52 }} />
                  </div>
                </div>
                <div className="skeleton" style={{ width: "60%", height: 12, margin: "18px auto 0" }} />
              </div>
            ) : !gameData ? (
              <div className="card" style={{ textAlign: "center", padding: "32px 20px" }}>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#a1a1aa" }}>
                  No recent game data available.
                </p>
              </div>
            ) : (
              <div className="card">
                <div className="score-top">
                  <span className={`status-pill ${
                    gameData.status === "Live" ? "pill-live" : gameData.status === "Final" ? "pill-final" : "pill-scheduled"
                  }`}>
                    {gameData.status === "Live" ? `🔴 Live · ${gameData.quarter}` : gameData.status === "Scheduled" ? "Scheduled" : "Final"}
                  </span>
                  {gameData.result && (
                    <span className={`result-badge ${isWin ? "badge-w" : "badge-l"}`}>
                      {isWin ? "✓ Win" : "✗ Loss"}
                    </span>
                  )}
                </div>

                <div className="matchup">
                  <div className="score-team">
                    <div className="score-logo">
                      <Image
                        src={`/logos/nba/${gameData.awayTeam.abbreviation.toLowerCase()}.png`}
                        alt={gameData.awayTeam.abbreviation}
                        width={30} height={30}
                        style={{ objectFit: "contain" }}
                      />
                    </div>
                    <span className="score-abbr">{gameData.awayTeam.abbreviation}</span>
                    <span className={`score-num ${gameData.status !== "Scheduled" && gameData.awayTeam.score !== null && gameData.homeTeam.score !== null && gameData.awayTeam.score < gameData.homeTeam.score ? "muted" : ""}`}>
                      {gameData.status === "Scheduled" ? "–" : (gameData.awayTeam.score ?? "–")}
                    </span>
                  </div>

                  <span className="score-sep">–</span>

                  <div className="score-team">
                    <div className="score-logo">
                      <Image
                        src={`/logos/nba/${gameData.homeTeam.abbreviation.toLowerCase()}.png`}
                        alt={gameData.homeTeam.abbreviation}
                        width={30} height={30}
                        style={{ objectFit: "contain" }}
                      />
                    </div>
                    <span className="score-abbr">{gameData.homeTeam.abbreviation}</span>
                    <span className={`score-num ${gameData.status !== "Scheduled" && gameData.homeTeam.score !== null && gameData.awayTeam.score !== null && gameData.homeTeam.score < gameData.awayTeam.score ? "muted" : ""}`}>
                      {gameData.status === "Scheduled" ? "–" : (gameData.homeTeam.score ?? "–")}
                    </span>
                  </div>
                </div>

                <div className="score-footer">
                  {gameData.date} · {gameData.venue}
                </div>
              </div>
            )}
          </div>

          {gameData?.status === "Live" && (
            <div>
              <p className="section-label">Live · In-Game</p>
              <LiveGamePanel teamId={teamId} isLive={true} />
            </div>
          )}

          <div>
            <p className="section-label">Latest News</p>
            {newsLoading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <div className="skeleton" style={{ height: 100, borderRadius: 16 }} />
                <div className="skeleton" style={{ height: 100, borderRadius: 16 }} />
              </div>
            ) : articles.length === 0 ? (
              <div className="card" style={{ textAlign: "center", padding: "24px 20px" }}>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#a1a1aa" }}>
                  No recent articles found.
                </p>
              </div>
            ) : (
              <div className="articles-stack">
                {articles.map((a) => (
                  <div key={a.id} className="article-card" onClick={() => window.open(a.url, "_blank")}>
                    <div className="article-row1">
                      <span className="article-source">{a.source}</span>
                      <span className="article-time">{a.time}</span>
                    </div>
                    <h2 className="article-title">{a.title}</h2>
                    <p className="article-summary">{a.summary}</p>
                    <span className="article-cta">Read article →</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="section-label">Did You Know</p>
            <div className="fact-card">
              <div className="fact-eyebrow">⚡ Interesting Fact</div>
              {factLoading ? (
                <div className="skeleton" style={{ width: "100%", height: 50 }} />
              ) : (
                <p className="fact-text">{fact}</p>
              )}
            </div>
          </div>

          <HotTakesSection teamId={teamId} sport="nba" />
        </div>
      </div>
    </>
  );
}