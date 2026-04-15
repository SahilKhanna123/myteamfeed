import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const team = req.nextUrl.searchParams.get("team");
  if (!team) return NextResponse.json({ articles: [] });

  const API_KEY = process.env.NEWS_API_KEY;

  const QUALITY_DOMAINS = [
    "espn.com", "mlb.com", "bleacherreport.com", "cbssports.com",
    "nbcsports.com", "sportingnews.com", "si.com", "usatoday.com",
    "theathletic.com", "nytimes.com", "washingtonpost.com", "nypost.com",
  ].join(",");

  const BLOCKED_DOMAINS = [
    "winnipegsun.com", "winnipegfreepress.com", "torontosun.com",
    "canoe.com", "ottawacitizen.com", "montrealgazette.com",
  ].join(",");

  const JUNK_KEYWORDS = [
    "odds", "betting", "bet ", "picks", "prediction", "predictions",
    "parlay", "sportsbook", "wager", "fantasy", "prop bet", "moneyline",
    "over/under", "spread", "dfs", "draftkings", "fanduel",
  ];

  // Patterns that indicate our team is the *opponent* in the article, not the subject.
  // e.g. "White Sox prospect to start against the Rays" should NOT appear on the Rays page.
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

  /**
   * Accept the article if our team is mentioned AND the title doesn't frame
   * the team purely as an opponent (e.g. "X pitches against the Rays").
   */
  function isAboutTeam(a: any): boolean {
    const title = (a.title ?? "").toLowerCase();
    const desc = (a.description ?? "").toLowerCase();

    const mentioned =
      title.includes(teamLower) ||
      title.includes(teamShortLower) ||
      desc.includes(teamLower) ||
      desc.includes(teamShortLower);
    if (!mentioned) return false;

    // Check if the title contains an opponent-framing phrase followed by our team name
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

  function parseArticles(raw: any[], seen: Set<string>): any[] {
    return raw
      .filter((a: any) => {
        if (a.title === "[Removed]" || !a.url) return false;
        if (!isAboutTeam(a)) return false;
        if (isJunk(a)) return false;
        if (isStale(a)) return false;
        if (seen.has(a.url) || seen.has(a.title)) return false;
        return true;
      })
      .slice(0, 2)
      .map((a: any) => {
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

  async function fetchQuality(query: string, from: string): Promise<any[]> {
    const url = new URL("https://newsapi.org/v2/everything");
    url.searchParams.set("apiKey", API_KEY!);
    url.searchParams.set("q", query);
    url.searchParams.set("language", "en");
    url.searchParams.set("sortBy", "publishedAt");
    url.searchParams.set("pageSize", "30");
    url.searchParams.set("from", from);
    url.searchParams.set("domains", QUALITY_DOMAINS);
    const res = await fetch(url.toString(), { cache: "no-store" });
    const json = await res.json();
    console.log(`[news] "${query}" from ${from}: ${json.totalResults ?? 0} results`);
    return json.articles ?? [];
  }

  async function fetchAny(query: string, from: string): Promise<any[]> {
    const url = new URL("https://newsapi.org/v2/everything");
    url.searchParams.set("apiKey", API_KEY!);
    url.searchParams.set("q", query);
    url.searchParams.set("language", "en");
    url.searchParams.set("sortBy", "publishedAt");
    url.searchParams.set("pageSize", "30");
    url.searchParams.set("from", from);
    url.searchParams.set("excludeDomains", BLOCKED_DOMAINS);
    const res = await fetch(url.toString(), { cache: "no-store" });
    const json = await res.json();
    return json.articles ?? [];
  }

  const seen = new Set<string>();
  let articles: any[] = [];

  // Pass 1: full team name, quality sources, last 2 days
  if (articles.length < 2) {
    const raw = await fetchQuality(`"${team}" MLB`, daysAgo(2));
    articles = parseArticles(raw, seen);
  }

  // Pass 2: team nickname only, quality sources, last 2 days
  if (articles.length < 2) {
    const raw = await fetchQuality(`"${teamShort}" MLB baseball`, daysAgo(2));
    const more = parseArticles(raw, seen);
    articles = [...articles, ...more].slice(0, 2);
  }

  // Pass 3: full team name, quality sources, last 7 days
  if (articles.length < 2) {
    const raw = await fetchQuality(`${team} MLB`, daysAgo(7));
    const more = parseArticles(raw, seen);
    articles = [...articles, ...more].slice(0, 2);
  }

  // Pass 4: nickname, any source, last 3 days
  if (articles.length < 2) {
    const raw = await fetchAny(`${teamShort} MLB baseball`, daysAgo(3));
    const more = parseArticles(raw, seen);
    articles = [...articles, ...more].slice(0, 2);
  }

  // Pass 5: any source, wider window — last resort
  if (articles.length < 1) {
    const raw = await fetchAny(`${team} baseball`, daysAgo(7));
    articles = parseArticles(raw, seen).slice(0, 2);
  }

  return NextResponse.json({ articles });
}