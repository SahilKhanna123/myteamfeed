import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// In-memory cache — survives repeated clicks within the same server process.
// ---------------------------------------------------------------------------
const cache = new Map<string, { articles: any[]; ts: number }>();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes in ms

export async function GET(req: NextRequest) {
  const team = req.nextUrl.searchParams.get("team");
  if (!team) return NextResponse.json({ articles: [] });

  // ── Serve from cache if still fresh ──────────────────────────────────────
  const cached = cache.get(team);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    console.log(`[news] cache hit for "${team}"`);
    return NextResponse.json({ articles: cached.articles });
  }

  const API_KEY = process.env.NEWS_API_KEY;

  // Used as a PREFERENCE boost during sorting, not a hard filter.
  const PREFERRED_DOMAINS = new Set([
    "espn.com", "mlb.com", "bleacherreport.com", "cbssports.com",
    "nbcsports.com", "sportingnews.com", "si.com", "usatoday.com",
    "theathletic.com", "nytimes.com", "washingtonpost.com", "nypost.com",
    "apnews.com", "reuters.com", "baseball-reference.com",
  ]);

  // Hard-block low quality / off-topic domains only
  const BLOCKED_DOMAINS = [
    "winnipegsun.com", "winnipegfreepress.com", "torontosun.com",
    "canoe.com", "ottawacitizen.com", "montrealgazette.com",
  ].join(",");

  const JUNK_KEYWORDS = [
    "odds", "betting", "bet ", "picks", "prediction", "predictions",
    "parlay", "sportsbook", "wager", "fantasy", "prop bet", "moneyline",
    "over/under", "spread", "dfs", "draftkings", "fanduel",
  ];

  const OPPONENT_PATTERNS = [
    "pitches against",
    "starts against",
    "to face the",
    "facing the",
    "set to face",
  ];

  function daysAgo(n: number) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().split("T")[0];
  }

  const teamParts = team.split(" ");
  const teamShort = teamParts[teamParts.length - 1]; // e.g. "Rays"
  const teamLower = team.toLowerCase();
  const teamShortLower = teamShort.toLowerCase();

  function isJunk(a: any): boolean {
    const text = `${a.title ?? ""} ${a.description ?? ""}`.toLowerCase();
    return JUNK_KEYWORDS.some((kw) => text.includes(kw));
  }

  function isStale(a: any): boolean {
    if (!a.publishedAt) return true;
    const published = new Date(a.publishedAt).getTime();
    const cutoff = Date.now() - 3 * 24 * 60 * 60 * 1000;
    return published < cutoff;
  }

  function isAboutTeam(a: any): boolean {
    const title = (a.title ?? "").toLowerCase();
    const desc = (a.description ?? "").toLowerCase();

    const mentioned =
      title.includes(teamLower) ||
      title.includes(teamShortLower) ||
      desc.includes(teamLower) ||
      desc.includes(teamShortLower);
    if (!mentioned) return false;

    for (const phrase of OPPONENT_PATTERNS) {
      if (
        title.includes(`${phrase} ${teamShortLower}`) ||
        title.includes(`${phrase} the ${teamShortLower}`) ||
        title.includes(`${phrase} ${teamLower}`) ||
        title.includes(`${phrase} the ${teamLower}`)
      ) {
        return false;
      }
    }

    return true;
  }

  function getDomain(url: string): string {
    try {
      return new URL(url).hostname.replace("www.", "");
    } catch {
      return "";
    }
  }

  function parseArticles(raw: any[], seen: Set<string>): any[] {
    const filtered = raw.filter((a: any) => {
      if (a.title === "[Removed]" || !a.url) return false;
      if (!isAboutTeam(a)) return false;
      if (isJunk(a)) return false;
      if (isStale(a)) return false;
      if (seen.has(a.url) || seen.has(a.title)) return false;
      return true;
    });

    // Sort: preferred domains first, then most recent
    filtered.sort((a, b) => {
      const aPreferred = PREFERRED_DOMAINS.has(getDomain(a.url)) ? 0 : 1;
      const bPreferred = PREFERRED_DOMAINS.has(getDomain(b.url)) ? 0 : 1;
      if (aPreferred !== bPreferred) return aPreferred - bPreferred;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });

    return filtered.slice(0, 2).map((a: any) => {
      seen.add(a.url);
      seen.add(a.title);
      return {
        id: a.url,
        source: a.source?.name ?? "Unknown",
        title: a.title,
        summary: a.description ?? "",
        url: a.url,
        time: new Date(a.publishedAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
      };
    });
  }

  // Single broad fetch — no domain allowlist, just block the known bad ones
  async function fetchBroad(query: string, from: string): Promise<any[]> {
    const url = new URL("https://newsapi.org/v2/everything");
    url.searchParams.set("apiKey", API_KEY!);
    url.searchParams.set("q", query);
    url.searchParams.set("language", "en");
    url.searchParams.set("sortBy", "publishedAt");
    url.searchParams.set("pageSize", "40"); // more results = more variety to sort through
    url.searchParams.set("from", from);
    url.searchParams.set("excludeDomains", BLOCKED_DOMAINS);
    const res = await fetch(url.toString(), { next: { revalidate: 900 } });
    const json = await res.json();
    console.log(`[news] "${query}" from ${from}: ${json.totalResults ?? 0} results`);
    return json.articles ?? [];
  }

  const seen = new Set<string>();
  let articles: any[] = [];

  // Pass 1: full team name, last 2 days
  const raw1 = await fetchBroad(`"${team}" MLB`, daysAgo(2));
  articles = parseArticles(raw1, seen);

  // Pass 2: nickname only, last 2 days — catches short-name-only headlines
  if (articles.length < 2) {
    const raw2 = await fetchBroad(`"${teamShort}" MLB baseball`, daysAgo(2));
    const more = parseArticles(raw2, seen);
    articles = [...articles, ...more].slice(0, 2);
  }

  // Pass 3: widen to 7 days
  if (articles.length < 2) {
    const raw3 = await fetchBroad(`${team} MLB`, daysAgo(7));
    const more = parseArticles(raw3, seen);
    articles = [...articles, ...more].slice(0, 2);
  }

  // Pass 4: nickname only, 7 days — last resort
  if (articles.length < 2) {
    const raw4 = await fetchBroad(`${teamShort} baseball`, daysAgo(7));
    const more = parseArticles(raw4, seen);
    articles = [...articles, ...more].slice(0, 2);
  }

  // ── Store result in memory cache before returning ─────────────────────────
  cache.set(team, { articles, ts: Date.now() });
  console.log(`[news] cache set for "${team}" (${articles.length} articles)`);

  return NextResponse.json({ articles });
}