# Backlog

What is known and not done, after 1.0. Each item says what it is, where it lives in the code, and why it waited. Fixed items are removed; the history is in the changelog.

## Next

### Performance

- **Mobile LCP 5.1 s in Lighthouse (Performance 75; desktop 99).** The LCP element is the line under the title. It depends on the URL, so it renders only after hydration; the static HTML shows a skeleton there. 88 % of the time is render delay on a 4× slower CPU. Fix: render the default view's text in the static HTML and replace it only when the URL differs; split the dashboard's client JS further (the main chunk boots in ~1.2 s on 4× CPU). Numbers: `docs/requirements-map.md`.
- **A stored "Tiles" view shifts the layout once on load.** Before hydration the market card shows a map-shaped skeleton. The mode already avoids this with a before-paint script (ADR 0015); the stored view can do the same, since `localStorage` is readable in the head script.

### Accessibility

- **No real screen-reader pass yet.** axe and Lighthouse cover names, roles and live regions; nobody has listened to it. To check with VoiceOver and NVDA: the streaming answer is read once when it ends (`aria-busy` on a `role="log"`), and heat-map cells, which say only their value and rely on the row and column headers being announced as focus moves.
- **Small countries on the phone map** (Germany 8×9 px, the UK, Italy) are under 24 px. WCAG 2.5.8 allows it because Tiles and Table offer the same with full-size targets. Better: a tap in a dense area zooms in first, or a note under the map pointing to Tiles.
- **The alerts sheet stays usable behind the offline notice.** It is portalled outside the wrapper the notice makes inert, so the keyboard can still switch rules while offline. Mark portalled layers inert too, or release the sheet's focus trap while offline.

### Hardening

- **SSE errors lose detail.** `streamSse` drops the API error `code` from a non-2xx JSON body and does not check that `Content-Type` is `text/event-stream` (`src/shared/api/http/stream-sse.ts`). Nothing reads it yet.
- **The "New content" smooth scroll can stop short** while tokens keep arriving (not reproduced), and sending a question while scrolled up does not jump to it (`use-stick-to-bottom.ts`). Scrolling while streaming is tested at hook level only.
- **Copied text can hold an empty source label** when a citation has no `label` and the dataset failed to load ("Sources: ; Germany", `copyText` in `AnswerMessage.tsx`). No fixture does this today.
- **Popups in the assistant's message list have no scroll boundary** (`PopperBoundary` covers `<main>` only), so a source card's popup could follow its trigger over the panel header.
- **Retry resends a failed alert write as it was.** If the rule was changed again in between, the older version comes back. Needs two edits of one rule inside one failed save.
- **A radar series with no value on a kept axis** would be drawn at the centre. Impossible with this data (no zero forecast or prior year).
- **The Excel export's column letters are written by hand** in the totals (`'D'`, `'J'`). Derive them from the column list if columns ever move.
- **Shift+Enter on a tile** relies on the browser putting `shiftKey` on the click a key press makes (Chrome and Firefox do).
- **The localised 404's server HTML is Next's empty error shell** (no `lang`, empty `<body>`), so without JavaScript the page is blank. The status (404) is right. Cause not found yet; to look at: the `[...rest]` catch-all and the missing top-level `app/layout.tsx` / `app/not-found.tsx`.
- **No test for** the Excel export span's error status, or for the monitoring tags mounted through `Providers`.
- **The E2E suite does not run against Vercel previews yet** (`deployment_status` with the preview URL, limited to `release/*` to spare CI minutes).
- **Chromium download in CI has no timeout of its own.** A cache miss once took 9.5 minutes of the E2E job's 15; a slower one would fail the job with no report. Add a `timeout-minutes` and a retry on the install step.

### Before real users

