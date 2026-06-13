const MLB_TEAMS = [
  { espnId: "2",  name: "Red Sox",      abbreviation: "BOS", city: "Boston",        color: "#BD3039", division: "AL East" },
  { espnId: "10", name: "Yankees",      abbreviation: "NYY", city: "New York",      color: "#003087", division: "AL East" },
  { espnId: "14", name: "Blue Jays",    abbreviation: "TOR", city: "Toronto",       color: "#134A8E", division: "AL East" },
  { espnId: "1",  name: "Orioles",      abbreviation: "BAL", city: "Baltimore",     color: "#DF4601", division: "AL East" },
  { espnId: "30", name: "Rays",         abbreviation: "TB",  city: "Tampa Bay",     color: "#092C5C", division: "AL East" },
  { espnId: "5",  name: "Guardians",    abbreviation: "CLE", city: "Cleveland",     color: "#00385D", division: "AL Central" },
  { espnId: "7",  name: "Royals",       abbreviation: "KC",  city: "Kansas City",   color: "#004687", division: "AL Central" },
  { espnId: "9",  name: "Twins",        abbreviation: "MIN", city: "Minnesota",     color: "#002B5C", division: "AL Central" },
  { espnId: "6",  name: "Tigers",       abbreviation: "DET", city: "Detroit",       color: "#0C2340", division: "AL Central" },
  { espnId: "4",  name: "White Sox",    abbreviation: "CHW", city: "Chicago",       color: "#27251F", division: "AL Central" },
  { espnId: "13", name: "Rangers",      abbreviation: "TEX", city: "Texas",         color: "#003278", division: "AL West" },
  { espnId: "18", name: "Astros",       abbreviation: "HOU", city: "Houston",       color: "#002D62", division: "AL West" },
  { espnId: "12", name: "Mariners",     abbreviation: "SEA", city: "Seattle",       color: "#0C2C56", division: "AL West" },
  { espnId: "3",  name: "Angels",       abbreviation: "LAA", city: "Los Angeles",   color: "#BA0021", division: "AL West" },
  { espnId: "11", name: "Athletics",    abbreviation: "ATH", city: "Oakland",       color: "#003831", division: "AL West" },
  { espnId: "15", name: "Braves",       abbreviation: "ATL", city: "Atlanta",       color: "#13274F", division: "NL East" },
  { espnId: "22", name: "Phillies",     abbreviation: "PHI", city: "Philadelphia",  color: "#E81828", division: "NL East" },
  { espnId: "21", name: "Mets",         abbreviation: "NYM", city: "New York",      color: "#002D72", division: "NL East" },
  { espnId: "20", name: "Nationals",    abbreviation: "WSH", city: "Washington",    color: "#AB0003", division: "NL East" },
  { espnId: "28", name: "Marlins",      abbreviation: "MIA", city: "Miami",         color: "#00A3E0", division: "NL East" },
  { espnId: "8",  name: "Brewers",      abbreviation: "MIL", city: "Milwaukee",     color: "#12284B", division: "NL Central" },
  { espnId: "16", name: "Cubs",         abbreviation: "CHC", city: "Chicago",       color: "#0E3386", division: "NL Central" },
  { espnId: "24", name: "Cardinals",    abbreviation: "STL", city: "St. Louis",     color: "#C41E3A", division: "NL Central" },
  { espnId: "17", name: "Reds",         abbreviation: "CIN", city: "Cincinnati",    color: "#C6011F", division: "NL Central" },
  { espnId: "23", name: "Pirates",      abbreviation: "PIT", city: "Pittsburgh",    color: "#27251F", division: "NL Central" },
  { espnId: "19", name: "Dodgers",      abbreviation: "LAD", city: "Los Angeles",   color: "#005A9C", division: "NL West" },
  { espnId: "29", name: "Diamondbacks", abbreviation: "ARI", city: "Arizona",       color: "#A71930", division: "NL West" },
  { espnId: "26", name: "Giants",       abbreviation: "SF",  city: "San Francisco", color: "#FD5A1E", division: "NL West" },
  { espnId: "27", name: "Rockies",      abbreviation: "COL", city: "Colorado",      color: "#333366", division: "NL West" },
  { espnId: "25", name: "Padres",       abbreviation: "SD",  city: "San Diego",     color: "#2F241D", division: "NL West" },
];

let selectedId = null;

const grid = document.getElementById("team-grid");
const selectedDisplay = document.getElementById("selected-display");
const currentTeamDisplay = document.getElementById("current-team-display");
const btnSave = document.getElementById("btn-save");
const btnHide = document.getElementById("btn-hide");

// Build grid
MLB_TEAMS.forEach((team) => {
  const btn = document.createElement("button");
  btn.className = "team-btn";
  btn.dataset.id = team.espnId;
  btn.style.setProperty("--team-color", team.color);
  btn.innerHTML = `<span class="team-abbr">${team.abbreviation}</span>`;
  btn.title = `${team.city} ${team.name}`;
  btn.addEventListener("click", () => selectTeam(team.espnId));
  grid.appendChild(btn);
});

function selectTeam(id) {
  selectedId = id;
  document.querySelectorAll(".team-btn").forEach((b) => {
    b.classList.toggle("selected", b.dataset.id === id);
  });

  const team = MLB_TEAMS.find((t) => t.espnId === id);
  if (team) {
    document.documentElement.style.setProperty("--selected-color", team.color);
    selectedDisplay.style.display = "block";
    currentTeamDisplay.innerHTML = `
      <div class="current-color-bar" style="background:${team.color}"></div>
      <div>
        <div class="current-name">${team.city} ${team.name}</div>
        <div class="current-sub">${team.division}</div>
      </div>`;
  }
}

// Load saved team
chrome.storage.sync.get("selectedTeamId", ({ selectedTeamId }) => {
  if (selectedTeamId) selectTeam(selectedTeamId);
});

btnSave.addEventListener("click", async () => {
  if (!selectedId) return;
  await chrome.storage.sync.set({ selectedTeamId: selectedId });
  await chrome.storage.local.set({ widgetHidden: false });

  // Trigger refresh
  chrome.runtime.sendMessage({ type: "REFRESH" });

  // Show widget on active tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    chrome.tabs.sendMessage(tab.id, { type: "SHOW_WIDGET" }).catch(() => {});
  }

  window.close();
});

btnHide.addEventListener("click", async () => {
  await chrome.storage.local.set({ widgetHidden: true });
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) {
    chrome.tabs.sendMessage(tab.id, { type: "HIDE_WIDGET" }).catch(() => {});
  }
  window.close();
});
