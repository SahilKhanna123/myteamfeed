"use client";

import { useParams, useRouter } from "next/navigation";
import Image from "next/image";

// ─── Team data ───────────────────────────────────────────────────────────────
const MLB_TEAMS = [
  { espnId: "2",  name: "Red Sox",      abbreviation: "BOS", city: "Boston",        color: "#BD3039", league: "AL", division: "AL East" },
  { espnId: "10", name: "Yankees",       abbreviation: "NYY", city: "New York",      color: "#003087", league: "AL", division: "AL East" },
  { espnId: "1",  name: "Blue Jays",     abbreviation: "TOR", city: "Toronto",       color: "#134A8E", league: "AL", division: "AL East" },
  { espnId: "21", name: "Orioles",       abbreviation: "BAL", city: "Baltimore",     color: "#DF4601", league: "AL", division: "AL East" },
  { espnId: "30", name: "Rays",          abbreviation: "TB",  city: "Tampa Bay",     color: "#092C5C", league: "AL", division: "AL East" },
  { espnId: "5",  name: "Guardians",     abbreviation: "CLE", city: "Cleveland",     color: "#00385D", league: "AL", division: "AL Central" },
  { espnId: "7",  name: "Royals",        abbreviation: "KC",  city: "Kansas City",   color: "#004687", league: "AL", division: "AL Central" },
  { espnId: "9",  name: "Twins",         abbreviation: "MIN", city: "Minnesota",     color: "#002B5C", league: "AL", division: "AL Central" },
  { espnId: "24", name: "Tigers",        abbreviation: "DET", city: "Detroit",       color: "#0C2340", league: "AL", division: "AL Central" },
  { espnId: "13", name: "White Sox",     abbreviation: "CHW", city: "Chicago",       color: "#27251F", league: "AL", division: "AL Central" },
  { espnId: "18", name: "Rangers",       abbreviation: "TEX", city: "Texas",         color: "#003278", league: "AL", division: "AL West" },
  { espnId: "6",  name: "Astros",        abbreviation: "HOU", city: "Houston",       color: "#002D62", league: "AL", division: "AL West" },
  { espnId: "27", name: "Mariners",      abbreviation: "SEA", city: "Seattle",       color: "#0C2C56", league: "AL", division: "AL West" },
  { espnId: "3",  name: "Angels",        abbreviation: "LAA", city: "Los Angeles",   color: "#BA0021", league: "AL", division: "AL West" },
  { espnId: "11", name: "Athletics",     abbreviation: "ATH", city: "Oakland",       color: "#003831", league: "AL", division: "AL West" },
  { espnId: "12", name: "Braves",        abbreviation: "ATL", city: "Atlanta",       color: "#13274F", league: "NL", division: "NL East" },
  { espnId: "16", name: "Phillies",      abbreviation: "PHI", city: "Philadelphia",  color: "#E81828", league: "NL", division: "NL East" },
  { espnId: "15", name: "Mets",          abbreviation: "NYM", city: "New York",      color: "#002D72", league: "NL", division: "NL East" },
  { espnId: "20", name: "Nationals",     abbreviation: "WSH", city: "Washington",    color: "#AB0003", league: "NL", division: "NL East" },
  { espnId: "28", name: "Marlins",       abbreviation: "MIA", city: "Miami",         color: "#00A3E0", league: "NL", division: "NL East" },
  { espnId: "8",  name: "Brewers",       abbreviation: "MIL", city: "Milwaukee",     color: "#12284B", league: "NL", division: "NL Central" },
  { espnId: "4",  name: "Cubs",          abbreviation: "CHC", city: "Chicago",       color: "#0E3386", league: "NL", division: "NL Central" },
  { espnId: "25", name: "Cardinals",     abbreviation: "STL", city: "St. Louis",     color: "#C41E3A", league: "NL", division: "NL Central" },
  { espnId: "17", name: "Reds",          abbreviation: "CIN", city: "Cincinnati",    color: "#C6011F", league: "NL", division: "NL Central" },
  { espnId: "23", name: "Pirates",       abbreviation: "PIT", city: "Pittsburgh",    color: "#27251F", league: "NL", division: "NL Central" },
  { espnId: "19", name: "Dodgers",       abbreviation: "LAD", city: "Los Angeles",   color: "#005A9C", league: "NL", division: "NL West" },
  { espnId: "29", name: "Diamondbacks",  abbreviation: "ARI", city: "Arizona",       color: "#A71930", league: "NL", division: "NL West" },
  { espnId: "26", name: "Giants",        abbreviation: "SF",  city: "San Francisco", color: "#FD5A1E", league: "NL", division: "NL West" },
  { espnId: "33", name: "Rockies",       abbreviation: "COL", city: "Colorado",      color: "#333366", league: "NL", division: "NL West" },
  { espnId: "22", name: "Padres",        abbreviation: "SD",  city: "San Diego",     color: "#2F241D", league: "NL", division: "NL West" },
] as const;

