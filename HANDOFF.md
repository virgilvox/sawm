# sawm — handoff

## what it is
Ramadan fasting companion. Dark industrial aesthetic. Live fasting timer, hydration tracker, context-aware guidance, prayer schedule, prayer/fasting tracking, mosque finder, and city-based chat.

## stack
- **Frontend**: Svelte 5 + Vite (SPA, no SvelteKit)
- **Backend**: Convex (schema, auth, functions)
- **Hosting**: Netlify (https://sawm.netlify.app)
- **Chat**: Clasp WebSocket relay (wss://relay.clasp.chat)
- **Prayer times**: AlAdhan API
- **Mosques**: Overpass API (OpenStreetMap)
- **Location**: navigator.geolocation + BigDataCloud reverse geocode

## deployments
| Environment | URL |
|---|---|
| Production site | https://sawm.netlify.app |
| Convex prod | https://grand-butterfly-659.convex.cloud |
| Convex dev | https://fiery-mastiff-851.convex.cloud |
| Convex dashboard | https://dashboard.convex.dev/t/moheeb-zara/sawm |
| Netlify admin | https://app.netlify.com/projects/sawm |

## env vars

### Netlify
- `VITE_CONVEX_URL` = prod convex cloud URL
- `VITE_CONVEX_SITE_URL` = prod convex site URL

### Convex (both dev + prod)
- `SITE_URL` — dev: http://localhost:5173, prod: https://sawm.netlify.app
- `JWT_PRIVATE_KEY` — RSA private key for auth tokens
- `JWKS` — matching public key set

### Local (.env.local, gitignored)
- `CONVEX_DEPLOYMENT` — dev deployment name
- `VITE_CONVEX_URL` — dev convex cloud URL
- `VITE_CONVEX_SITE_URL` — dev convex site URL

## running locally
```
npm run dev          # vite dev server
npx convex dev       # convex backend (in separate terminal)
```

## deploying
```
# convex prod (builds frontend too)
npx convex deploy --cmd "npx vite build" --yes

# netlify (manual deploy)
VITE_CONVEX_URL=https://grand-butterfly-659.convex.cloud \
VITE_CONVEX_SITE_URL=https://grand-butterfly-659.convex.site \
npx vite build && netlify deploy --prod --dir=dist

# netlify also auto-deploys on git push (reads env vars from netlify dashboard)
```

## file structure
```
sawm/
  convex/           schema.ts, auth.ts, http.ts, users.ts, fastingLogs.ts, prayerLogs.ts
  src/
    main.js         svelte mount
    app.css         all styles (dark industrial theme)
    App.svelte      root: tab state, modal hosts, location/prayer init
    stores/         auth.svelte.js, location.svelte.js, prayerTimes.svelte.js
    lib/            timeUtils.js, ramadan.js, guidance.js, glossary.js,
                    prayerApi.js, mosqueApi.js, clasp.js, chatStore.js
    components/
      BottomNav     4 tabs: home, track, mosques, chat
      FastingView   home tab (ring, guidance, hydration, schedule, glossary)
      TrackView     auth-gated prayer + fasting tracking
      MosqueView    overpass-powered mosque finder
      ChatView      clasp-powered city chat
      AuthModal     email/password sign in/up
      Settings      calc method + hydration goal
      + ProgressRing, Guidance, HydrationTracker, PrayerSchedule,
        Glossary, LocationBar, Term, PrayerTracker, FastingLog
  index.html
  netlify.toml      build config + SPA redirect
  sawm.html         original single-file reference (archived)
```

## key decisions
- Stores use module-level `$state` in `.svelte.js` files (not svelte/store)
- `<Term>` component replaces old `termWrap()` to avoid `{@html}` XSS
- HTML entities replaced with inline SVGs everywhere
- Hydration stays localStorage-only (no auth needed)
- Chat messages: ephemeral on clasp server, persisted locally via IndexedDB
- Separate `profiles` table (not extending `users`) to avoid convex auth schema conflicts
- Clasp room addresses: `sawm-app-chats/{city}/{state}` (lowercase, hyphens)

## known gaps
- Chat only shows your auto-detected city room (no manual city search/add yet)
- No email verification on auth (can add Resend later)
- Convex queries not yet wired to TrackView (uses localStorage cache, TODO: real-time sync)
- No favicon
- sawm.html kept as archive but diverges from the svelte app
