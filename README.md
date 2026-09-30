# Connecto POC

React app based on the read-only screenshot retained in the original ChatGPT project sources folder. The supplied workspace had no existing repository or app. The referenced business requirements text was unavailable; scope follows the confirmed core flows.

Active project folder: `C:\Users\waky1\OneDrive\Documents\Personal\Connecto\frontend`.

## Run

Use Node.js 20.19+ or 22.12+. Run `npm install`, then `npm run dev`. Check with `npm run build`, `npm test`, and `npm run lint`.

## POC behavior

- Create or edit a device-local profile.
- Discover helpers, search by name or skill, and browse categories.
- Post Needs with category, total budget, estimated hours, timeframe, distance preference, and tools preference.
- Publish Offerings and view activity.
- In demo mode, rank same-category Offerings: category 40, budget 20, timeframe 15, distance 10, tools 10, rounded rating up to 5. Details explain every criterion, including mismatches. Estimates use hourly rate multiplied by requested hours.
- Coordinate using local demo conversations.

Profiles, locally cached activity, and demo messages persist in browser local storage; API-mode posts are also stored by the backend. Sample neighbors, reviews, and neighborhood map are illustrative. There is no authentication, real geolocation, message delivery, verification, payment, or subscription system in the frontend POC. Clear browser site data to reset. The screenshot’s garden photos are represented with local decorative artwork; no remote stock images are required. Fonts gracefully fall back to Arial.

## API connection

The sibling `../connecto-api` project provides `POST /api/needs`, `POST /api/offerings`, and `GET /api/needs/{needId}/matches`. New posts use these endpoints by default. Demo mode is an explicit toggle under Profile → Connection; server failures never silently create demo posts.

1. Start Connecto.Api using its HTTP launch profile at `http://localhost:5247`. Its own SQL Server and OpenAI configuration must be valid; the frontend does not supply these secrets.
2. Copy `.env.example` to `.env.local` if you need a different server target. Set `CONNECTO_API_TARGET` to the API address. Vite dev and preview proxy `/api`, avoiding browser CORS problems without backend changes.
3. Enter an existing database `User.Id` in Edit Profile, or set `VITE_CONNECTO_USER_ID`. It is sent in `X-User-Id` for posting. This is the backend's POC identification mechanism, not authentication.
4. Post a Need to receive server-ranked matches and explanations. Only skills in the backend's Skill enum are selectable. Optional date fields map to actual API deadlines and availability.

The user, discovery, and offering-detail routes are unfinished in the backend. Profiles and conversations remain local, discovery shows sample data, and activity caches posts created on this device. Match IDs without known offering details display explicit unavailable fields; no sample identities or reviews are assigned to them. Messaging is disabled for API matches. Hours, tools, radius, and Today/Weekend preferences currently have no corresponding backend fields. Offering rates are sent as PriceMin/PriceMax without unit conversion because the backend has no hourly unit field. API results use backend scores, not the local demo scoring formula.

For hosting separately, set `VITE_CONNECTO_API_BASE_URL` and configure backend CORS. Client environment variables are public; never put secrets there.

## Formatting

Run `npm run format` to format all project source, styles, configuration, and documentation. Run `npm run format:check` to verify. Generated dependencies, builds, cache, and the npm-managed lockfile are excluded.