// ─── Mock data — replace with real API calls per section ─────────────────────

const MOCK_GAME = {
  status: "Final" as "Final" | "Live" | "Upcoming",
  inning: null as string | null,
  homeTeam: { abbreviation: "BOS", score: 6 },
  awayTeam: { abbreviation: "NYY", score: 4 },
  date: "Apr 3, 2025",
  venue: "Fenway Park",
  result: "W" as "W" | "L" | null,
};

const MOCK_STAT = {
  label: "Team ERA",
  value: "3.41",
  context: "3rd best in the AL",
};

const MOCK_ARTICLES = [
  {
    id: "1",
    source: "ESPN",
    title: "Red Sox bullpen shines in series-clinching win over Yankees",
    summary: "Boston's relievers threw 4.2 scoreless innings to preserve the lead and take the series 2–1.",
    url: "https://espn.com",
    time: "2h ago",
  },
  {
    id: "2",
    source: "Bleacher Report",
    title: "Rafael Devers is quietly having an MVP-caliber April",
    summary: "Through the first two weeks, Devers leads all AL third basemen in OPS and is making a strong early-season case.",
    url: "https://bleacherreport.com",
    time: "5h ago",
  },
];

const MOCK_FACT = {
  text: "Fenway Park's Green Monster is 37 feet 2 inches tall — originally built that height to block the view of non-paying fans watching from a hill outside the park.",
};

