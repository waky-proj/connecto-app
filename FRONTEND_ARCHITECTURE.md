# Frontend component boundaries

Implemented locally on 1 October 2026. These rules apply to new and changed frontend code.

| Location                 | Owns                                                                | Allowed local dependencies                                     |
| ------------------------ | ------------------------------------------------------------------- | -------------------------------------------------------------- |
| `src/app`                | Composition, navigation, session lifecycle and feature coordination | Feature public interfaces, services and shared code            |
| `src/features/<feature>` | Screens, local form state, feature hooks and pure adapters          | Own files, other feature `index.js` interfaces and shared code |
| `src/shared/ui`          | Reusable presentation with explicit data and callback props         | Shared code                                                    |
| `src/shared/lib`         | Pure utilities and static view/contract data                        | Shared code                                                    |
| `src/services`           | HTTP transport, Cognito integration and session primitives          | Services and shared code                                       |

Every feature exports its supported interface from `index.js`. Shared code never imports a feature, service or application module. Infrastructure never imports UI. Features receive narrow API clients or callbacks from application composition rather than importing configured infrastructure.

`App` composes `useConnecto` and `AppShell`. The shell owns layout, feedback and the profile dialog. `AppRouter` selects screens and supplies explicit props. `useConnecto` coordinates session clearing, profile/activity hydration and posting; it remains an application coordinator. Discovery owns filters, ranking and match loading in `useDiscovery`. Activity pagination and member mapping are independent, injectable functions.

## Implementation rules

- Give each component one clear responsibility. Split separate workflows/state ownership; avoid arbitrary line-count limits.
- Keep form state local and supply explicit data/semantic callbacks. Avoid passing a global store into feature screens or adding global context for a single feature.
- Keep transport, credentials and persistence outside UI. UI must not call `fetch` or access local/session storage. Server authorisation remains authoritative.
- Keep private state and tokens in memory. Logout/account changes clear private state and invalidate delayed results; extracted loaders preserve this guard.
- Share components when responsibilities are actually shared. Keep feature validation/workflows inside the owning feature.
- Provide accessible loading, error and empty states. Escape user text and avoid raw HTML injection.
- Preserve existing DOM/classes during this refactor. Global styles remain; future component-specific styling should be scoped to avoid effects on other screens.

## Enforcement and verification

`npm run lint` enforces import directions and public feature interfaces, including static imports, re-exports and literal dynamic imports. It rejects direct transport/browser persistence in UI and runs React hook rules. Checks assume relative imports; any new alias/loader must extend the resolver and negative tests before adoption. Dependency isolation is a maintainability rule, not a runtime security boundary.

`npm test` includes negative boundary tests, transport/token/session regressions, activity pagination/account-change regressions, and server-rendering smoke coverage for thirteen screen selections plus the profile dialog/feedback states. Rendering uses the real Vite JSX configuration and injected operations, without contacting Cognito/backend. It does not replace interactive browser acceptance or an accessibility audit.

`npm run build` verifies production bundling. `.github/workflows/ci.yml` runs lint, tests and build for pull requests and pushes to main after publication. This local change has not configured remote workflow execution or required branch rules.

New features require a public interface, explicit dependency ownership, meaningful behaviour/negative tests and passing lint/test/build. Browser journeys, SQL, live Cognito and staging remain separate release gates.
