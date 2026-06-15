(() => {
  if (window.location.hostname === "localhost" || window.__myteamfeed_injected) return;
  window.__myteamfeed_injected = true;

  let widget = null;
  let isDragging = false;
  let dragOffsetX = 0;
  let dragOffsetY = 0;
  let isMinimized = false;
  let currentScore = null;
  let currentTeam = null;
  let flashTimeout = null;

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

  function getTeam(id) {
    return MLB_TEAMS.find((t) => t.espnId === id) ?? null;
  }

  function logoUrl(espnTeamId) {
    return `https://a.espncdn.com/i/teamlogos/mlb/500/scoreboard/${espnTeamId}.png`;
  }

  function logoImg(teamId, abbr) {
    return `<img class="mtf-logo" src="${logoUrl(teamId)}" alt="${abbr}"
      onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
      <span class="mtf-logo-fallback" style="display:none">${abbr}</span>`;
  }

  function statusPill(score) {
    if (!score) return "";
    if (score.status === "Live") {
      return `<span class="mtf-pill mtf-pill--live">🔴 ${score.inning ?? "Live"}</span>`;
    }
    if (score.status === "Final") {
      const badge = score.result === "W"
        ? `<span class="mtf-result mtf-result--w">W</span>`
        : score.result === "L"
        ? `<span class="mtf-result mtf-result--l">L</span>`
        : "";
      return `<span class="mtf-pill mtf-pill--final">Final</span>${badge}`;
    }
    return `<span class="mtf-pill mtf-pill--sched">Scheduled</span>`;
  }

  function baseDiamond(bases) {
    if (!bases) return "";
    const on = (b) => b ? "var(--mtf-color)" : "#3f3f46";
    return `
      <svg class="mtf-diamond" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <rect x="14" y="2" width="12" height="12" rx="1.5" transform="rotate(45 20 8)" fill="${on(bases.second)}" />
        <rect x="2"  y="14" width="12" height="12" rx="1.5" transform="rotate(45 8 20)"  fill="${on(bases.third)}"  />
        <rect x="26" y="14" width="12" height="12" rx="1.5" transform="rotate(45 32 20)" fill="${on(bases.first)}"  />
      </svg>`;
  }

  function countDots(count) {
    if (!count) return "";
    const dot = (filled, color) =>
      `<span class="mtf-dot" style="background:${filled ? color : "#3f3f46"}"></span>`;
    return `
      <div class="mtf-count">
        <div class="mtf-count-group">
          ${[0,1,2,3].map(i => dot(i < count.balls, "#22c55e")).join("")}
          <span class="mtf-count-lbl">B</span>
        </div>
        <div class="mtf-count-group">
          ${[0,1,2].map(i => dot(i < count.strikes, "#ef4444")).join("")}
          <span class="mtf-count-lbl">S</span>
        </div>
        <div class="mtf-count-group">
          ${[0,1,2].map(i => dot(i < count.outs, "#f59e0b")).join("")}
          <span class="mtf-count-lbl">O</span>
        </div>
      </div>`;
  }

  function matchupSection(score) {
    if (!score || score.status !== "Live") return "";
    const rows = [];
    if (score.pitcher) {
      rows.push(`
        <div class="mtf-matchup-row">
          <span class="mtf-matchup-label">Pitching</span>
          <span class="mtf-matchup-name">${score.pitcher.name}</span>
          ${score.pitcher.era != null ? `<span class="mtf-matchup-stat">${score.pitcher.era} ERA</span>` : ""}
        </div>`);
    }
    if (score.batter) {
      rows.push(`
        <div class="mtf-matchup-row">
          <span class="mtf-matchup-label">At Bat</span>
          <span class="mtf-matchup-name">${score.batter.name}</span>
          ${score.batter.avg != null ? `<span class="mtf-matchup-stat">.${String(Math.round(score.batter.avg * 1000)).padStart(3,"0")}</span>` : ""}
        </div>`);
    }
    if (!rows.length) return "";
    return `<div class="mtf-matchup">${rows.join("")}</div>`;
  }

  function lineupSection(score) {
    if (!score || score.status !== "Scheduled") return "";
    const away = score.awayLineup ?? [];
    const home = score.homeLineup ?? [];
    if (!away.length && !home.length) {
      return `<div class="mtf-lineups"><div class="mtf-no-lineup">Lineup not yet announced</div></div>`;
    }
    const side = (players, label) => `
      <div class="mtf-lineup-col">
        <div class="mtf-lineup-team">${label}</div>
      </div>`;
    const playerRow = (p, i) => `
      <div class="mtf-lineup-player">
        <span class="mtf-lineup-num">${i + 1}</span>
        <span class="mtf-lineup-pname">${p.name}</span>
        <span class="mtf-lineup-pos">${p.position ?? ""}</span>
      </div>`;

    const maxLen = Math.max(away.length, home.length);
    return `
      <div class="mtf-lineups">
        <div class="mtf-lineup-header">
          <div class="mtf-lineup-col"><div class="mtf-lineup-team">${score.awayTeam.abbreviation}</div></div>
          <div class="mtf-lineup-col"><div class="mtf-lineup-team">${score.homeTeam.abbreviation}</div></div>
        </div>
        <div class="mtf-lineup-rows">
          <div class="mtf-lineup-side">
            ${away.slice(0,9).map((p,i) => playerRow(p,i)).join("")}
          </div>
          <div class="mtf-lineup-side">
            ${home.slice(0,9).map((p,i) => playerRow(p,i)).join("")}
          </div>
        </div>
      </div>`;
  }

  function renderWidget(score, team) {
    if (!widget) return;
    widget.style.setProperty("--mtf-color", team?.color ?? "#18181b");

    if (isMinimized) {
  // Force widget to shrink to pill — no body, no footer, no leftover space
widget.classList.add("mtf-is-minimized");

  const scoreText = score
    ? `${score.awayTeam.abbreviation} ${score.awayTeam.score ?? "–"} · ${score.homeTeam.abbreviation} ${score.homeTeam.score ?? "–"}`
    : "No game";
  const liveDot = score?.status === "Live" ? `<span class="mtf-live-dot"></span>` : "";

  widget.innerHTML = `
    <div class="mtf-mini" id="mtf-mini">
      <span class="mtf-mini-abbr">${team?.abbreviation ?? "MLB"}</span>
      <span class="mtf-mini-divider"></span>
      <span class="mtf-mini-score">${scoreText}</span>
      ${liveDot}
      <button class="mtf-expand-btn" id="mtf-expand" title="Expand">▲</button>
    </div>`;

  document.getElementById("mtf-expand")?.addEventListener("click", (e) => {
    e.stopPropagation();
    isMinimized = false;
    widget.classList.remove("mtf-is-minimized");
    widget.style.width = "260px";
    widget.style.height = "";
    widget.style.maxHeight = "";
    widget.style.borderRadius = "";
      widget.style.display = "";       // ADD THIS — resets back to CSS flex
  widget.style.minHeight = ""; 
    renderWidget(currentScore, currentTeam);
  });
  document.getElementById("mtf-mini")?.addEventListener("mousedown", startDrag);
  return;
}

    const noGame = !score;

    // Build score section
    let scoreHTML = "";
    if (!noGame) {
      const awayDim = score.status === "Final" && score.awayTeam.score !== null && score.homeTeam.score !== null && score.awayTeam.score < score.homeTeam.score;
      const homeDim = score.status === "Final" && score.homeTeam.score !== null && score.awayTeam.score !== null && score.homeTeam.score < score.awayTeam.score;

      scoreHTML = `
        <div class="mtf-scoreline">
          <div class="mtf-team-col">
            ${score.awayTeam.espnId ? logoImg(score.awayTeam.espnId, score.awayTeam.abbreviation) : `<span class="mtf-logo-fallback">${score.awayTeam.abbreviation}</span>`}
            <span class="mtf-score ${awayDim ? "mtf-score--dim" : ""}">
              ${score.status === "Scheduled" ? "–" : (score.awayTeam.score ?? "–")}
            </span>
          </div>
          <span class="mtf-sep">·</span>
          <div class="mtf-team-col">
            ${score.homeTeam.espnId ? logoImg(score.homeTeam.espnId, score.homeTeam.abbreviation) : `<span class="mtf-logo-fallback">${score.homeTeam.abbreviation}</span>`}
            <span class="mtf-score ${homeDim ? "mtf-score--dim" : ""}">
              ${score.status === "Scheduled" ? "–" : (score.homeTeam.score ?? "–")}
            </span>
          </div>
        </div>
        ${score.status === "Scheduled" && score.gameTime ? `<div class="mtf-gametime">${score.gameTime}</div>` : ""}`;
    }

    widget.innerHTML = `
      <div class="mtf-header" id="mtf-drag-handle">
        <div class="mtf-header-left">
          <span class="mtf-team-name">${team ? `${team.city} ${team.name}` : "No team set"}</span>
          ${score ? statusPill(score) : ""}
        </div>
        <div class="mtf-header-right">
          <button class="mtf-icon-btn" id="mtf-minimize" title="Minimize">−</button>
          <button class="mtf-icon-btn" id="mtf-close" title="Close">×</button>
        </div>
      </div>

      <div class="mtf-body">
        ${noGame
          ? `<div class="mtf-no-game">No game today</div>`
          : scoreHTML
        }
        ${!noGame && score.status === "Live" ? `
          <div class="mtf-live-section">
            <div class="mtf-live-row">
              ${baseDiamond(score.bases)}
              ${countDots(score.count)}
            </div>
            ${matchupSection(score)}
            ${score.lastPlay ? `
              <div class="mtf-last-play">
                <span class="mtf-last-play-label">Last play</span>${score.lastPlay}
              </div>` : ""}
          </div>` : ""}

        ${!noGame && score.status === "Scheduled" ? lineupSection(score) : ""}

        ${!noGame ? `<div class="mtf-game-date">${score.gameDate}</div>` : ""}
      </div>

      <div class="mtf-footer">
        <span class="mtf-updated" id="mtf-updated">Updating…</span>
        <button class="mtf-refresh-btn" id="mtf-refresh">↻ Refresh</button>
      </div>`;

    updateTimestamp();

    document.getElementById("mtf-drag-handle")?.addEventListener("mousedown", startDrag);
    document.getElementById("mtf-minimize")?.addEventListener("click", (e) => {
      e.stopPropagation();
      isMinimized = true;
      renderWidget(currentScore, currentTeam);
    });
    document.getElementById("mtf-close")?.addEventListener("click", (e) => {
      e.stopPropagation();
      widget.style.display = "none";
      chrome.storage.local.set({ widgetHidden: true });
    });
    document.getElementById("mtf-refresh")?.addEventListener("click", (e) => {
      e.stopPropagation();
      const btn = document.getElementById("mtf-refresh");
      if (btn) btn.textContent = "↻ …";
      chrome.runtime.sendMessage({ type: "REFRESH" }, () => {
        if (btn) btn.textContent = "↻ Refresh";
      });
    });
  }

  function updateTimestamp() {
    const el = document.getElementById("mtf-updated");
    if (!el) return;
    chrome.storage.local.get("lastUpdated", ({ lastUpdated }) => {
      if (!lastUpdated) { el.textContent = ""; return; }
      const diff = Math.floor((Date.now() - lastUpdated) / 1000);
      el.textContent = diff < 60 ? "Just updated" : `${Math.floor(diff / 60)}m ago`;
    });
  }

  function flashUpdate() {
    if (!widget || isMinimized) return;
    widget.classList.add("mtf-flash");
    clearTimeout(flashTimeout);
    flashTimeout = setTimeout(() => widget?.classList.remove("mtf-flash"), 800);
  }

  // ── Drag ─────────────────────────────────────────────────────────────────
  function startDrag(e) {
    if (e.button !== 0) return;
    isDragging = true;
    const rect = widget.getBoundingClientRect();
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;
    // Lock the size before dragging so it can't stretch
    
    widget.style.transition = "none";
    document.addEventListener("mousemove", onDrag);
    document.addEventListener("mouseup", stopDrag);
    e.preventDefault();
  }

  function onDrag(e) {
    if (!isDragging) return;
    const x = Math.max(0, Math.min(window.innerWidth - widget.offsetWidth, e.clientX - dragOffsetX));
    const y = Math.max(0, Math.min(window.innerHeight - widget.offsetHeight, e.clientY - dragOffsetY));
    widget.style.left = x + "px";
    widget.style.top = y + "px";
    widget.style.right = "auto";
    widget.style.bottom = "auto";
    chrome.storage.local.set({ widgetPos: { x, y } });
  }

  function stopDrag() {
    isDragging = false;
    // Release the locked height so content can resize naturally again
     if (!isMinimized) widget.style.height = "";
    widget.style.transition = "";
    document.removeEventListener("mousemove", onDrag);
    document.removeEventListener("mouseup", stopDrag);
  }

  // ── Init ─────────────────────────────────────────────────────────────────
  async function init() {
    const { widgetHidden, widgetPos, cachedScore } =
      await chrome.storage.local.get(["widgetHidden", "widgetPos", "cachedScore"]);
    const { selectedTeamId } = await chrome.storage.sync.get("selectedTeamId");

    if (!selectedTeamId) return;

    currentTeam = getTeam(selectedTeamId);
    currentScore = cachedScore ?? null;

    widget = document.createElement("div");
    widget.id = "mtf-widget";
    widget.className = "mtf-widget";

    if (widgetPos) {
      widget.style.left = widgetPos.x + "px";
      widget.style.top = widgetPos.y + "px";
      widget.style.right = "auto";
      widget.style.bottom = "auto";
    }

    if (widgetHidden) widget.style.display = "none";

    document.body.appendChild(widget);
    renderWidget(currentScore, currentTeam);
  }

  // ── Messages from background ──────────────────────────────────────────────
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "SCORE_UPDATE") {
      const prev = currentScore;
      currentScore = msg.score;
      if (
        prev?.status === "Live" && msg.score?.status === "Live" &&
        (prev.homeTeam.score !== msg.score.homeTeam.score ||
         prev.awayTeam.score !== msg.score.awayTeam.score)
      ) flashUpdate();
      if (widget) renderWidget(currentScore, currentTeam);
    }
    if (msg.type === "SHOW_WIDGET" && widget) {
      widget.style.display = "";
      chrome.storage.local.set({ widgetHidden: false });
    }
    if (msg.type === "HIDE_WIDGET" && widget) {
      widget.style.display = "none";
    }
  });

  chrome.storage.onChanged.addListener((changes) => {
    if (changes.selectedTeamId) {
      currentTeam = getTeam(changes.selectedTeamId.newValue);
      currentScore = null;
      if (widget) renderWidget(null, currentTeam);
    }
  });

  init();
})();
