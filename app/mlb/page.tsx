"use client";
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const MLB_TEAMS = [
  { espnId: "2",  name: "Red Sox",      abbreviation: "BOS", city: "Boston",        color: "#BD3039", league: "AL", division: "AL East" },
  { espnId: "10", name: "Yankees",      abbreviation: "NYY", city: "New York",      color: "#003087", league: "AL", division: "AL East" },
  { espnId: "14",  name: "Blue Jays",    abbreviation: "TOR", city: "Toronto",       color: "#134A8E", league: "AL", division: "AL East" },
  { espnId: "1", name: "Orioles",      abbreviation: "BAL", city: "Baltimore",     color: "#DF4601", league: "AL", division: "AL East" },
  { espnId: "30", name: "Rays",         abbreviation: "TB",  city: "Tampa Bay",     color: "#092C5C", league: "AL", division: "AL East" },
  { espnId: "5",  name: "Guardians",    abbreviation: "CLE", city: "Cleveland",     color: "#00385D", league: "AL", division: "AL Central" },
  { espnId: "7",  name: "Royals",       abbreviation: "KC",  city: "Kansas City",   color: "#004687", league: "AL", division: "AL Central" },
  { espnId: "9",  name: "Twins",        abbreviation: "MIN", city: "Minnesota",     color: "#002B5C", league: "AL", division: "AL Central" },
  { espnId: "6", name: "Tigers",       abbreviation: "DET", city: "Detroit",       color: "#0C2340", league: "AL", division: "AL Central" },
  { espnId: "4", name: "White Sox",    abbreviation: "CHW", city: "Chicago",       color: "#27251F", league: "AL", division: "AL Central" },
  { espnId: "13", name: "Rangers",      abbreviation: "TEX", city: "Texas",         color: "#003278", league: "AL", division: "AL West" },
  { espnId: "18",  name: "Astros",       abbreviation: "HOU", city: "Houston",       color: "#002D62", league: "AL", division: "AL West" },
  { espnId: "12", name: "Mariners",     abbreviation: "SEA", city: "Seattle",       color: "#0C2C56", league: "AL", division: "AL West" },
  { espnId: "3",  name: "Angels",       abbreviation: "LAA", city: "Los Angeles",   color: "#BA0021", league: "AL", division: "AL West" },
  { espnId: "11", name: "Athletics",    abbreviation: "ATH", city: "Oakland",       color: "#003831", league: "AL", division: "AL West" },
  { espnId: "15", name: "Braves",       abbreviation: "ATL", city: "Atlanta",       color: "#13274F", league: "NL", division: "NL East" },
  { espnId: "22", name: "Phillies",     abbreviation: "PHI", city: "Philadelphia",  color: "#E81828", league: "NL", division: "NL East" },
  { espnId: "21", name: "Mets",         abbreviation: "NYM", city: "New York",      color: "#002D72", league: "NL", division: "NL East" },
  { espnId: "20", name: "Nationals",    abbreviation: "WSH", city: "Washington",    color: "#AB0003", league: "NL", division: "NL East" },
  { espnId: "28", name: "Marlins",      abbreviation: "MIA", city: "Miami",         color: "#00A3E0", league: "NL", division: "NL East" },
  { espnId: "8",  name: "Brewers",      abbreviation: "MIL", city: "Milwaukee",     color: "#12284B", league: "NL", division: "NL Central" },
  { espnId: "16",  name: "Cubs",         abbreviation: "CHC", city: "Chicago",       color: "#0E3386", league: "NL", division: "NL Central" },
  { espnId: "24", name: "Cardinals",    abbreviation: "STL", city: "St. Louis",     color: "#C41E3A", league: "NL", division: "NL Central" },
  { espnId: "17", name: "Reds",         abbreviation: "CIN", city: "Cincinnati",    color: "#C6011F", league: "NL", division: "NL Central" },
  { espnId: "23", name: "Pirates",      abbreviation: "PIT", city: "Pittsburgh",    color: "#27251F", league: "NL", division: "NL Central" },
  { espnId: "19", name: "Dodgers",      abbreviation: "LAD", city: "Los Angeles",   color: "#005A9C", league: "NL", division: "NL West" },
  { espnId: "29", name: "Diamondbacks", abbreviation: "ARI", city: "Arizona",       color: "#A71930", league: "NL", division: "NL West" },
  { espnId: "26", name: "Giants",       abbreviation: "SF",  city: "San Francisco", color: "#FD5A1E", league: "NL", division: "NL West" },
  { espnId: "27", name: "Rockies",      abbreviation: "COL", city: "Colorado",      color: "#333366", league: "NL", division: "NL West" },
  { espnId: "25", name: "Padres",       abbreviation: "SD",  city: "San Diego",     color: "#2F241D", league: "NL", division: "NL West" },
] as const;


