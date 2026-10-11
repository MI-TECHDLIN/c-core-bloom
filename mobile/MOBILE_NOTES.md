# C-Core-Bloom mobile app audit

This phase is read-only. No files under `src/`, `public/`, or the root web app were changed. The work here is limited to `mobile/` and captures the audit required before any implementation.

## 1. Web stack and versions

Verified from the root `package.json`:

- React: `18.3.1`
- React DOM: `18.3.1`
- React Router DOM: `^6.30.1`
- Vite: `^5.4.19`
- TypeScript: `^5.8.3`
- Tailwind CSS: `^3.4.17`
- Supabase JS: `^2.80.0`
- TanStack Query: `^5.83.0`
- shadcn/Radix primitives: imported across UI components, including Radix Dialog, Tabs, Tooltip, Dropdown Menu, Select, Toast, Radio Group, etc.
- Additional relevant libraries: `recharts`, `jspdf`, `firebase`, `lucide-react`, `zod`

Note: the project description in the generic mobile guide mentions React 19, but the actual repo in this checkout is React 18.3.1. The Capacitor architecture still applies; the mobile build should match the real installed version to avoid duplicate React runtimes.

## 2. Routing model

Routing is mounted in `src/App.tsx`, not in `src/main.tsx`.

Key findings:

- `src/main.tsx` only mounts the app root:
  - `createRoot(document.getElementById("root")!).render(<App />);`
- `src/App.tsx` wraps the app in `BrowserRouter` and declares all routes.
- Route list:
  - `/` -> `Index`
  - `/auth` -> `Auth`
  - `/admin-login` -> `AdminLogin`
  - `/super-admin-login` -> `SuperAdminLogin`
  - `/reset-password` -> `ResetPassword`
  - `/forgot-password` -> `ForgotPassword`
  - `/dashboard` -> `Dashboard`
  - `/test/:testId` -> `TestTaking`
  - `/results` -> `Results`
  - `/results/:resultId` -> `ResultDetail`
  - `/admin` -> `Admin`
  - `/jamb` -> `JambPractice`
  - `/super-admin` -> `SuperAdmin`
  - `/drive` -> `GoogleDrive`
  - `*` -> `NotFound`

Implication for mobile: the recommended Capacitor wrapper is correct because the app is already a single-page React app, and the existing root router can be mounted in the mobile shell without editing the web app.

## 3. Auth model and redirect behavior

The web app uses Supabase auth through `src/integrations/supabase/client.ts` and `src/contexts/AuthContext.tsx`.

### Supabase client

`src/integrations/supabase/client.ts` creates the client as:

- `SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY`
- `createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { auth: { storage: brokeredPreviewStorage(), persistSession: true, autoRefreshToken: true } })`

This means the app expects an anon/public key only in the client bundle. No service role or secret key is used client-side.

### Auth methods used

From `src/contexts/AuthContext.tsx`:

