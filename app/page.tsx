"use client";

import { useRouter } from "next/navigation";

const SPORTS = [
  {
    key: "mlb",
    name: "Baseball",
    league: "MLB",
    route: "/mlb",
    emoji: "⚾",
    color: "#BD3039",
    available: true,
  },
  {
    key: "nba",
    name: "Basketball",
    league: "NBA",
    route: "/nba",
    emoji: "🏀",
    color: "#C9510C",
    available: true,
  },
  {
    key: "nfl",
    name: "Football",
    league: "NFL",
    route: "/nfl",
    emoji: "🏈",
    color: "#1a3c6e",
    available: false,
  },
  {
    key: "nhl",
    name: "Hockey",
    league: "NHL",
    route: "/nhl",
    emoji: "🏒",
    color: "#000000",
    available: false,
  },
];

export default function HubPage() {
  const router = useRouter();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #fafafa; }

        .page {
          min-height: 100vh;
          background: #fafafa;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 24px;
        }

        .header {
          text-align: center;
          margin-bottom: 48px;
        }

        .eyebrow {
          font-family: 'DM Sans', sans-serif;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #a1a1aa;
          margin-bottom: 10px;
        }

        .headline {
          font-family: 'Oswald', sans-serif;
          font-size: clamp(36px, 6vw, 58px);
          font-weight: 700;
          color: #18181b;
          letter-spacing: -0.01em;
          line-height: 1;
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

        /* Sport cards grid */
        .grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px;
          width: 100%;
          max-width: 420px;
        }

        .sport-card {
          position: relative;
          background: #fff;
          border: 1.5px solid #e4e4e7;
          border-radius: 16px;
          padding: 28px 20px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.34,1.56,0.64,1);
          outline: none;
          text-align: center;
        }

        .sport-card.available:hover {
          transform: translateY(-4px) scale(1.03);
          border-color: var(--card-color);
          box-shadow: 0 8px 24px color-mix(in srgb, var(--card-color) 20%, transparent);
        }

        .sport-card.unavailable {
          cursor: default;
          opacity: 0.45;
        }

        .sport-emoji {
          font-size: 36px;
          line-height: 1;
        }

        .sport-league {
          font-family: 'Oswald', sans-serif;
          font-size: 18px;
          font-weight: 700;
          color: #18181b;
          letter-spacing: 0.02em;
          transition: color 0.15s ease;
        }

        .sport-card.available:hover .sport-league {
          color: var(--card-color);
        }

        .sport-name {
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
          color: #a1a1aa;
          font-weight: 400;
          margin-top: -4px;
        }

        .coming-soon {
          position: absolute;
          top: 10px;
          right: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 9px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          background: #f4f4f5;
          color: #a1a1aa;
          padding: 3px 7px;
          border-radius: 100px;
        }

        @media (max-width: 400px) {
          .grid { grid-template-columns: 1fr 1fr; gap: 10px; }
        }
      `}</style>

      <div className="page">
        <div className="header">
          <p className="eyebrow">MyTeamFeed</p>
          <h1 className="headline">Your <em>Sport.</em><br />Your Team.</h1>
          <p className="subhead">Pick a league to get started</p>
        </div>

        <div className="grid">
          {SPORTS.map((sport) => (
            <button
              key={sport.key}
              className={`sport-card ${sport.available ? "available" : "unavailable"}`}
              style={{ "--card-color": sport.color } as React.CSSProperties}
              onClick={() => sport.available && router.push(sport.route)}
              disabled={!sport.available}
            >
              {!sport.available && <span className="coming-soon">Soon</span>}
              <span className="sport-emoji">{sport.emoji}</span>
              <span className="sport-league">{sport.league}</span>
              <span className="sport-name">{sport.name}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
