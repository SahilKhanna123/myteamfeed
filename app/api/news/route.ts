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

  // ── Keywords that indicate betting/prediction content ──
  const JUNK_KEYWORDS = [
    "odds", "betting", "bet ", "picks", "prediction", "predictions",
    "parlay", "sportsbook", "wager", "fantasy", "prop bet", "moneyline",
    "over/under", "spread", "dfs", "draftkings", "fanduel",
  ];

  function daysAgo(n: number) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().split("T")[0];
  }

  function isJunk(a: any): boolean {
    const text = `${a.title ?? ""} ${a.description ?? ""}`.toLowerCase();
    return JUNK_KEYWORDS.some((kw) => text.includes(kw));
  }

  function parseArticles(raw: any[], seen: Set<string>): any[] {
    const teamLower = team.toLowerCase();
    return raw
      .filter((a: any) => {
        const title = (a.title ?? "").toLowerCase();
        const desc = (a.description ?? "").toLowerCase();

        // Must be real
        if (a.title === "[Removed]" || !a.url) return false;

        // Must mention the team
        if (!title.includes(teamLower) && !desc.includes(teamLower)) return false;

        // Must not be betting/prediction content
        if (isJunk(a)) return false;

        // Must not be a duplicate (by URL or title)
        if (seen.has(a.url) || seen.has(a.title)) return false;

        return true;
      })
      .slice(0, 2)
      .map((a: any) => {
        // Mark as seen so later passes don't repeat
        seen.add(a.url);
        seen.add(a.title);
        return {
          id: a.url,
          source: a.source?.name ?? "Unknown",
          title: a.title,
          summary: a.description ?? "",
          url: a.url,
          time: new Date(a.publishedAt).toLocaleDateString("en-US", {
            month: "short", day: "numeric",
          }),
        };
      });
  }

  async function fetchQuality(from: string): Promise<any[]> {
    const url = new URL("https://newsapi.org/v2/everything");
    url.searchParams.set("apiKey", API_KEY!);
    url.searchParams.set("q", `${team} MLB`);
    url.searchParams.set("language", "en");
    url.searchParams.set("sortBy", "publishedAt");
    url.searchParams.set("pageSize", "20");
    url.searchParams.set("from", from);
    url.searchParams.set("domains", QUALITY_DOMAINS);
    const res = await fetch(url.toString(), { next: { revalidate: 43200 } });
    const json = await res.json();
    return json.articles ?? [];
  }

  async function fetchAny(from: string): Promise<any[]> {
    const url = new URL("https://newsapi.org/v2/everything");
    url.searchParams.set("apiKey", API_KEY!);
    url.searchParams.set("q", `${team} MLB`);
    url.searchParams.set("language", "en");
    url.searchParams.set("sortBy", "publishedAt");
    url.searchParams.set("pageSize", "20");
    url.searchParams.set("from", from);
    url.searchParams.set("excludeDomains", BLOCKED_DOMAINS);
    const res = await fetch(url.toString(), { next: { revalidate: 43200 } });
    const json = await res.json();
    return json.articles ?? [];
  }

  // Shared seen set across all passes — prevents duplicates between passes
  const seen = new Set<string>();
  let articles: any[] = [];

  // ── Pass 1: quality sources, last 7 days ──
  if (articles.length === 0) {
    articles = parseArticles(await fetchQuality(daysAgo(7)), seen);
  }

  // ── Pass 2: quality sources, last 30 days ──
  if (articles.length === 0) {
    articles = parseArticles(await fetchQuality(daysAgo(30)), seen);
  }

  // ── Pass 3: any source (minus blocked), last 3 days only ──
  if (articles.length === 0) {
    articles = parseArticles(await fetchAny(daysAgo(3)), seen);
  }

  return NextResponse.json({ articles });
}