type Division = "AL East" | "AL Central" | "AL West" | "NL East" | "NL Central" | "NL West";
const DIVISIONS: Division[] = ["AL East", "AL Central", "AL West", "NL East", "NL Central", "NL West"];

function TeamBubble({
  team,
  onClick,
}: {
  team: (typeof MLB_TEAMS)[number];
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
      {/* Circle bubble */}
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
          src={`/logos/mlb/${team.abbreviation.toLowerCase()}.png`}
          alt={team.name}
          width={64}
          height={64}
          style={{ objectFit: "contain" }}
        />
      </div>

      {/* Team name */}
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

export default function TeamSelectorPage() {
  const router = useRouter();
  const [activeLeague, setActiveLeague] = useState<"ALL" | "AL" | "NL">("ALL");
  useEffect(() => {
  async function checkExistingTeam() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('user_team')
      .select('team_id')
      .eq('user_id', user.id)
      .single()
    if (data?.team_id) {
      router.push(`/team/${data.team_id}`)
    }
  }
  checkExistingTeam()
}, [])

  const filteredDivisions = DIVISIONS.filter((div) =>
    activeLeague === "ALL" ? true : div.startsWith(activeLeague)
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #fafafa; }

        .page {
          min-height: 100vh;
          background: #fafafa;
          padding: 56px 24px 80px;
        }

        .inner {
          max-width: 880px;
          margin: 0 auto;
        }

        .header {
          text-align: center;
          margin-bottom: 40px;
        }

        .eyebrow {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #a1a1aa;
          margin-bottom: 10px;
        }

        .headline {
          font-family: 'Oswald', sans-serif;
          font-size: clamp(30px, 5vw, 50px);
          font-weight: 700;
          color: #18181b;
          letter-spacing: -0.01em;
          line-height: 1.05;
          margin-bottom: 10px;
        }

        .headline em {
          font-style: normal;
          color: #e8291c;
        }

        .subhead {
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          color: #71717a;
          font-weight: 300;
        }

        .toggle-wrap {
          display: flex;
          justify-content: center;
          gap: 6px;
          margin-bottom: 44px;
        }

        .toggle-btn {
          font-family: 'Oswald', sans-serif;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.07em;
          padding: 7px 20px;
          border-radius: 100px;
          border: 1.5px solid #e4e4e7;
          background: #fff;
          color: #71717a;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .toggle-btn:hover {
          border-color: #a1a1aa;
          color: #18181b;
        }

        .toggle-btn.active {
          background: #18181b;
          border-color: #18181b;
          color: #fff;
        }

        .division-block {
          margin-bottom: 32px;
        }

        .division-label {
          font-family: 'DM Sans', sans-serif;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #a1a1aa;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .division-label::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #e4e4e7;
        }

        .teams-row {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .team-slot {
          flex: 1;
          min-width: 86px;
          max-width: 120px;
          display: flex;
          justify-content: center;
        }

        @media (max-width: 540px) {
          .team-slot { min-width: 72px; }
          .page { padding: 36px 16px 60px; }
        }
      `}</style>

      <div className="page">
        <div className="inner">
          <div className="header">
            <p className="eyebrow">MLB · 2026 Season</p>
            <h1 className="headline">Choose Your <em>Team</em></h1>
            <p className="subhead">Scores, stats &amp; news — For Your Favorite Team </p>
          </div>

          <div className="toggle-wrap">
            {(["ALL", "AL", "NL"] as const).map((l) => (
              <button
                key={l}
                className={`toggle-btn ${activeLeague === l ? "active" : ""}`}
                onClick={() => setActiveLeague(l)}
              >
                {l === "ALL" ? "All Teams" : l === "AL" ? "American League" : "National League"}
              </button>
            ))}
          </div>

          {filteredDivisions.map((division) => {
            const teams = MLB_TEAMS.filter((t) => t.division === division);
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
                                  team_id: team.espnId
                                })
                              }
                              router.push(`/team/${team.espnId}`)
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
