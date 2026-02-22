# Update Command Center — Midnight Express

Real-time monitoring dashboard for RDN Portal case updates. Extracts, stores, and visualizes new updates across all cases with near-real-time operational visibility.

## What It Does

- Fetches case updates from the `rdn_new_updates` Supabase table
- Displays a **7-day bar chart** of update volume by day, broken down by update type
- Shows **KPI cards**: total updates, updates today, unique cases, top update type
- Filters by date range and update type

## Current State

- Dashboard reads from Supabase (`rdn_new_updates` table)
- Batch extraction via API endpoint in the main rdn-automation app
- Static refresh — requires manual reload to see new data

## Vision: 24/7 AI-Powered Case Monitoring

The system monitors the RDN portal around the clock and routes critical updates to the right person on the right channel — before they even check the portal.

## Roadmap

- **Scheduled extraction (15-30 min cron)**: Near-real-time update capture throughout the US business day via persistent browser session reuse and incremental sync
- **Auto-refresh via Supabase Realtime**: Dashboard subscribes to `rdn_new_updates` inserts and updates the chart/KPIs live without manual reload
- **Multi-channel notifications**: Slack, Microsoft Teams, WhatsApp, Email, and Browser Push — AI categorizes each update and routes to the correct channel with the correct urgency
- **AI-powered routing**: `Agent Recovery` → immediate Slack + email | routine `Client` → daily digest | configurable per client
- **24/7 monitoring**: The AI never sleeps — critical updates at 2 AM get routed just as fast as updates at 2 PM

## Tech Stack

- **Framework**: Next.js (App Router)
- **Database**: Supabase
- **Charts**: Recharts
- **UI**: shadcn/ui + Tailwind CSS
- **Auth**: Clerk

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the dashboard.

## Related

- **Extraction engine**: [rdn-automation](../rdn-automation/) — Module 2 handles browser automation and data extraction
- **PRD**: `rdn-automation/docs/new-updates-extraction-prd.md` — full technical spec including real-time monitoring roadmap
