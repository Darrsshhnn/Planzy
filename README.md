# Planzy

Group outing planner for Ahmedabad. Friends create a group, get recommendations that fit everyone's budget, distance and timing, vote on a shared shortlist in a group chat, compare the top picks, and the admin pre-pays to lock the booking.

Built with Next.js 16 (App Router), React 19, TypeScript and Tailwind CSS v4. Mobile-first; on desktop the app renders inside a centred phone frame.

## Run it

Requires Node.js 20.9 or newer.

```bash
npm install
npm run dev        # http://localhost:3000
```

Production build:

```bash
npm run build
npm run start      # http://localhost:3000
```

Lint: `npm run lint`

`next.config.ts` limits the build to 2 worker processes; with the default (one per CPU core) the build can run out of memory on laptops that have a browser and other apps open.

## The flow

| Step | Route | Notes |
| --- | --- | --- |
| Landing / Sign in | `/auth`, `/auth/login` | Logo animation on orange, then sign in (email/phone + password), Continue with Google, Forgot password |
| Sign up | `/auth/signup` | Name → mobile number → password → email (or Sign up with Google) |
| Your area | `/onboarding/location` | After any sign-up / first Google sign-in: searchable dropdown of all Ahmedabad and Gandhinagar areas, or current location |
| Your interests | `/onboarding/interests` | New accounts pick the kinds of outings they like, budget and timing; then a ~2 s logo animation opens Home |
| Forgot password | `/auth/forgot` | Number/email → 4-digit code (demo code **1234**) → new password |
| Home | `/` | Confirmed booking / ongoing chat, recents (new users: **Places you might like**, from their interests), Planzy Scout, recommendations, groups, nearby places |
| Scout (Planzy Scout) | `/ai` | Pick your area, type, budget and distance; get places that fit, closest first, with a reason each. Select one or more, then start a new plan or add them to any group you are in (voting groups get them on the shortlist; booked, past and saved groups start their next plan with the same people) |
| Notifications | `/notifications` | Group invites to accept/decline, replies to your invites (Home bell) |
| Add Friends | `/plan/friends` | The + tab starts here. Top picks, more friends, search; Continue sends invites |
| Group Details | `/plan/group` | Group name, invited friends with live Accepted / Waiting / Declined, categories, date |
| Plan Preferences | `/plan/preferences` | Your budget, distance, timing (or Skip); shows the group average so far |
| Recommendation | `/plan/recommendations` | Places for the group average; picking is optional. Creates the group chat |
| Chats | `/chat` | Search; All / Groups / Personal; Invites, Running plans, Personal, Old chats; new chat with a friend |
| Group Chat | `/chat/[id]` | Shortlist mini screen, votes, + menu (photo, location, group link), Decide (admin). Back goes to Chats |
| Group info | `/chat/[id]/details` | Name (rename), people with status, add/remove (admin), created time, details, delete or leave |
| Personal chat | `/chat/dm/[friendId]` | One-to-one chat with a friend |
| Final Decision | `/decision` | Top 3 compared. The group's vote decides; an admin override is blocked and the group is notified. Food = walk-in |
| Contact & Booking | `/booking` | In-app message to the venue (no calls), in-app map, slots, people, price |
| Review & Confirm | `/booking/review` | Booking summary; pay now (mocked) or pay on reach (cash / UPI) |
| Locked In | `/locked` | Confirmation, timing, price details, directions, share |
| Place Detail | `/place/[id]` | Photos, live status, rating breakdown, reviews with photos, Location opens the map |
| Explore | `/search` | Search, filter mini screen, map button (search the map by area), Scout, new spots, new areas |
| Map | `/map`, `/map?place=id` | OpenStreetMap: your live location, search an area, places within 3 km |
| History | `/history`, `/history/[id]` | Upcoming, ongoing and past outings; a past outing shows the place, group, your rating and Revisit |
| Profile | `/profile` | Photo, name, age, location, number, email; sections below open their own screens |
| Profile sections | `/profile/edit`, `/profile/preferences`, `/profile/favourites`, `/profile/groups`, `/profile/settings` | Personal details, default preferences, liked places, saved groups and group chats, password / notifications / log out |

### Invites and the group average

When you add friends to a plan, each gets an invite. Mock friends accept or decline after a few seconds; those who accept send their budget, distance and timing (some skip). Recommendations use the average budget and distance and the most popular time slot. A sample invite from Karan ("Sunday Box Cricket") is waiting in Notifications: accept it to see the member side, where Karan (simulated) closes voting and books once everyone has voted.

### Trying the admin and member views

In your own groups, the **Admin / Member** switch (chat, decision, booking, or Profile → Settings) previews what a member sees. The role is stored per browser tab.

## Features from the research (FigJam)

| Research item | Where it is in the app |
| --- | --- |
| Group making, in-app voting, budget & distance filter, history log, share, favourites | Plan flow, Group Chat, Explore filters, History, place page |
| Preference matching | "% match" on Recommendation cards (category, budget, distance, timing) |
| Live footage & images | "Live" crowd pill on every card; Live now panel with recent visitor photos on the place page |
| Availability | Availability chip on every card ("Slots open / Filling up / Few slots left"), open-now status |
| Most preferred time suggestion | Plan Preferences suggests the slot most of the group usually goes out in; places show their least-crowded time |
| Verified / authentic reviews | Reviews with photos; write a review with up to 3 photos; Verified badge when the visit was booked through Planzy |
| Cleanliness, well maintained | Rating breakdown on the place page |
| New area exploration, new spot every week | Explore: "New spots this week" and "Explore a new area" |

## Project structure

