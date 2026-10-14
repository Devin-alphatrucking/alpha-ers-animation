# PulseLocal AI

Lead catcher, smart booking, and Google review booster for local service businesses (MedSpas, dentists, auto spas, HVAC/roofing). Built to demo and sell to US / UK / AU / CA / UAE shops from India at $49–$99/mo vs Podium/Birdeye ($299–$399/mo).

## Run locally

```bash
cd c:\xampp\htdocs\alpha-demo
npm run install:all
npm run dev
```

- App: http://localhost:5173 (Vite will jump to 5174/5175 if that port is busy)
- API: http://localhost:4000
- Keep both running with `npm run dev` from the project root. If you already have a terminal open, just refresh the browser.

## Personalized demo links (for Instagram / email)

Brand the whole product as the prospect before you send a Loom:

```
http://localhost:5173/?biz=Miami+Glow+MedSpa&niche=medspa&city=Miami&currency=USD&rating=4.6
```

Niches: `medspa` · `dental` · `detailing` · `homeservices`  
Currency: `USD` `GBP` `AUD` `CAD` `EUR`

Or use the prospect switcher in the top bar → Apply & copy link.

## Pipeline (your own sales CRM)

Open **Your sales → Pipeline** (`/prospects`) to track every business you pitch.

- Add prospects one by one, or **Import CSV** (columns: `business, owner, niche, city, country, email, instagram, phone, website, rating, notes`; up to 500 rows, duplicates skipped).
- Drag cards between stages: New → Contacted → Replied → Demo booked → Won / Lost.
- Open a card → **Brand demo & open scripts** loads that business into the demo and opens the Pitch kit with their name pre-filled.
- Log DMs, emails, replies, and demos in one click; follow-ups due today show in the sidebar badge.

Pipeline data lives in `server/data/prospects.json` and is not touched by the demo reset.

## What to click on a sales call / Loom

1. Command Center — ROI calculator vs Podium
2. AI Lead Inbox — **Simulate missed call**, then type `how much?` and `yes book it`
3. Smart Bookings — **Complete & request review**
4. Review Booster — tap 5★ (Google) then 2★ (Negative Review Shield)
5. Sales & Outreach — copy the Instagram DM / cold email already filled with their name
