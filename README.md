# connecto-app

Existing React/Vite Connecto web app with demo journeys and authenticated backend integration. Future service repositories are documentation scaffolds, not implemented capabilities.

Active project folder: `C:\Users\waky1\OneDrive\Documents\Personal\Connecto\connecto-app`.

## Run

Use Node.js 20.19+ or 22.12+. Run `npm install`, then `npm run dev`. Check with `npm run build`, `npm test`, and `npm run lint`.

## POC behavior

- Create or edit a device-local profile.
- Discover helpers, search by name or skill, and browse categories.
- Post Needs with category, total budget, estimated hours, timeframe, distance preference, and tools preference.
- Publish Offerings and view activity.
- In demo mode, rank same-category Offerings: category 40, budget 20, timeframe 15, distance 10, tools 10, rounded rating up to 5. Details explain every criterion, including mismatches. Estimates use hourly rate multiplied by requested hours.
- Coordinate using local demo conversations.

Profiles, activity and demo messages use session memory; API-mode records are stored by the backend and login rehydrates member activity. Logout/account changes clear private collections and invalidate obsolete responses. Cognito registration, confirmation, login and in-memory token refresh are implemented. Sample neighbors, reviews, and neighborhood map are illustrative. Real geolocation, persistent message delivery, competence verification, payments and subscriptions are not implemented. Clear browser site data to reset local records. The screenshot’s garden photos are represented with local decorative artwork; no remote stock images are required. Fonts gracefully fall back to Arial.

## API connection

The backend now validates Cognito access tokens. The frontend sends `Authorization: Bearer <access token>` for Needs, Offerings, matches, and `GET /api/users/me`. Database user IDs and `X-User-Id` are no longer used. The backend provisions a profile from the verified Cognito subject; local demo profiles do not authenticate API calls.

Vite dev and preview proxy `/api` to `CONNECTO_API_TARGET`. For separate hosting, set `VITE_CONNECTO_API_BASE_URL` and configure backend CORS. Client environment variables are public; never put a client secret or AWS credentials in them.

Signed-in discovery uses paginated API search and actual public Offering details; local preview uses separate illustrative data. Authenticated activity loads the current member’s Needs and Offerings from paginated API reads. API matches include actual public details, factor scores, reasons and policy version; demo identities and reviews are not assigned to them. Messaging is disabled for API matches. The related-wording search vocabulary is small and awaits owner-reviewed acceptance fixtures. Real SQL, browser and staging acceptance remain open.

## Run with mock data in the app

No backend or Cognito credentials are needed for demo mode.

```powershell
Set-Location 'C:\Users\waky1\OneDrive\Documents\Personal\Connecto\connecto-app'
npm install
npm run dev
```

1. Open the local URL printed by Vite (normally `http://127.0.0.1:5173`).
2. Create a local profile, or choose **I need help with something** to open Discover.
3. Open **Profile → Connection** and turn **Use Connecto API for new posts** off. API mode is on by default, so change this before submitting demo posts.
4. Browse the seeded neighbors. To try matching, post a Garden Need with a $150 budget, 3 hours, **This Weekend**, a 3-mile radius, and tools required. Marcus should rank first among the sample offerings; open his card to see the reasons.
5. Publish an Offering in the same category, then open **Gigs → Your Help Requests** to run matching again. **Discuss & Coordinate** opens a local demo conversation.

The mode selection, preview profile, demo posts and messages last for this session. Reloading clears them. Switching modes affects new posts: previously created API Needs still request backend matches, and demo Needs still use local matching. To start fresh, clear site data for this localhost origin; this removes local data only and does not delete backend records. Different ports have separate browser storage.

## Run the app against the API

Start the backend in a separate terminal after configuring its database and Cognito settings. OpenAI is optional; listing parsing remains unavailable:

```powershell
Set-Location 'C:\Users\waky1\OneDrive\Documents\Personal\Connecto\connecto-api'
dotnet run --project .\Connecto.Api\Connecto.Api.csproj --launch-profile http
```

In the frontend folder, create `.env.local` from `.env.example` if it does not already exist. Keep an existing file's values rather than overwriting it:

```dotenv
CONNECTO_API_TARGET=http://localhost:5247
VITE_COGNITO_REGION=ap-southeast-2
VITE_COGNITO_CLIENT_ID=replace-with-your-public-cognito-app-client-id
VITE_CONNECTO_API_BASE_URL=
```

