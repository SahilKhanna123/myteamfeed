// app/api/reddit/route.ts

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const subreddit = searchParams.get("subreddit");

  if (!subreddit) {
    return NextResponse.json({ error: "Missing subreddit" }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://www.reddit.com/r/${subreddit}/hot.json?limit=10`,
      {
        headers: { "User-Agent": "mlb-fan-app/1.0" },
        next: { revalidate: 300 },
      }
    );

    if (!res.ok) throw new Error(`Reddit API error: ${res.status}`);

    const json = await res.json();
    const posts = json?.data?.children ?? [];

    const top = posts
      .map((p: any) => p.data)
      .filter((p: any) => !p.stickied && !p.pinned && p.score > 50)
      .sort((a: any, b: any) => b.score - a.score)[0];

    if (!top) return NextResponse.json({ post: null });

    const formatScore = (n: number) =>
      n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

    const formatAge = (utc: number) => {
      const diff = Math.floor(Date.now() / 1000) - utc;
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
      return `${Math.floor(diff / 86400)}d ago`;
    };

    const postUrl = `https://www.reddit.com${top.permalink}`;

    // Fetch oEmbed HTML from Reddit
    let embedHtml: string | null = null;
    try {
      const oEmbedRes = await fetch(
        `https://www.reddit.com/oembed?url=${encodeURIComponent(postUrl)}`,
        { headers: { "User-Agent": "mlb-fan-app/1.0" } }
      );
      if (oEmbedRes.ok) {
        const oEmbed = await oEmbedRes.json();
        embedHtml = oEmbed.html ?? null;
      }
    } catch {
      // oEmbed optional — fall back to custom card
    }

    return NextResponse.json({
      post: {
        author:    `u/${top.author}`,
        subreddit: `r/${top.subreddit}`,
        upvotes:   formatScore(top.score),
        text:      top.selftext?.trim() || top.title,
        url:       postUrl,
        time:      formatAge(top.created_utc),
        embedHtml, // null if unavailable
      },
    });
  } catch (err) {
    console.error("Reddit fetch failed:", err);
    return NextResponse.json({ error: "Failed to fetch Reddit data" }, { status: 500 });
  }
}
