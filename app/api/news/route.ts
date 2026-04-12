import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const team = req.nextUrl.searchParams.get("team");
  if (!team) return NextResponse.json({ articles: [] });

  const API_KEY = process.env.NEWS_API_KEY;

  const url = new URL("https://api.thenewsapi.com/v1/news/all");
  url.searchParams.set("api_token", API_KEY!);
  url.searchParams.set("search", `${team} MLB`);
  url.searchParams.set("language", "en");
  url.searchParams.set("limit", "2");
  url.searchParams.set("sort", "published_at");

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  url.searchParams.set("published_after", yesterday.toISOString().split("T")[0]);

  const res = await fetch(url.toString(), { next: { revalidate: 86400 } });
  const json = await res.json();

  const articles = (json.data ?? []).map((a: any) => ({
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