```
src/
  app/                 one folder per route (see table above)
  components/
    layout/            phone frame, status bar, floating bottom nav, screen, page header
    ui/                buttons, cards, chips, avatars, slider, toggle, sheet, ratings
    place/             place cards, place image, place detail, favourites
    chat/              messages, shortlist card, vote controls, in-chat search
    booking/           price summary
    plan/              plan-step wrapper, admin/member switch
    home/              saved groups row
  data/                mock JSON: places, people (friends, groups, recents), chat lines
  lib/
    api/               data access + mock chat and payment services
    recommend.ts       budget / distance / category / timing matching
    votes.ts           vote tally, ranking, simulated friend votes
    time.ts, format.ts, pricing.ts, types.ts
  store/
    plan-store.ts      shared plan state (persisted to localStorage, synced across tabs)
    profile-store.ts   editable user profile (persisted separately from the plan)
    reviews-store.ts   reviews written in the app, with photos
    viewer-store.ts    demo admin/member role per tab
```

## New users

A new account (sign-up or a first Google sign-in) goes: area → interests → logo animation → Home. It has no outing history, so Home has no Recents yet and its Recommendation is picked from those interests (with a match % and why). It starts with no chats, plans or history: Chats lists friends from contacts who are on Planzy, and the first invite from a friend arrives about 30 seconds in. Plans and personal chats are stored per account. Logging in to an existing account also plays the ~2 s logo animation before Home.

The first plan is guided: a coach card on each step (Home → friends → group → preferences → recommendations → chat and votes → decision → booking → Locked In) says what to do. It can be folded, skipped, or turned back on in Profile → Settings.

## Planzy Scout

`POST /api/ai/suggest` takes `{ location, budget, distance, categories }` (plus optional `prompt`). Results come back closest first. With `ANTHROPIC_API_KEY` set on the server, Claude (`claude-opus-5-5`, structured JSON output) picks places from the catalogue and writes a reason for each; the key stays on the server.

```bash
# .env.local (and in Vercel → Project → Settings → Environment Variables)
ANTHROPIC_API_KEY=sk-ant-...
```

Without a key, or if the call fails, the built-in matcher in `src/lib/ai/suggest.ts` answers instead (it reads category, budget, group size, timing and area out of the text), so the feature always works.

## Google sign-in

Continue with Google uses **Firebase Authentication** (project `planzy-01`). Tapping it opens Google's own account chooser with the Google accounts on the device; the person picks one and confirms with Google. `/api/auth/google` then checks the Firebase ID token with Google and only accepts Google accounts with a verified email. A new Google user picks their area and interests; a known one just logs in. Planzy keeps its own session, so Firebase is signed out right after.

The Firebase web config lives in `src/lib/firebase.ts`. It is public by design (it identifies the project, it is not a secret), so nothing needs setting in `.env.local` or Vercel. To use another Firebase project, set the `NEXT_PUBLIC_FIREBASE_*` variables.

Firebase setup (already done for `planzy-01`):

1. Firebase console → Authentication → Sign-in method → **Google** → Enable.
2. Authentication → Settings → **Authorized domains**: `localhost` and every address the app runs on (e.g. `planzy-eight.vercel.app`). A plain LAN IP like `192.168.x.x` isn't accepted; use localhost or the deployed site.

## Mocked parts and where a backend plugs in

- **Places and people:** read from `src/data/*.json` through `src/lib/api/data.ts`. Replace those functions with API calls.
- **Planzy Scout:** `src/app/api/ai/suggest/route.ts` (Claude when `ANTHROPIC_API_KEY` is set, built-in matcher otherwise).
- **Accounts:** `src/store/account-store.ts` keeps accounts per browser (password stored as a SHA-256 hash). Replace with a real auth service.
- **Plans, invites, notifications:** `src/store/plan-store.ts` (multi-plan, simulated friends and admins).
- **Personal chats:** `src/store/dm-store.ts`.
- **Venue messages:** `src/store/venue-chat-store.ts` keeps in-app conversations with venues; replies are mocked.
- **Chat:** messages live in the plan store; friend replies and votes are simulated (`src/lib/api/chat.ts`, `simulatedVote` in `src/lib/votes.ts`, and the effect in `src/app/chat/page.tsx`). Swap in a realtime channel.
- **Payment:** `processPayment` in `src/lib/api/payments.ts` waits 1.6 s and returns a fake reference. Swap in Razorpay/Stripe; the UI only depends on its signature.
- **Plan state:** `src/store/plan-store.ts` exposes `usePlan()` and `planActions`. Keep the action names and have each call the API.
- **Identity:** the signed-in user is `me` in `people.json`; `viewer-store.ts` stands in for auth.

The map uses OpenStreetMap tiles (Leaflet) and Nominatim for area search; no API key needed. Sharing a location and the map's live position use the browser's GPS, which only works on https (or localhost). Over a plain LAN address it falls back to the area in your profile.

Clear the demo state any time with **Profile → Reset plan** (or clear the site's localStorage).

## Design notes

- Colours: `#E5701B` brand, `#242A2F` ink, `#19486E` navy, `#FEF1E8` cream, `#FFFFFF`. Defined as Tailwind theme tokens in `src/app/globals.css`.
- Fonts: Helvetica for headings (system font stack; Arial where Helvetica isn't installed), Poppins for body via `next/font`.
- Icons: stroke icons from `lucide-react`.
- Friend avatars, group illustrations and the Day n' Night Turf / SPARRK photos are taken from the Figma screens.
- Every place has a cover photo plus a 3-photo gallery (also used as visitor and review photos). Photos not from Figma are freely licensed images from Wikimedia Commons (CC BY / CC BY-SA / CC0). Author and license for each are in `src/data/photo-credits.json` and shown on the place page. Photos of fictional venues are representative scenes.
