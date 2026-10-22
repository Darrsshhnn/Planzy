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
| Home | `/` | Recents, recommendations, saved groups, nearby places |
| Start a Plan | `/plan/start` | New group outing or Popular places |
| Popular places | `/plan/popular` | Only in the Popular flow; pick one place up front |
| Add Friends | `/plan/friends` | Top picks, search, invite link |
| Group Details | `/plan/group` | Group name (Skip = auto name), categories, date |
| Plan Preferences | `/plan/preferences` | Budget, distance, timing, open-at-that-time toggle |
| Recommendation | `/plan/recommendations` | At least 3 places; skipped in the Popular flow |
| Group Chat | `/chat` | Shortlist mini screen (In / Maybe / Can't votes, add place by search or from liked places), + menu to share a photo or location, Decide (admin) |
| Final Decision | `/decision` | Side-by-side comparison of the top 3. The group's vote decides: if the admin tries to pick a lower-voted place it is blocked and the group gets a notification. Food places lock as walk-in (no booking) |
| Contact & Booking | `/booking` | In-app message to the venue (no calls), location, slots, people, price; members see a waiting state |
| Review & Confirm | `/booking/review` | Booking summary ticket; pay now (UPI / card / net banking, mocked) or pay on reach (cash / UPI at the venue); admin only |
| Locked In | `/locked` | Confirmation, timing, price details, directions, share |
| Place Detail | `/place/[id]` | Live status, reviews with rating filter, add to chat |
| Explore | `/search` | Search with category, distance, time and open-now filters |
| History | `/history` | Upcoming booking, ongoing chat and past outings (Recents → See all) |
| Profile | `/profile` | Name, location, social connections, favourites, groups; opened from the Home photo or the nav |
| Edit Profile | `/profile/edit` | Change photo, name, location; connect Instagram, WhatsApp, Snapchat, Facebook |

### Trying the admin and member views

The person who creates the group is the admin; only they can Decide, lock the place and pay. To see the member side, use the **Admin / Member** switch on the chat, decision and booking screens (or in Profile). The role is stored per browser tab, so you can open two tabs, set one to Member, and watch its waiting screen flip to "booked" the moment the admin pays in the other tab.

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

## Mocked parts and where a backend plugs in

- **Places and people:** read from `src/data/*.json` through `src/lib/api/data.ts`. Replace those functions with API calls.
- **Venue messages:** `src/store/venue-chat-store.ts` keeps in-app conversations with venues; replies are mocked.
- **Chat:** messages live in the plan store; friend replies and votes are simulated (`src/lib/api/chat.ts`, `simulatedVote` in `src/lib/votes.ts`, and the effect in `src/app/chat/page.tsx`). Swap in a realtime channel.
- **Payment:** `processPayment` in `src/lib/api/payments.ts` waits 1.6 s and returns a fake reference. Swap in Razorpay/Stripe; the UI only depends on its signature.
- **Plan state:** `src/store/plan-store.ts` exposes `usePlan()` and `planActions`. Keep the action names and have each call the API.
- **Identity:** the signed-in user is `me` in `people.json`; `viewer-store.ts` stands in for auth.

Sharing a location uses the browser's GPS, which only works on https (or localhost). Over a plain LAN address it falls back to the area in your profile.

Clear the demo state any time with **Profile → Reset plan** (or clear the site's localStorage).

## Design notes

- Colours: `#E5701B` brand, `#242A2F` ink, `#19486E` navy, `#FEF1E8` cream, `#FFFFFF`. Defined as Tailwind theme tokens in `src/app/globals.css`.
- Fonts: Helvetica for headings (system font stack; Arial where Helvetica isn't installed), Poppins for body via `next/font`.
- Icons: stroke icons from `lucide-react`.
- Friend avatars, group illustrations and the Day n' Night Turf / SPARRK photos are taken from the Figma screens.
- Every place has a cover photo plus a 3-photo gallery (also used as visitor and review photos). Photos not from Figma are freely licensed images from Wikimedia Commons (CC BY / CC BY-SA / CC0). Author and license for each are in `src/data/photo-credits.json` and shown on the place page. Photos of fictional venues are representative scenes.
