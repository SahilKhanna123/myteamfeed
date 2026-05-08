// app/api/reddit/route.ts

import { NextRequest, NextResponse } from "next/server";

// In-memory cache: subreddit → { posts, fetchedAt }
const cache = new Map<string, { posts: any[]; fetchedAt: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const subreddit = searchParams.get("subreddit");

  if (!subreddit) {
    return NextResponse.json({ error: "Missing subreddit" }, { status: 400 });
  }

  try {
    // ── Check in-memory cache first ──
    const cached = cache.get(subreddit);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
      return NextResponse.json({ posts: cached.posts, fromCache: true });
    }

    const res = await fetch(
      `https://www.reddit.com/r/${subreddit}/hot.json?limit=25`,
      {
        headers: { "User-Agent": "mlb-fan-app/1.0" },
        next: { revalidate: 600 }, // Next.js fetch cache: 10 min
      }
    );

    if (!res.ok) throw new Error(`Reddit API error: ${res.status}`);

    const json = await res.json();
    const rawPosts = json?.data?.children ?? [];

    const TWO_DAYS_AGO = Math.floor(Date.now() / 1000) - 2 * 24 * 60 * 60;

    const filtered = rawPosts
      .map((p: any) => p.data)
      .filter(
        (p: any) =>
          !p.stickied &&
          !p.pinned &&
          p.score > 50 &&
          p.created_utc >= TWO_DAYS_AGO // ← max 2 days old
      )
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, 3); // ← top 3

    const formatScore = (n: number) =>
      n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

    const formatAge = (utc: number) => {
      const diff = Math.floor(Date.now() / 1000) - utc;
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
      return `${Math.floor(diff / 86400)}d ago`;
    };

    // Fetch oEmbed for each post
    const posts = await Promise.all(
      filtered.map(async (top: any) => {
        const postUrl = `https://www.reddit.com${top.permalink}`;
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
          // oEmbed optional
        }

        return {
          author: `u/${top.author}`,
          subreddit: `r/${top.subreddit}`,
          upvotes: formatScore(top.score),
          text: top.selftext?.trim() || top.title,
          url: postUrl,
          time: formatAge(top.created_utc),
          embedHtml,
        };
      })
    );

    // ── Store in cache ──
    cache.set(subreddit, { posts, fetchedAt: Date.now() });

    return NextResponse.json({ posts });
  } catch (err) {
    console.error("Reddit fetch failed:", err);
    return NextResponse.json({ error: "Failed to fetch Reddit data" }, { status: 500 });
  }
}