Restart `npm run dev` after changing environment variables. For the built app, run `npm run build` followed by `npm run preview`. Configure Cognito as described below, log in, then post a Need or Offering. Login enables API mode automatically. Local preview profiles enable demo mode automatically.

New posts are saved through the API. Need matches and discovery come from persisted backend listings. Demo records are not uploaded when API mode is enabled.

## Call the API directly

These PowerShell examples bypass the frontend. They use real database records, not the app's mock neighbors. Use a valid Cognito **access token** for the app client configured in the backend. ID tokens are not accepted. The POST examples create persistent test records, so run them only against your development database. Re-running them creates additional records.

```powershell
$connectoApiUrl = 'http://localhost:5247'
$connectoAccessToken = Read-Host 'Cognito access token'
$connectoHeaders = @{ Authorization = "Bearer $connectoAccessToken" }

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
    -Uri "$connectoApiUrl/api/needs/$($connectoNeed.id)/matches" `
    -Headers $connectoHeaders
$connectoMatches | ConvertTo-Json -Depth 10
```

The current match route returns `offeringId`, a nested `score` with `total` and criterion values, `reasons`, `policyVersion`, and public `offering` details. Ranking depends on configured backend rules and database data; creating an Offering does not guarantee a particular rank. Direct API records do not appear in the frontend's local activity cache.

Supported API skills are `Programming`, `Design`, `Marketing`, `Sales`, `React`, `Typescript`, and `Building`. The frontend's mock Garden category and sample neighbors exist only in browser data; backend garden skill support is not implemented.

If requests fail, confirm you have a valid access token for the configured app client and that the backend database is accessible. A working `/health` response confirms the web server, not database access. If all requests hang, check whether the backend debugger is paused. Avoid blindly repeating timed-out POST requests because a record may already have been created.

## Formatting

Run `npm run format` to format all project source, styles, configuration, and documentation. Run `npm run format:check` to verify. Generated dependencies, builds, cache, and the npm-managed lockfile are excluded.

## Registration and login

1. Configure a Cognito user pool that supports email sign-in and self-registration, with email verification enabled.
2. Use a **public app client with no client secret**, enable `ALLOW_USER_PASSWORD_AUTH` and `ALLOW_REFRESH_TOKEN_AUTH`, and allow the `email` and `name` attributes to be written. Refresh-token rotation must be disabled for this implementation's refresh flow.
3. Set backend `Cognito:Issuer` to the pool issuer URL and `Cognito:Audience` to this app client ID. Apply the backend's AddAuthSubjectId database migration using its normal database setup workflow.
4. Set frontend `VITE_COGNITO_REGION` and `VITE_COGNITO_CLIENT_ID` in `.env.local` to the matching public values. Restart Vite; rebuild when using preview.
5. Choose **Create Your Profile**, register, and confirm the code sent to your email. You can resend the code. Then choose **Log In**. The frontend retrieves `/api/users/me` before treating the login as successful.
6. Use **Profile → Connection → Log out** to clear the local session. Logout clears this browser session's in-memory tokens; it does not revoke sessions on other devices.

Credentials go directly to Cognito over HTTPS, never to the local API or browser storage. Access and refresh tokens remain in memory and refresh automatically during API calls. Reloading the page requires logging in again; a preview profile is not an authenticated session. Local preview remains available and switches off API mode. Authenticated profile edits use PATCH /api/users/me; preview edits remain in session memory.

Concurrent API calls share one refresh request. A transient refresh failure blocks the request and allows a later retry. An expired/rejected refresh or a 401 for the current access token clears private UI state and returns to login. A 403 does not sign out. API requests are bound to the authentication generation: account changes while waiting for a token block dispatch, and late responses cannot populate another account or sign it out. No failed write is automatically replayed. Logout clears this application's local session; it does not revoke every Cognito session or immediately invalidate a JWT already sent to the API.

Entering the welcome, login or registration screen clears the current local session and cancels pending login results. After login, an account without a first name or neighborhood opens the profile editor with empty fields. The member can dismiss this prompt; it does not add a release eligibility policy. Signed-in edits use separate first and last names, a neighborhood and a bio, matching the API's 200/200/200/2000-character limits. The form rejects whitespace-only first names/neighborhoods, retains entered values on failure and displays errors inside the dialog. Profile saving has its own loading state; background activity reads do not disable the form. Empty real profiles display neutral prompts instead of sample names or locations.

MFA, temporary-password challenges, and password recovery are not implemented yet. A login challenge is shown as an explicit error and never treated as a successful login. Cognito enforces the actual password policy, in addition to frontend validation.

References: [Cognito sign-up and confirmation](https://docs.aws.amazon.com/cognito/latest/developerguide/signing-up-users-in-your-app.html), [InitiateAuth flows](https://docs.aws.amazon.com/cognito-user-identity-pools/latest/APIReference/API_InitiateAuth.html).

## Frontend structure

```text
src/
  main.jsx              Entry point and global styles
  App.jsx               Composes the application model and shell
  app/                  Shell, screen selection, layout and session coordination
  features/
    auth/               Injected registration/login/confirmation UI
    members/            Profile views, dialog and member mapping
    listings/           Need/Offering forms and detail view
    discovery/          Discovery screens and match/filter hook
    activity/           Activity view and injectable paginated loader
    conversations/      Demo inbox and conversation UI
  shared/
    ui/                 Reusable presentational components
    lib/                Pure matching/view helpers and static catalogues
  services/             API transport, Cognito and session primitives
  styles/               Existing shared styles