const MOCK_REDDIT = {
  author: "u/FenwayFaithful_92",
  subreddit: "r/redsox",
  upvotes: "2.4k",
  text: "I don't care what anyone says, this bullpen is actually built different this year. Three games in and I already trust them more than any Red Sox pen since 2018. Don't @ me.",
  url: "https://reddit.com/r/redsox",
  time: "4h ago",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TeamFeedPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.teamId as string;
  const team = MLB_TEAMS.find((t) => t.espnId === teamId);

  if (!team) {
    return (
      <div style={{ padding: "48px", textAlign: "center", fontFamily: "sans-serif", color: "#18181b" }}>
        <p>Team not found.</p>
        <button onClick={() => router.push("/mlb")} style={{ marginTop: "16px", cursor: "pointer", padding: "8px 16px" }}>
          ← Back to teams
        </button>
      </div>
    );
  }

  const isWin = MOCK_GAME.result === "W";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #fafafa; }

        .page { min-height: 100vh; background: #fafafa; padding-bottom: 80px; }

        /* Hero */
        .hero {
          background: #fff;
          border-bottom: 1px solid #e4e4e7;
          padding: 32px 24px 28px;
        }
        .hero-inner { max-width: 680px; margin: 0 auto; }

        .back-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          color: #a1a1aa;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          margin-bottom: 18px;
          transition: color 0.15s;
        }
        .back-btn:hover { color: #18181b; }

        .team-identity { display: flex; align-items: center; gap: 14px; }

        .team-logo-circle {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: var(--faint);
          border: 2px solid var(--faint);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          flex-shrink: 0;
        }

        .team-name {
          font-family: 'Oswald', sans-serif;
          font-size: clamp(26px, 5vw, 40px);
          font-weight: 700;
          color: #18181b;
          line-height: 1;
          letter-spacing: -0.01em;
        }

        .team-sub {
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          color: #a1a1aa;
          margin-top: 4px;
        }

        /* Feed */
        .feed {
          max-width: 680px;
          margin: 0 auto;
          padding: 24px 24px 0;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .section-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #a1a1aa;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .section-label::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #e4e4e7;
        }

        /* Card */
        .card {
          background: #fff;
          border: 1.5px solid #e4e4e7;
          border-radius: 16px;
          padding: 20px;
        }

        /* Score */
        .score-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }

        .status-pill {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          padding: 3px 10px;
          border-radius: 100px;
        }
        .pill-final    { background: #f4f4f5; color: #71717a; }
        .pill-live     { background: #fef2f2; color: #dc2626; }
        .pill-upcoming { background: #eff6ff; color: #2563eb; }

        .result-badge {
          font-family: 'Oswald', sans-serif;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.05em;
          padding: 3px 12px;
          border-radius: 100px;
        }
        .badge-w { background: #f0fdf4; color: #16a34a; }
        .badge-l { background: #fef2f2; color: #dc2626; }

        .matchup { display: flex; align-items: flex-end; justify-content: center; gap: 0; }

        .score-team { display: flex; flex-direction: column; align-items: center; gap: 6px; flex: 1; }

        .score-logo {
          width: 42px; height: 42px; border-radius: 50%;
          background: #f4f4f5;
          display: flex; align-items: center; justify-content: center;
          overflow: hidden;
        }

        .score-abbr {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          font-weight: 500;
          color: #71717a;
          letter-spacing: 0.04em;
        }

        .score-num {
          font-family: 'Oswald', sans-serif;
          font-size: 48px;
          font-weight: 700;
          line-height: 1;
          color: #18181b;
        }
        .score-num.muted { color: #d4d4d8; }

        .score-sep {
          font-family: 'Oswald', sans-serif;
          font-size: 32px;
          font-weight: 300;
          color: #e4e4e7;
          padding: 0 12px;
          padding-bottom: 14px;
        }

        .score-footer {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          color: #a1a1aa;
          text-align: center;
          margin-top: 16px;
          padding-top: 14px;
          border-top: 1px solid #f4f4f5;
        }

        /* Stat */
        .stat-row { display: flex; align-items: center; gap: 14px; }

        .stat-icon-box {
          width: 46px; height: 46px;
          border-radius: 12px;
          background: var(--faint);
          display: flex; align-items: center; justify-content: center;
          font-size: 22px;
          flex-shrink: 0;
        }

        .stat-val {
          font-family: 'Oswald', sans-serif;
          font-size: 34px;
          font-weight: 700;
          color: var(--color);
          line-height: 1;
        }
        .stat-lbl {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          font-weight: 500;
          color: #18181b;
          margin-top: 3px;
        }
        .stat-ctx {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          color: #a1a1aa;
          margin-top: 2px;
        }

        /* Articles */
        .articles-stack { display: flex; flex-direction: column; gap: 10px; }

        .article-card {
          background: #fff;
          border: 1.5px solid #e4e4e7;
          border-radius: 16px;
          padding: 18px 20px;
          cursor: pointer;
          transition: border-color 0.15s, box-shadow 0.15s;
          display: flex;
          flex-direction: column;
          gap: 7px;
        }
        .article-card:hover {
          border-color: var(--color);
          box-shadow: 0 2px 12px rgba(0,0,0,0.06);
        }

        .article-row1 { display: flex; align-items: center; justify-content: space-between; }

        .article-source {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--color);
        }

        .article-time {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          color: #a1a1aa;
        }

        .article-title {
          font-family: 'Oswald', sans-serif;
          font-size: 16px;
          font-weight: 600;
          color: #18181b;
          line-height: 1.25;
          letter-spacing: 0.01em;
        }

        .article-summary {
          font-family: 'DM Sans', sans-serif;
          font-size: 13px;
          color: #71717a;
          line-height: 1.55;
          font-weight: 300;
        }

        .article-cta {
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 500;
          color: var(--color);
          margin-top: 2px;
        }

        /* Fact */
        .fact-card {
          background: var(--faint);
          border: 1.5px solid #e4e4e7;
          border-left: 4px solid var(--color);
          border-radius: 0 16px 16px 0;
          padding: 18px 20px;
        }
        .fact-eyebrow {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--color);
          margin-bottom: 8px;
        }
        .fact-text {
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          color: #3f3f46;
          line-height: 1.65;
        }

        /* Reddit */
        .reddit-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
        .reddit-author {
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 500;
          color: #FF4500;
        }
        .reddit-meta-right {
          display: flex; align-items: center; gap: 10px;
        }
        .reddit-sub, .reddit-upvotes {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          color: #a1a1aa;
        }
        .reddit-text {
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          color: #18181b;
          line-height: 1.65;
          font-style: italic;
        }
        .reddit-text::before { content: '"'; }
        .reddit-text::after  { content: '"'; }
        .reddit-footer {
          display: flex; align-items: center; justify-content: space-between;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #f4f4f5;
        }
        .reddit-ago {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          color: #a1a1aa;
        }
        .reddit-link {
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          font-weight: 500;
          color: #FF4500;
          text-decoration: none;
          cursor: pointer;
        }

        @media (max-width: 480px) {
          .hero { padding: 20px 16px; }
          .feed { padding: 16px 16px 0; }
          .score-num { font-size: 40px; }
        }
      `}</style>

      <div
        className="page"
        style={{
          "--color": team.color,
          "--faint": `${team.color}12`,
        } as React.CSSProperties}
      >
        {/* Hero */}
        <div className="hero">
          <div className="hero-inner">
            <button className="back-btn" onClick={() => router.push("/mlb")}>
              ← All Teams
            </button>
            <div className="team-identity">
              <div className="team-logo-circle">
                <Image
                  src={`/logos/mlb/${team.abbreviation.toLowerCase()}.png`}
                  alt={team.name}
                  width={46}
                  height={46}
                  style={{ objectFit: "contain" }}
                />
              </div>
              <div>
                <h1 className="team-name">{team.city} {team.name}</h1>
                <p className="team-sub">{team.division} · {team.league}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Feed */}
        <div className="feed">

          {/* ── Score ── */}
          <div>
            <p className="section-label">Most Recent Game</p>
            <div className="card">
              <div className="score-top">
                <span className={`status-pill ${
                  MOCK_GAME.status === "Live" ? "pill-live" :
                  MOCK_GAME.status === "Final" ? "pill-final" : "pill-upcoming"
                }`}>
                  {MOCK_GAME.status === "Live"
                    ? `🔴 Live · ${MOCK_GAME.inning}`
                    : MOCK_GAME.status}
                </span>
                {MOCK_GAME.result && (
                  <span className={`result-badge ${isWin ? "badge-w" : "badge-l"}`}>
                    {isWin ? "✓ Win" : "✗ Loss"}
                  </span>
                )}
              </div>

              <div className="matchup">
                {/* Away */}
                <div className="score-team">
                  <div className="score-logo">
                    <Image
                      src={`/logos/mlb/${MOCK_GAME.awayTeam.abbreviation.toLowerCase()}.png`}
                      alt={MOCK_GAME.awayTeam.abbreviation}
                      width={30} height={30}
                      style={{ objectFit: "contain" }}
                    />
                  </div>
                  <span className="score-abbr">{MOCK_GAME.awayTeam.abbreviation}</span>
                  <span className={`score-num ${isWin ? "muted" : ""}`}>
                    {MOCK_GAME.awayTeam.score}
                  </span>
                </div>

                <span className="score-sep">–</span>

                {/* Home */}
                <div className="score-team">
                  <div className="score-logo">
                    <Image
                      src={`/logos/mlb/${MOCK_GAME.homeTeam.abbreviation.toLowerCase()}.png`}
                      alt={MOCK_GAME.homeTeam.abbreviation}
                      width={30} height={30}
                      style={{ objectFit: "contain" }}
                    />
                  </div>
                  <span className="score-abbr">{MOCK_GAME.homeTeam.abbreviation}</span>
                  <span className={`score-num ${!isWin ? "muted" : ""}`}>
                    {MOCK_GAME.homeTeam.score}
                  </span>
                </div>
              </div>

              <div className="score-footer">
                {MOCK_GAME.date} · {MOCK_GAME.venue}
              </div>
            </div>
          </div>

          {/* ── Stat ── */}
          <div>
            <p className="section-label">Team Stat</p>
            <div className="card stat-row">
              <div className="stat-icon-box">📊</div>
              <div>
                <div className="stat-val">{MOCK_STAT.value}</div>
                <div className="stat-lbl">{MOCK_STAT.label}</div>
                <div className="stat-ctx">{MOCK_STAT.context}</div>
              </div>
            </div>
          </div>

          {/* ── Articles ── */}
          <div>
            <p className="section-label">Latest News</p>
            <div className="articles-stack">
              {MOCK_ARTICLES.map((a) => (
                <div
                  key={a.id}
                  className="article-card"
                  onClick={() => window.open(a.url, "_blank")}
                >
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
          </div>

          {/* ── Fact ── */}
          <div>
            <p className="section-label">Did You Know</p>
            <div className="fact-card">
              <div className="fact-eyebrow">⚡ Interesting Fact</div>
              <p className="fact-text">{MOCK_FACT.text}</p>
            </div>
          </div>

          {/* ── Reddit ── */}
          <div>
            <p className="section-label">Fan Hot Take</p>
            <div className="card">
              <div className="reddit-top">
                <span className="reddit-author">{MOCK_REDDIT.author}</span>
                <div className="reddit-meta-right">
                  <span className="reddit-sub">{MOCK_REDDIT.subreddit}</span>
                  <span className="reddit-upvotes">▲ {MOCK_REDDIT.upvotes}</span>
                </div>
              </div>
              <p className="reddit-text">{MOCK_REDDIT.text}</p>
              <div className="reddit-footer">
                <span className="reddit-ago">{MOCK_REDDIT.time}</span>
                <a className="reddit-link" href={MOCK_REDDIT.url} target="_blank" rel="noreferrer">
                  View thread →
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}