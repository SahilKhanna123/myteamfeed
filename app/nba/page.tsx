"use client";
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

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

type Division = "Atlantic" | "Central" | "Southeast" | "Southwest" | "Northwest" | "Pacific";
const DIVISIONS: Division[] = ["Atlantic", "Central", "Southeast", "Southwest", "Northwest", "Pacific"];

function TeamBubble({
  team,
  onClick,
}: {
  team: (typeof NBA_TEAMS)[number];
  onClick: () => void | Promise<void>;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "9px",
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "6px 4px",
        borderRadius: "12px",
        transition: "transform 0.2s cubic-bezier(0.34,1.56,0.64,1)",
        transform: hovered ? "translateY(-4px) scale(1.05)" : "translateY(0) scale(1)",
        outline: "none",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <div
        style={{
          width: "100px",
          height: "100px",
          borderRadius: "50%",
          background: hovered ? `${team.color}10` : "#f4f4f5",
          border: `2px solid ${hovered ? team.color : "#e4e4e7"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: hovered ? `0 4px 16px ${team.color}28` : "none",
          transition: "all 0.18s ease",
          overflow: "hidden",
        }}
      >
        <Image
          src={`/logos/nba/${team.abbreviation.toLowerCase()}.png`}
          alt={team.name}
          width={64}
          height={64}
          style={{ objectFit: "contain" }}
        />
      </div>

      <div style={{ textAlign: "center", lineHeight: 1.25 }}>
        <div
          style={{
            fontSize: "11px",
            fontWeight: 600,
            fontFamily: "'Oswald', sans-serif",
            letterSpacing: "0.04em",
            color: hovered ? team.color : "#18181b",
            transition: "color 0.15s ease",
            whiteSpace: "nowrap",
          }}
        >
          {team.city}
        </div>
        <div
          style={{
            fontSize: "10px",
            color: "#a1a1aa",
            fontFamily: "'DM Sans', sans-serif",
            marginTop: "1px",
          }}
        >
          {team.name}
        </div>
      </div>
    </button>
  );
}

export default function NBATeamSelectorPage() {
  const router = useRouter();
  const [activeConference, setActiveConference] = useState<"ALL" | "East" | "West">("ALL");

  useEffect(() => {
    async function checkExistingTeam() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('user_team')
        .select('team_id')
        .eq('user_id', user.id)
        .eq('sport', 'nba')
        .single()
      if (data?.team_id) {
        router.push(`/nba/${data.team_id}`)
      }
    }
    checkExistingTeam()
  }, [])

  const filteredDivisions = DIVISIONS.filter((div) => {
    if (activeConference === "ALL") return true;
    const east = ["Atlantic", "Central", "Southeast"];
    return activeConference === "East" ? east.includes(div) : !east.includes(div);
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #fafafa; }
        .page { min-height: 100vh; background: #fafafa; padding: 56px 24px 80px; }
        .inner { max-width: 880px; margin: 0 auto; }
        .back-btn {
          display: inline-flex; align-items: center; gap: 5px;
          font-family: 'DM Sans', sans-serif; font-size: 12px; color: #a1a1aa;
          background: none; border: none; cursor: pointer; padding: 0;
          margin-bottom: 24px; transition: color 0.15s;
        }
        .back-btn:hover { color: #18181b; }
        .header { text-align: center; margin-bottom: 40px; }
        .eyebrow {
          font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 500;
          letter-spacing: 0.16em; text-transform: uppercase; color: #a1a1aa; margin-bottom: 10px;
        }
        .headline {
          font-family: 'Oswald', sans-serif; font-size: clamp(30px, 5vw, 50px); font-weight: 700;
          color: #18181b; letter-spacing: -0.01em; line-height: 1.05; margin-bottom: 10px;
        }
        .headline em { font-style: normal; color: #e8291c; }
        .subhead { font-family: 'DM Sans', sans-serif; font-size: 14px; color: #71717a; font-weight: 300; }
        .toggle-wrap { display: flex; justify-content: center; gap: 6px; margin-bottom: 44px; }
        .toggle-btn {
          font-family: 'Oswald', sans-serif; font-size: 12px; font-weight: 500; letter-spacing: 0.07em;
          padding: 7px 20px; border-radius: 100px; border: 1.5px solid #e4e4e7;
          background: #fff; color: #71717a; cursor: pointer; transition: all 0.15s ease;
        }
        .toggle-btn:hover { border-color: #a1a1aa; color: #18181b; }
        .toggle-btn.active { background: #18181b; border-color: #18181b; color: #fff; }
        .division-block { margin-bottom: 32px; }
        .division-label {
          font-family: 'DM Sans', sans-serif; font-size: 10px; font-weight: 500;
          letter-spacing: 0.14em; text-transform: uppercase; color: #a1a1aa; margin-bottom: 16px;
          display: flex; align-items: center; gap: 10px;
        }
        .division-label::after { content: ''; flex: 1; height: 1px; background: #e4e4e7; }
        .teams-row { display: flex; gap: 4px; flex-wrap: wrap; justify-content: center; }
        .team-slot { flex: 1; min-width: 86px; max-width: 120px; display: flex; justify-content: center; }
        @media (max-width: 540px) {
          .team-slot { min-width: 72px; }
          .page { padding: 36px 16px 60px; }
        }
      `}</style>

      <div className="page">
        <div className="inner">
          <button className="back-btn" onClick={() => router.push('/')}>
            🏆 All Sports
          </button>

          <div className="header">
            <p className="eyebrow">NBA · 2025-26 Season</p>
            <h1 className="headline">Choose Your <em>Team</em></h1>
            <p className="subhead">Scores, stats &amp; news — For Your Favorite Team</p>
          </div>

          <div className="toggle-wrap">
            {(["ALL", "East", "West"] as const).map((c) => (
              <button
                key={c}
                className={`toggle-btn ${activeConference === c ? "active" : ""}`}
                onClick={() => setActiveConference(c)}
              >
                {c === "ALL" ? "All Teams" : c === "East" ? "Eastern Conference" : "Western Conference"}
              </button>
            ))}
          </div>

          {filteredDivisions.map((division) => {
            const teams = NBA_TEAMS.filter((t) => t.division === division);
            return (
              <div key={division} className="division-block">
                <div className="division-label">{division}</div>
                <div className="teams-row">
                  {teams.map((team) => (
                    <div key={team.espnId} className="team-slot">
                      <TeamBubble
                        team={team}
                        onClick={async () => {
                          const { data: { user } } = await supabase.auth.getUser()
                          if (user) {
                            await supabase.from('user_team').upsert({
                              user_id: user.id,
                              team_id: team.espnId,
                              sport: 'nba',
                            }, { onConflict: 'user_id,sport' })
                          }
                          router.push(`/nba/${team.espnId}`)
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}