tooling/                Boundary enforcement and rendering regression tests
.github/workflows/      Frontend verification pipeline
```

Features expose `index.js` interfaces. UI receives data and operation callbacks, shared code has no feature/infrastructure dependencies, and clients are injected into feature hooks. ESLint rejects invalid import directions and direct UI transport/persistence. See [frontend architecture](FRONTEND_ARCHITECTURE.md) for ownership rules, test coverage and extension guidance. The production JSX transform uses React's automatic runtime.

## Domain responsibilities and boundaries

The app presents one member experience across requester/provider roles: profiles, listings, discovery, connection requests, agreed work, conversations, independent completion reports, reciprocal reviews, optional outcome photos and safety reporting. The authenticated inbox now uploads private review photos and case evidence, shows authorised variants, allows photo withdrawal and reporting, and keeps text review submission available after an image failure. Operator queues show reported images and private case evidence with removal controls. These are local implementation paths; real S3 browser upload, Cognito multi-account, accessibility and staging checks remain open. See the S9 evidence and S10 local evidence under `../docs/test-evidence/2026-10-09/`.

UI owns presentation/navigation/transient form state and API interaction. Backend domains own identity mapping, permissions, authoritative data, capacity, acceptance, completion and reputation. Never infer completion from a message/photo or convert a recommendation into an agreement locally. Demo ratings do not establish member trust.

## Migration and security guidelines

Feature interfaces and injected clients now separate UI from infrastructure. Private state is session-scoped; logout/account changes clear collections and invalidate delayed responses. Keep demo records isolated and never upload demo profiles/messages implicitly. Addressable routes and real multi-account browser acceptance remain future work.

Keep tokens in memory and VITE variables public/non-secret. Use HTTPS and one public App API/BFF; never expose internal prepare/activate/case-resolution commands. Render user text safely, avoid raw HTML, protect private caches and redact tokens/grants. Server-side owner/participant/staff checks remain authoritative; CORS is not authentication.

Local Terraform declares password, SRP and refresh flows for the public client. Verify a fresh plan and actual Cognito configuration before deployment. MFA/challenges are unsupported. A later cookie-session BFF needs explicit CSRF/session design. Add explicit methods, revisions, structured errors and scoped idempotency when domain commands ship; do not blindly retry unsafe posts after timeouts.

Use package.json scripts for verification; add meaningful account-switching and journey tests for new capabilities, including pending acceptance, separate confirmations, hidden reviews and media failures. Commands above are guidance, not verification executed by this README task.

## Supporting design and change control

See [domain boundaries](../docs/domain-design/business-boundaries.md), [app/service design](../docs/domain-design/microservices.md), [security and repository catalogue](../docs/domain-design/microservices-validation-security-repositories.md) and [change register](../docs/document-change-register.md). Existing API lives in ../connecto-api; proposed edge in ../connecto-app-api. Material changes require register assessment; canonical Word changes require explicit proposal approval under parent AGENTS.md.
