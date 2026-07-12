# MyTeamFeed ⚾

**Your Sport. Your Team.**

A personalized MLB companion app — pick your team once and get a single feed with live scores, breaking news, fun facts, and a community hot-takes board, all themed in your team's colors.

🔗 **Live app:** [your-vercel-url-here](#)

## Features

- **Live scoreboard** — today's game, most recent result, or upcoming schedule
- **In-game panel** — real-time pitcher/batter matchup, base runners, count, and last play, auto-refreshing during live games
- **Team news feed** — latest articles for your team
- **Did You Know** — fun, auto-generated team facts
- **Fan Hot Takes** — a public per-team message board where signed-in users can post takes, like, and reply
- **Auth** — sign in and save your team preference

## Tech Stack

- [Next.js](https://nextjs.org/) (App Router) + TypeScript
- [Supabase](https://supabase.com/) — auth & database
- ESPN's public sports API — live scores & schedules
- Deployed on [Vercel](https://vercel.com/)

## Running Locally

```bash
npm install
npm run dev
```

You'll need a `.env.local` with your own Supabase project keys:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```
## Roadmap

- [ ] NBA, NFL, and NHL support (currently MLB only)
- [ ] Push notifications for live game updates
- [ ] User profile / display name settings
- [ ] Report/moderate hot takes


## License

Personal project — not currently licensed for reuse.