- `supabase.auth.signUp({ email, password, options: { emailRedirectTo, data: {...} } })`
- `supabase.auth.signInWithPassword({ email, password })`
- `supabase.auth.signOut()`
- `supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` })`
- `supabase.auth.onAuthStateChange(...)`
- `supabase.auth.getSession()`

The sign-up and admin sign-up flows set `emailRedirectTo` using `window.location.origin`:

- regular user sign-up redirects to `/`
- admin sign-up redirects to `/admin-login`
- password reset redirects to `/reset-password`

### OTP / password reset logic

Password reset flows use a Supabase Edge Function named `reset-password`, invoked from `src/pages/ForgotPassword.tsx`.

Observed behavior:

- Request OTP by username + role (`user` or `admin`)
- Validate OTP against the backend at `reset-password` edge function
- Reset password after OTP validation
- Admin and super-admin flows use the same pattern, with role-sensitive generation / validation logic

No custom OAuth flow is currently visible in the codebase as a first-class web auth path; the primary auth is Supabase email/password plus OTP-backed reset flow.

### Session storage details

- `brokeredPreviewStorage()` in `src/integrations/supabase/previewAuthStorage.ts` is a preview-specific browser storage bridge for Lovable preview surfaces; otherwise it falls back to `localStorage`.
- The app does not appear to use a dedicated secure token storage layer in the core web app.

## 4. Role model and admin routing

Role logic is established in `src/contexts/AuthContext.tsx`.

### Role check

The key logic is:

- `supabase.from('user_roles').select('role').eq('user_id', userId).in('role', ['admin', 'super_admin'])`
- If any row exists, the app sets `isAdmin = true`
- `AuthProvider` exposes `user`, `session`, `loading`, `adminLoading`, `isAdmin`

This means the app treats any user with either role in `user_roles` as an admin for the client-side gating.

### Route guards

- `Auth.tsx` redirects logged-in users to `/admin` if `isAdmin`, otherwise `/dashboard`
- `Admin.tsx` checks `if (!user) navigate('/auth'); if (!isAdmin) navigate('/dashboard');`
- `AdminLogin.tsx` allows access only if `user && isAdmin`, otherwise shows access denied
- `SuperAdminLogin.tsx` explicitly queries `user_roles` for `super_admin` and signs the user out if the role is missing before redirecting
- `SuperAdmin.tsx` contains the super-admin-only management dashboards and actions

### Admin-only routes and screens

Admin-only routes:

- `/admin-login`
- `/admin`
- `/super-admin-login`
- `/super-admin`

Admin-only page components:

- `src/pages/Admin.tsx`
- `src/pages/SuperAdmin.tsx`
- `src/pages/AdminLogin.tsx`
- `src/pages/SuperAdminLogin.tsx`

Admin-only subcomponents used by the admin UI:

- `components/admin/TestManager`
- `components/admin/QuestionManager`
- `components/admin/AnalyticsDashboard`
- `components/admin/AssignedUsersManager`
- `components/admin/PasswordResetManager`
- `components/admin/SubmittedTestsManager`
- `components/admin/JambQuestionsManager`
- `components/admin/SystemConfigPanel`
- `components/admin/AdminPasswordResetManager`
- `components/admin/AdminActivityMonitor`
- `components/admin/SuperAdminJambSync`
- `components/admin/DatabaseDashboard`

Important mobile requirement: the backend remains the source of truth for admin enforcement. Client-side hiding is acceptable UX only; it must not be the only enforcement.

## 5. Browser-only APIs and WebView risk areas

The app does use browser-only primitives that are relevant for mobile WebView behavior.

### Local storage

Observed direct browser storage use:

- `src/pages/TestTaking.tsx`
  - Writes exam session data to `localStorage` with key `jamb_test_session_${testId}_${user.id}`
  - Restores saved session from localStorage
  - Removes session data on expiry or completion
  - This is the most important mobile-specific override target because localStorage is browser-session scoped and not a reliable cross-application persistence mechanism for exam continuity.

- `src/integrations/supabase/previewAuthStorage.ts`
  - Uses `localStorage` as the default storage adapter for preview auth flow
  - This is preview-only and not part of the app’s production auth path, but it matters if the mobile build reuses the same client and preview path.

### Session storage

- `src/lib/googleAuth.ts`
  - Uses `sessionStorage.setItem('google_drive_token', cachedAccessToken)`
  - Reads on `getAccessToken()`
  - Removes on sign out
  - This is a mobile override candidate if Google Drive auth is used in-app.

### Clipboard

- `src/components/admin/TestManager.tsx`
  - Uses `navigator.clipboard.writeText(link)`
- `src/components/admin/PasswordResetManager.tsx`
  - Uses `navigator.clipboard.writeText(generatedOtp)`
- `src/components/admin/AdminPasswordResetManager.tsx`
  - Uses the same pattern

In a WebView, `navigator.clipboard` may require a secure context and user gesture; mobile should add a wrapper or fallback.

### Window and network events

- `src/pages/TestTaking.tsx`
  - Adds `window.addEventListener('online', ...)`
  - Adds `window.addEventListener('offline', ...)`
  - Uses connection-state messaging for exam resilience
- `window.location.origin` is used for redirect URLs in `AuthContext.tsx`

### Additional browser-specific behavior detected

- `window.parent` and `postMessage` logic exists in `previewAuthStorage.ts` for Lovable preview embedding; not a direct production mobile issue but relevant if the same client is reused in preview-only flows.
- No direct evidence of `window.open`, `window.print`, `Notification`, `beforeunload`, `visibilitychange`, or heavy service-worker usage in the main app paths from the audit pass.
- `src/pages/TestTaking.tsx` also uses an exam timer, autosave, and online/offline awareness that should be checked for lifecycle handling inside a native app.

### Practical mobile override plan

The app will need a small number of targeted overrides, not broad rewrites. The likely mobile overrides are:

1. `localStorage` and `sessionStorage` access for exam autosave / token cache
2. Clipboard copy for admin OTP and test links
3. Mobile-safe route and lifecycle handling for active exam timers
4. Optional download/share wrappers for admin exports and file handling

## 6. Environment variables and config inputs

Only a small set of `import.meta.env.*` values were found in the checked code:

- `VITE_SUPABASE_URL` -> `src/integrations/supabase/client.ts`
- `VITE_SUPABASE_PUBLISHABLE_KEY` -> `src/integrations/supabase/client.ts`

Other web app config values are not in `import.meta.env.*` for this audit; the Firebase Drive auth uses a JSON config file (`firebase-applet-config.json`) rather than env variables.

This means the mobile app should load the same Supabase URL and anon key using the mobile environment layer, but it must not bundle any server-side secret or service-role credentials.

## 7. Heavy parts of the app

The web app contains several heavy or sensitive areas that matter for mobile optimization and parity:

- Large admin dashboards: `SuperAdmin.tsx` and `Admin.tsx` include many sub-managers and realtime listeners
- Large result export logic: `jspdf` is part of the app and used in admin-level PDF generation or reporting
- Recharts-based analytics dashboards and charting components
- High-volume data tables and admin lists; the app is not obviously paginated everywhere, so large lists will need to be treated carefully on mobile
- Timed exam flow in `TestTaking.tsx` with autosave, state restore, and connection monitoring
- Realtime subscriptions in `SuperAdmin.tsx` on PostgreSQL changes for `past_questions`, `question_visibility`, `profiles`, and `tests`
- Google Drive auth / file integration (`src/lib/googleAuth.ts`)
- Admin file import/export and document generation paths may require native file-picking and download wrappers

## 8. Mobile suitability assessment

### Architecture confirmation

The recommended architecture in Section 2 is valid for this repo:

- Existing app is a Vite React SPA with a single `BrowserRouter` root
- All main app logic is already centralized in the web source tree
- Authentication and role checks already use Supabase client APIs
- A native Capacitor webview wrapper can re-use the same app without modifying web source files

### Likely blockers / overrides

No major architecture blocker is evident from this audit, but the following will need override or wrapper handling inside `mobile/`:

- `localStorage`-based exam autosave
- `sessionStorage`-based Google Drive token cache
- Clipboard copy for admin flows
- Potential deep-link / app redirect handling for auth callbacks and magic-link/OTP flows
- Large admin actions and file download/export flows needing native file sharing or filesystem access
- Lifecycle/timer handling during app backgrounding and reconnect scenarios

### Questions to confirm before implementation

- Whether the app is expected to support full Google Drive integration in mobile, or whether it can remain a web-compatibility layer with a graceful fallback
- Whether the app should support custom mobile deep links or is acceptable with standard web-origin redirects plus native app wrap
- Whether the admin file import/export paths are required to be fully native in the first mobile milestone or can be deferred behind a `Needs web change request` or fallback issue

## 9. Audit conclusion

The web app is a standard Vite + React + React Router + Supabase client app with a single shared BrowserRouter mount and role-based route gating. The recommended Capacitor + alias-to-`../src` architecture is appropriate for this repository and does not require a rewrite of the web app.

The most important mobile-specific adjustment points are:

- exam autosave and restoration
- session / token persistence in storage adapters
- clipboard and file-download wrappers
- deep-link and auth redirect configuration
- lifecycle-sensitive timer handling and offline sync state

This audit suggests the build can proceed to the next phase with a thin mobile shell and minimal override layer, without touching the web app itself.
