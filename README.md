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

## Run with mock data in the app

No backend, database user ID, or API credentials are needed for demo mode.

```powershell
Set-Location 'C:\Users\waky1\OneDrive\Documents\Personal\Connecto\frontend'
npm install
npm run dev
```

1. Open the local URL printed by Vite (normally `http://127.0.0.1:5173`).
2. Create a local profile, or choose **I need help with something** to open Discover.
3. Open **Profile → Connection** and turn **Use Connecto API for new posts** off. API mode is on by default, so change this before submitting demo posts.
4. Browse the seeded neighbors. To try matching, post a Garden Need with a $150 budget, 3 hours, **This Weekend**, a 3-mile radius, and tools required. Marcus should rank first among the sample offerings; open his card to see the reasons.
5. Publish an Offering in the same category, then open **Gigs → Your Help Requests** to run matching again. **Discuss & Coordinate** opens a local demo conversation.

The mode selection, profile, demo posts, and messages persist in this browser. Switching modes affects new posts: previously created API Needs still request backend matches, and demo Needs still use local matching. To start fresh, clear site data for this localhost origin; this removes local data only and does not delete backend records. Different ports have separate browser storage.

## Run the app against the API

Start the backend in a separate terminal after configuring its database and OpenAI settings:

```powershell
Set-Location 'C:\Users\waky1\OneDrive\Documents\Personal\Connecto\connecto-api'
dotnet run --project .\Connecto.Api\Connecto.Api.csproj --launch-profile http
```

In the frontend folder, create `.env.local` from `.env.example` if it does not already exist. Keep an existing file's values rather than overwriting it:

```dotenv
CONNECTO_API_TARGET=http://localhost:5247
VITE_CONNECTO_USER_ID=replace-with-an-existing-database-user-guid
VITE_CONNECTO_API_BASE_URL=
```

Restart `npm run dev` after changing environment variables. For the built app, run `npm run build` followed by `npm run preview`. Then open **Profile → Connection**, turn **Use Connecto API for new posts** on, and post a Need or Offering. A user ID entered in **Edit Profile** takes precedence over `.env.local`; update or clear it if you change database users.

New posts are saved through the API. Need matches come from the backend, while discovery still displays sample neighbors because its backend route is unfinished. Demo records are not uploaded when API mode is enabled.

## Call the API directly

These PowerShell examples bypass the frontend. They use real database records, not the app's mock neighbors. Use a valid existing `User.Id`; the profile-registration endpoint does not create users yet. The POST examples create persistent test records, so run them only against your development database. Re-running them creates additional records.

```powershell
$connectoApiUrl = 'http://localhost:5247'
$connectoUserId = 'replace-with-an-existing-database-user-guid'
$connectoHeaders = @{ 'X-User-Id' = $connectoUserId }

# Check the server is responding.
Invoke-RestMethod -Uri "$connectoApiUrl/health"

# Create a matching Offering before creating the Need.
$connectoOfferingBody = @{
    title = 'POC React development help'
    description = 'Development test offering for React frontend work.'
    category = 'Technical'
    skills = @('React', 'Typescript')
    priceMin = 25
    priceMax = 40
    location = 'Auckland'
    remoteAvailable = $true
    availableFrom = $null
    availableUntil = $null
    experienceYears = 3
} | ConvertTo-Json

$connectoOffering = Invoke-RestMethod `
    -Method Post `
    -Uri "$connectoApiUrl/api/offerings" `
    -Headers $connectoHeaders `
    -ContentType 'application/json' `
    -Body $connectoOfferingBody
$connectoOffering

# Create a Need using the same category, skills, and location.
$connectoNeedBody = @{
    title = 'POC React frontend task'
    description = 'Development test request for a small React task.'
    category = 'Technical'
    skills = @('React', 'Typescript')
    budgetMin = 0
    budgetMax = 150
    location = 'Auckland'
    deadline = $null
} | ConvertTo-Json

$connectoNeed = Invoke-RestMethod `
    -Method Post `
    -Uri "$connectoApiUrl/api/needs" `
    -Headers $connectoHeaders `
    -ContentType 'application/json' `
    -Body $connectoNeedBody
$connectoNeed

# Retrieve ranked matches and their explanations.
$connectoMatches = Invoke-RestMethod `
    -Uri "$connectoApiUrl/api/needs/$($connectoNeed.id)/matches"
$connectoMatches | ConvertTo-Json -Depth 10
```

The current match route returns `offeringId`, a nested `score` with `total` and criterion values, and `reasons`. Ranking depends on the backend's matching rules and database data; creating an Offering does not guarantee a particular rank. Direct API records do not appear in the frontend's local activity cache.

Supported API skills are `Programming`, `Design`, `Marketing`, `Sales`, `React`, `Typescript`, and `Building`. The frontend's mock Garden category and sample neighbors exist only in browser data; backend garden skill support is not implemented.

If requests fail, confirm the user ID is a GUID for a real database user and that the backend database is accessible. A working `/health` response confirms the web server, not database access. If all requests hang, check whether the backend debugger is paused. Avoid blindly repeating timed-out POST requests because a record may already have been created.

## Formatting

Run `npm run format` to format all project source, styles, configuration, and documentation. Run `npm run format:check` to verify. Generated dependencies, builds, cache, and the npm-managed lockfile are excluded.

## Registration and login screens

The welcome screen's **Create Your Profile** and **Sign In** buttons now open dedicated account screens. Login is also accessible from **Profile → Connection → Open login screen**. Registration includes name, neighborhood, email, password, confirmation, and password visibility. Both screens validate required fields; registration checks password length and confirmation.

These are account screen previews, not server authentication. The backend currently provides only placeholder user routes and no credential or session endpoints. Submitting valid credentials displays an explicit unavailable message; no credentials are transmitted or stored. **Create local preview profile** uses only your name and neighborhood, with no password required. **Continue with saved local profile** resumes the device-local profile, without claiming a server login. Passwords are discarded when leaving the screen.