- **Server-side limits.** Rate limits per user or IP for `/api/chat`, `/api/v1/alerts` and a future feedback endpoint (middleware or the platform firewall). The alerts route also needs input limits: today a POST with 3,000 market ids gets 201 and a cookie too big for the browser to keep.
- **Answer feedback has nowhere to go.** 👍/👎 goes to `logEvent` (the console and a Sentry breadcrumb), without the question text. A real endpoint would dedupe by `answerId`; today a rating is not kept across a reload, so a restored answer can be rated again.
- **Privacy.** A Sentry organisation in the EU region, a privacy notice, Sentry's DPA and a consent banner (ADR 0019). Narrow Sentry Logs with a `beforeSendLog` filter: today every console line is sent, and lint cannot see a stray `console.log` with personal data.
- **Live currency rates.** Rates are a snapshot (ECB, 2026-11-05) in `shared/config/currency.ts`; a real backend sends rates with the data.

## Accepted trade-offs

- **Chat history is in `sessionStorage`**, not `localStorage` or a server. The brief rules out a real backend. `sessionStorage` survives a reload and ends with the tab; `localStorage` would leave transcripts on shared computers and race between tabs. Guards: plain-text rendering and no third-party scripts (XSS), a 50-message cap (quota), writes only when a message starts or ends, a versioned key read through zod. "New chat" clears it.
- **An answer cut by a reload comes back as "Stopped" without its partial text**, because storage is written per message, not per token. A `pagehide` flush would keep it if needed.
- **Citations are per answer, not per claim.** The contract has no positions in the text; guessing them would mean parsing AI text.
- **Status is for the latest month only** in the data; the data block under an answer says so, even when a question says "this quarter".
- **One type cast in the map** (`TOPOLOGY` in `MarketMap.tsx`): react-simple-maps types `geography` as GeoJSON but accepts the TopoJSON world-atlas ships. Converting with `topojson-client` would add a dependency and still need a cast.
- **Back undoes one checkbox at a time** in the multi-pick menu: each pick is its own history entry.
- **Radar colours follow the selection order**, not the market. Four slots for 13 markets cannot be fixed per market; legend, dash and marker always match.
- **With a product picked, the map's status stays per market** while the tooltip shows the product's attainment; a note under the card says so. Move the note into the tooltip if people misread it.
- **The threshold field reads "1,000" as 1** in English. Nobody types a thousands separator in a field that holds up to 200 % or a few million.
- **A USD alert rule edited in EUR or GBP shows six decimals** ("1.113688" M€): exact, but reads oddly.
- **A market near a revenue break may change colour with the currency**: the steps stay round in the chosen currency.
- **The Excel share total is checked in Microsoft Excel only.** LibreOffice may not take `SUBTOTAL` over `OFFSET` inside `SUMPRODUCT`.
- **German compact amounts** stay full below a million (`74.374,7 €`): CLDR has no compact form for thousands in German.
- **A path outside the app's routing** (`/x.txt`, `/api/unknown`) gets Next's English 404: a localised one needs `global-not-found`, an experimental flag.
- **The 404 and 500 titles are set on the client**: Next's metadata cannot be localised in `not-found`.
- **Page-load and server traces are two traces in Sentry**: joining them needs `clientTraceMetadata`, which is experimental.
- **A real mid-stream chat failure is reported twice** (the server's exception and the browser's `ChatServerError`): the browser cannot tell it from the `error` fixture.
- **React's recoverable hydration errors are not reported**: Next gives no hook outside the console.
- **Unknown query keys** (`utm_*`) stay in the URL so campaign tags survive; only the dashboard's own keys are repaired.
- **On a 320 px phone in Russian** the period button is cut ("май 20…"); the full period is its name and is in the picker. 360 px and up fit in every language.

## Watching

- **Two unit tests failed once under load** and pass alone and in reruns: `MarketsTable` "a market the alert rules flag has a bell" and `HeatMap` "the default Analyst view shows growth by month".
- **Whether ad-block lists drop `/monitoring`**, the route Sentry events go through.
