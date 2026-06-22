import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

// Use service role client for server-side — not the browser supabase import
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const teamId = searchParams.get("teamId");
  const teamName = searchParams.get("teamName");

  if (!teamId || !teamName) {
    return NextResponse.json({ error: "Missing team info" }, { status: 400 });
  }

  try {
    const today = new Date().toISOString().split("T")[0];

    // Check cache
    const { data: existing } = await supabase
      .from("team_facts")
      .select("*")
      .eq("team_id", teamId)
      .eq("fact_date", today)
      .maybeSingle(); // use maybeSingle — .single() throws if no row found

    if (existing) {
      return NextResponse.json(existing);
    }

    // Generate new fact
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a baseball historian. Generate ONE interesting fact about the given MLB team.
Return JSON only with exactly this shape: { "fact": "...", "category": "..." }
Requirements: accurate, under 50 words, about history/stadium/record/player/tradition.`,
        },
        {
          role: "user",
          content: `Generate a fact about the ${teamName}.`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const raw = response.choices[0].message.content || "{}";
    const parsed = JSON.parse(raw);

    if (!parsed.fact) {
      return NextResponse.json({ error: "LLM returned no fact", raw }, { status: 500 });
    }

    const { data, error: insertError } = await supabase
      .from("team_facts")
      .insert({
        team_id: teamId,
        fact_date: today,
        fact_text: parsed.fact,
        category: parsed.category ?? "general",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Supabase insert error:", insertError.message);
      // Still return the fact even if caching fails
      return NextResponse.json({ fact_text: parsed.fact, category: parsed.category });
    }

    return NextResponse.json(data);

  } catch (err: any) {
    console.error("Fact API error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}