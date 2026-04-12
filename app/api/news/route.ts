import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const team = req.nextUrl.searchParams.get("team");
  if (!team) return NextResponse.json({ articles: [] });

  const API_KEY = process.env.NEWS_API_KEY;

  const url = new URL("https://api.thenewsapi.com/v1/news/all");
  url.searchParams.set("api_token", API_KEY!);
  url.searchParams.set("language", "en");
  url.searchParams.set("limit", "10"); 
  url.searchParams.set("sort", "published_at");


  url.searchParams.set("search", `"${team}" MLB baseball`);


  url.searchParams.set("domains", [
    "espn.com",
    "mlb.com",
    "bleacherreport.com",
    "theathletic.com",
    "cbssports.com",
    "nbcsports.com",
    "usatoday.com",
    "sportingnews.com",
    "si.com",
    "nytimes.com",
    "washingtonpost.com",
    "latimes.com",
    "nypost.com",
    "bostonglobe.com",
    "chicago tribune.com",
  ].join(","));

  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  url.searchParams.set("published_after", threeDaysAgo.toISOString().split("T")[0]);

  const res = await fetch(url.toString(), { next: { revalidate: 86400 } });
  const json = await res.json();

  const teamLower = team.toLowerCase();

  const articles = (json.data ?? [])
    .filter((a: any) => {
      const title = (a.title ?? "").toLowerCase();
      const desc = (a.description ?? a.snippet ?? "").toLowerCase();
      return title.includes(teamLower) || desc.includes(teamLower);
    })
    .slice(0, 2)
    .map((a: any) => ({
      id: a.uuid,
      source: a.source,
      title: a.title,
      summary: a.description ?? a.snippet ?? "",
      url: a.url,
      time: new Date(a.published_at).toLocaleDateString("en-US", {
        month: "short", day: "numeric",
      }),
    }));

  return NextResponse.json({ articles });
}