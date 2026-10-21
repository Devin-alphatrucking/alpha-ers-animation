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
- Locally, no password is needed for the Pipeline unless you set `ADMIN_PASSWORD` in `server/.env`.

## Personalized demo links (for Instagram / email)

Brand the whole product as the prospect before you send a Loom:

```
https://your-app.onrender.com/?biz=Miami+Glow+MedSpa&niche=medspa&city=Miami&currency=USD&rating=4.6&owner=Sofia
```

Every visitor gets their own private copy of the demo, so two prospects opening links at the same time never see each other's branding or clicks.

Niches: `medspa` · `dental` · `detailing` · `homeservices`  
Currency: `USD` `GBP` `AUD` `CAD` `EUR`

Or use the prospect switcher in the top bar → Apply & copy link.

## Pipeline (your own sales CRM)

Open **Your sales → Pipeline** (`/prospects`) to track every business you pitch.

- Add prospects one by one, or **Import CSV** (columns: `business, owner, niche, city, country, email, instagram, phone, website, rating, notes`; up to 500 rows, duplicates skipped).
- Drag cards between stages: New → Contacted → Replied → Demo booked → Won / Lost.
- Open a card → **Brand demo & open scripts** loads that business into the demo and opens the Pitch kit with their name pre-filled.
- Log DMs, emails, replies, and demos in one click; follow-ups due today show in the sidebar badge.
- **Demo view tracking:** links copied for a prospect (Pitch kit with that prospect picked, or **Copy tracked link** on their card) carry a private `ref` code. When they open it, their timeline shows when, on what device, for how long, and what they tried, e.g. *"Opened your demo on iPhone · 4 min · viewed Inbox, Reviews · missed-call text-back"*. Anyone who opened in the last 48 hours appears in the green **Just opened your demo** strip. Opens while you're logged in as the owner aren't counted, and Instagram/WhatsApp link previews don't count as opens.

Locally, pipeline data lives in `server/data/prospects.json`. Online, it lives in MongoDB. The demo reset never touches it.

The Pipeline and Pitch kit are owner-only. Online they need the password you set in `ADMIN_PASSWORD` (log in at `/login`). Prospects opening your demo link never see them.

## Getting paid (pricing page + Razorpay / Stripe)

Every demo has a **Plans** page (`/pricing`) branded for the prospect's business, with their numbers, your plans compared with Podium, a "what happens after you pay" section and an FAQ. Prospects reach it from the sidebar, the top-bar **Get this for {business}** button, or the ROI calculator.

1. Log in and open **Your sales → Offer** (`/settings`). Set your prices, your name (it signs the cold emails), WhatsApp number, Calendly link and an optional Loom/YouTube walkthrough.
2. Create a payment link for each plan:
   - **Razorpay** (works from India, accepts international cards): Dashboard → Payment Pages or Payment Links → create one per plan. For monthly billing use Subscriptions → Plans → create a subscription link.
   - **Stripe** (if you have an account that can take payments): Payment Links → New → recurring price.
3. Paste each link into its plan. In Razorpay/Stripe, set the **success redirect URL** to the one shown under each plan (`https://your-app/welcome?plan=growth`). After paying, customers land on a welcome form that collects their business details.

What you get in the Pipeline:

- **Pay** clicks go through your server first, so a tracked prospect's timeline shows *"clicked Pay (Growth)"*, they move to **Follow up today**, and they appear in the orange **Ready to buy** strip. The same happens when they tap Book a call, WhatsApp or Reserve.
- Plans without a payment link show **Reserve** instead: the prospect leaves their details and you send the link yourself.
- Welcome and reserve forms are logged on the matching prospect, or added as a new prospect if they came in without a tracked link.

Prices you set here are used everywhere: the pricing page, the sidebar, the ROI calculator and the Pitch kit scripts. Settings are stored in `server/data/settings.json` locally and in MongoDB online.

## Put it online (Render + MongoDB Atlas, $0/month)

### 1. Create the free database (about 5 minutes)

1. Sign up at [mongodb.com/atlas](https://www.mongodb.com/cloud/atlas/register) and create a free **M0** cluster.
2. **Database Access** → Add user → choose a username and a password with letters and numbers only (no `@`, `:` or `/`).
3. **Network Access** → Add IP address → **Allow access from anywhere** (`0.0.0.0/0`). Render's free servers don't have a fixed IP.
4. **Connect** → Drivers → copy the connection string. It looks like
   `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
   Replace `<password>` with your real password.

### 2. Deploy on Render (about 5 minutes)

1. Sign up at [render.com](https://render.com) with your GitHub account.
2. **New → Blueprint** → pick the `alpha-ers-animation` repo. Render reads `render.yaml` automatically.
3. It asks for two values:
   - `ADMIN_PASSWORD`: the password for your Pipeline (use something long).
   - `MONGODB_URI`: the Atlas connection string from step 1.
4. Click **Apply**. The first build takes 3–5 minutes. Your link will be `https://pulselocal-XXXX.onrender.com`.
5. Open `https://your-link/api/health`. It should show `"storage":"mongodb"`.
6. Open `https://your-link/login`, enter your password, and your pipeline is there.

Every `git push` to `main` redeploys automatically.

### 3. Keep it awake (important for cold DMs)

Render's free plan puts the app to sleep after 15 minutes without visitors, and the next visit takes 30–50 seconds to wake up. A prospect won't wait that long. To prevent it:

1. Sign up at [uptimerobot.com](https://uptimerobot.com) (free).
2. Add an **HTTP(s)** monitor for `https://your-link/api/health` every **5 minutes**.

One always-on free service fits inside Render's 750 free hours a month.

### Notes

- Visitor demos are kept in memory for 12 hours, then cleared. Opening the link again rebuilds the demo from the link, so nothing is lost for the prospect.
- Optional custom domain (e.g. `demo.yourbrand.com`): Render → your service → Settings → Custom Domains.
- To run the production setup locally: copy `server/.env.example` to `server/.env`, fill it in, then run `npm run build` and `npm start`.

## What to click on a sales call / Loom

1. Command Center — ROI calculator vs Podium
2. AI Lead Inbox — **Simulate missed call**, then type `how much?` and `yes book it`
3. Smart Bookings — **Complete & request review**
4. Review Booster — tap 5★ (Google) then 2★ (Negative Review Shield)
5. Sales & Outreach — copy the Instagram DM / cold email already filled with their name
