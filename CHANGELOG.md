# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning: [SemVer](https://semver.org/). The top version must match `package.json` and the `release/X.Y.Z` branch.

## [0.16.0] - Unreleased

### Added
- `POST /api/chat`, the path the starter pack's contract names, answers like `/api/v1/chat` (a rewrite; ADR 0012).

### Changed
- Region and market names follow the page's language (`Deutschland`, `Германия`; regions `Europa`, `АТР`): the names are in the messages (`places`), generated once from `Intl.DisplayNames` so server and browser agree. Product names are brands and stay. The CSV export keeps the dataset's names, like its USD columns.
- German and Russian name the forecast one way: Plan / План everywhere (the table said Prognose / Прогноз, the map Zielerreichung).
- Share link shows "Link copied" under the button for 2 s (seen on a phone, where the button is only an icon); the screen reader's announcement is unchanged.
- The drill-down path moved from the header to the page, above the title, on every screen: the phone header is two rows (≈120 px, was ≈225), the desktop header keeps name, period, mode and the switches.
- Phone header: period and mode share one row, half the width each (the full period when it fits, measured; else the month over "12 mo"; no calendar icon): the header is a row shorter. A version that slid the row away while scrolling was tried and dropped: menus picked in it flickered (owner, 2026-11-06).
- Analyst on wide screens: the map stays in view while Top risks and the radar next to it scroll, so a pick on the map and the radar it changes are seen together.

### Fixed
- Alerts: lists stored before 0.16.0 get their examples' presets back (named in the page's language again, their names taken in every language); an example the user renamed stays theirs.
- Alerts: the server keeps presets to the examples: a new rule cannot claim one, a change keeps only the rule's own.
- Alerts: Edit after a refused rule shows it in the currency chosen now, also after a switch while the form is open (it kept the old currency's numbers and saved them at the new rate).
- Alerts: Edit is offered only where the form can fix the refusal (a taken name, an invalid value); a refused toggle, ten rules or a rule deleted elsewhere offer Dismiss; a failure whose rule is gone shows above the list, by name, instead of nowhere.
- Period label: measured again when the web font arrives, not only when the room changes.
- No hydration error on the bell: its count is shown from after hydration. The alert rules could arrive before the bell's part of the page hydrated (seen in development), and the static HTML has no count.
- Phone settings: picking a currency no longer flashes its menu 190 px away: the menus in the bottom sheet open upward, so the sheet sliding down after a pick no longer flips them mid-fade.
- Sentry no longer receives this machine's errors and console lines: a DSN in `.env.local` alone sends nothing; `NEXT_PUBLIC_SENTRY_LOCAL=true` sends, as environment `local`. Deployments report Vercel's environment (`production`, `preview`) instead of `NODE_ENV`, under which a local build or a preview counted as production (ADR 0019).
- Heat map with a mouse: the line under the grid only reads the cell out; its Open and Select buttons, which changed under the mouse on the way down to them, are for touch screens, where a tap shows the cell. A tap where a mouse is the main pointer opens, as a click does.
- A hand-typed currency in another case (`?currency=eur`) is written as `EUR`, not dropped to USD; the repair is logged once per link, not once per widget.
- The radar's axis names (Momentum, Attainment, Выполнение плана) are no longer cut off in a narrow card.
- Alerts: the example rules are named in the page's language in every language, also after a switch (they carry a preset; an edit from the form makes the name the user's). Before, they kept the language of the first visit, and the first save after a switch could clash with an example's name in another language.
- Alerts: a save the API refuses (a name already taken) no longer offers a Retry that cannot pass: Edit opens the form again with what was typed and the error on the name. A refused delete offers only Dismiss.
- Alerts: Escape (or Close) gives focus back to the bell, also when a link opened the sheet.
- Assistant: Try again after a failed answer asks again in its place; the failed turn no longer stays above the new one. A stopped answer stays (it holds what had arrived).
- Assistant: on a window as narrow as a phone, a source picked with the mouse no longer leaves its card over the header.

## [0.15.0] - Unreleased

### Added
- **Share link** at the end of the title row, on every level and in both modes: copies the address of the view (drill path, period, mode, selection, currency, open tab, language), says "Link copied", and points to the address bar if the browser blocks the clipboard. A share icon on phones.
- The currency is in the URL (`?currency=EUR`; USD is not written), so a shared link opens in the sender's currency. It is no longer remembered per browser: a clean address and Reset view show USD (ADR 0017).

### Changed
- Node.js is pinned to 24.x (`engines`): Vercel no longer moves the build to a new major version on its own, the same Node as `.nvmrc` and CI.

## [0.14.0] - Unreleased

### Added
- Error monitoring with Sentry (ADR 0019): errors from the browser and the server, 10 % of traces in production, with the screen's language, mode, currency and tab on every event. Off without `NEXT_PUBLIC_SENTRY_DSN`. E2E runs it on with a DSN that points nowhere and checks what the browser would send.
- No personal data: no IP address, user id, cookies, headers, request bodies or question text; events go through the app's own `/monitoring` path, which forwards only the event body. The browser copy of a server fault the server already reported is not sent twice; the demo save failure and expected answers are breadcrumbs.
- Warnings when data is lost without an exception (an unreadable alerts cookie, a stored chat that no longer fits, a full storage) and when an answer cites what the dataset lacks; breadcrumbs for a repaired link and a 404; the chat answer (time to the first token and to the end) and the Excel export are timed.
- Sentry Logs: every `console.log`, `console.warn` and `console.error` line, in the browser and on the server.
- A Sentry test page (`/sentry-test`, every language) that fires each kind of error. It exists only where `ENABLE_SENTRY_TEST_PAGE` is set (`.env.local`); everywhere else it and its API are a 404.
- README: what is stored and sent, and what a production launch for UK/EU users needs (a consent banner, a privacy notice, Sentry's DPA, an EU data region).

### Changed
- Expected failures (a name already taken, a user's 4xx) are breadcrumbs, offline and timeouts warnings, everything else an error: one rule, `reportLevel`.
- Lint: Sentry is imported only by the logging and monitoring helpers.
- Sentry's experimental Next.js flag (`clientTraceMetadata`) is removed: nothing experimental in production (ADR 0018).
- No layout shift when the alert rules arrive: the status table's Alerts column keeps its width and shows a placeholder instead of "None" while they load, Top risks waits for them, and the mock API answers reads at once (writes still wait, to show "Saving…").

## [0.13.1] - Unreleased

### Changed
- Lint: the dataset is read only through `useDataset()` / `useDashboard()`, which convert to the chosen currency; the bare query (dollars) is allowed only where dollars or no amounts are needed (ADR 0017).
- CI: the check on a pull request into `master` is named "Branch & version", like its `develop` counterpart (ADR 0007).

## [0.13.0] - Unreleased

### Added
- A title per page in its language ("Dashboard · Market Ops Console", "Page not found · …"), the description and a link preview (Open Graph, Twitter) in the page language (ADR 0018).
- Favicon: the M logo, light or dark with the browser's scheme; an iPhone icon and `favicon.ico`.
- A link preview image, one per language (logo, name, description). It resolves once the site is deployed (0.15.0).
- `robots.txt`: the console stays closed to search engines (no crawling, `noindex` on every page), so there is no sitemap.

### Changed
- The 404 and 500 pages have the app's look (logo, the code, title, text, buttons; light, dark, phone). 404 shows the address that was not found, 500 the error ID when there is one. When the whole app fails, the last-resort page speaks the address's language instead of English only.
- Label separators (" · "), lists of names ("Germany and Spain") and the Excel sheet's anomalies (with a readable month) come from the dictionaries, so German and Russian read naturally. The copied sources of an answer are a list in the UI language.
- Lint checks plain `.ts` files and more announced attributes for text outside the dictionaries (ADR 0011).
- Rule: no experimental Next.js features in production; so a path outside the app's routing (`/x.txt`) keeps Next's own 404.

## [0.12.0] - Unreleased

### Added
- Currency: amounts in US dollars, euros or British pounds, chosen in the header (desktop) or the ⚙︎ settings sheet (phone) and remembered in this browser. ECB rates of 5 November 2026 (1 USD = 0.89095 EUR = 0.74299 GBP), fixed in the code for this demo; a live app would get them from the backend API, and the menu says so. One rate for every month, so growth, attainment and share stay as they are. Everything that shows an amount converts: KPIs, charts, the markets table, heat map, radar, map and its revenue steps (round in the chosen currency), Top risks, the assistant's evidence cards, alerts (revenue thresholds typed in the chosen currency, stored in USD) and the Excel export (the About sheet names the rate and its date). CSV stays raw USD. The assistant's answer text is shown as received; when it quotes dollars in another currency, a line says so (ADR 0017).
- The "M" logo next to the app name, from the design; it inverts in dark mode.

### Changed
- Money shows a bare symbol everywhere: `$22.9m`, not `US$22.9m` in British English.
- The settings button's name lists the currency.
- Phone settings: a choice in the language, currency or theme menu closes the sheet.

### Fixed
- Every dropdown (theme, language, currency, path, map metric, filter, Export) kept a focus ring on its button after a choice made with the mouse or a tap. Focus still goes back to the button, without the ring; with the keyboard the ring stays, so you see where you are.

## [0.11.1] - Unreleased

### Changed
- CI: each check is its own job, so it gets its own line and log in the pull request and they run side by side. Into a release branch: Format, Lint, Types. Into `develop`: Branch & version first, then Format, Lint, Types, Unit tests and E2E. Shorter to wait for (~4.5 min instead of ~7.5 into `develop`), more runner minutes (~13 instead of ~8; ~4 instead of ~2 into a release branch), well within the free plan.
- The shadcn components use tokens and scale steps instead of arbitrary values where shadcn's `cn` still merges them right (`secondary-hover`, `rounded-md`, `min-w-24`, `ring-3`, `rounded-xs`); the rest stay as shadcn wrote them and are listed in DESIGN.md with the reason (a size or radius under a name of our own would make `cn` drop the variant's colour or corner). `ToggleGroup` takes `spacing` 0–4.

### Fixed
- Assistant: clicking a source (Germany, Italy, …) to open it on the dashboard made its card blink: it closed, reopened and closed again while the pointer was still on the button. It now closes once and shows again only after the pointer or focus leaves the button and comes back.
- Markets table: the "Total" cell was a shade darker than the rest of its row (and the row tinted on hover). They are one tone now.
- Excel export: the total row has the share too, revenue-weighted like the table's, and it follows the Excel filter like the other totals. Blank where the table shows none (not the latest month, or a product).
- CI: the Branch & version check (into `develop`) and the check into `master` failed at Node's setup, which since v5 caches pnpm's store on its own because `package.json` names pnpm, and these jobs install no pnpm. That cache is off for them now.

## [0.11.0] - Unreleased

### Fixed
- Alerts: with the panel open on desktop, a keyboard can't reach the toast (the panel keeps focus inside), so its Retry was mouse/touch only. A failed save now also shows in the rule's row ("Not saved. …", "Not deleted. …"; a new rule's above the list) with Retry and Dismiss, next after the switch for Tab; focus stays on the rule or the list afterwards. The row's Retry and the toast's are one action (pressing both sends it once) and the row's buttons close the toast; Dismiss forgets the rule's earlier failures too.
- Alerts: switching a rule with the keyboard sent focus to the start of the page while it saved (the switch was disabled meanwhile). It keeps focus now and waits for the save.
- The ⚠ anomaly mark in the markets table opens its note on a tap, like the alert bell next to it (it was a hover tooltip).
- After the "You're offline" notice goes, focus is back where it was instead of at the start of the page (unless it had already left the app; without scrolling).
- Screen readers: a heat-map cell no longer repeats its market and month ("Canada, Dec 2024: +12% (+11.7%)" → "+12% (+11.7%)"); the row and column headers say them, the month in full ("Dec 24" on screen). The table's ⚠ and bell popovers are named.
- Map with a keyboard: the focus ring is drawn on top, not partly under neighbouring countries and the status patterns; Tab to a market outside a zoomed-in view moves the map to it, with its tooltip. A tap or a click shows neither the ring nor the move.

## [0.10.0] - Unreleased

### Added
- End-to-end tests (Playwright, `pnpm e2e`, `e2e/`), on a desktop and a phone (Pixel 7 emulation): the brief's happy path (Germany on the map, the suggested question streams token by token, a source opens Germany in March 2026) and German number formats; Back and Forward in a real browser (drill-down one level at a time, another market keeping the product, selected markets with the table, the alerts sheet leaving no step behind, heat-map focus kept in the grid); the phone tab bar; alerts on the real API (a new rule saving, kept after a reload; a failed save rolled back with its reason, then Retry); the assistant's error with Try again, its "can't answer" without sources, and Stop mid-answer keeping the words so far; a shared link opening the same view in a fresh browser, and the Executive/Analyst switch undone by Back; Excel and CSV export as real downloads of the rows shown; going offline and back; a failing alerts API with Try again; accessibility scans with axe (WCAG 2.1 A/AA) of Executive, Analyst, the alerts panel and the assistant with an answer. The suite builds the app and starts it on port 3100, so a dev server on 3000 keeps running; with `BASE_URL` it tests that address instead (a deployed preview).

### Changed
- PRs into `develop` also run the E2E suite, so they build the app too (Chromium only, cached; the report is uploaded when a test fails).
- Unit tests run faster (72 s → 58 s on two cores, the CI runner's size): the test setup no longer loads every helper into every file, and logic tests run without a browser DOM.

### Fixed
- The buttons in a toast (Retry after a failed alert save, Show after a saved one) could not be clicked while the alerts panel was open on desktop: the panel is modal and blocked clicks outside it. They work now, and pressing one keeps the panel open.
- Screen readers and voice control: a heat-map cell's name now includes the figure it shows ("Canada, Dec 2024: +12% (+11.7%)"), and a market tile's name starts with its code and figure together ("US 100.5% attainment, United States, On track"). Found by the axe scans (WCAG 2.5.3, label in name).

## [0.9.0] - Unreleased

### Added
- Alerts: rules that flag markets whose figure crosses a threshold (growth, attainment, share or revenue; below or above; all markets, one region or chosen markets; warning or critical; on or off). Judged on each market's stored figures for the latest month (May 2026), whatever month the dashboard shows. A first visit starts with two example rules ("Attainment below 95%", critical: Germany, United Kingdom, Italy; "Share below 10%": United States, Germany, Australia), named in the page's language.
- The rule form checks what the server checks: the server's rule schema for the threshold range per metric, and the same shared limits for the rest (a market for "chosen markets", a name no other rule has, ten rules at most); messages in every language next to their field, the first wrong field focused on save; revenue typed in millions, a comma or a dot; "chosen markets" starts with the dashboard's selection; a live preview "Would flag 3 markets now (May 2026): …".
- Saving is optimistic: a new rule shows at once as "Saving…", a switch or an edit changes at once, a delete (after "Delete …?") goes at once; when the save fails, exactly that change is undone (another change made meanwhile stays) and a message says "Couldn't save — restored previous state" with the reason and Retry. A "Fail the next save (demo)" switch shows it.
- The panel has two tabs, Firing (what the rules flag now: each market, most severe first, its figure against each threshold, "Share 8.9% · below 10%", and Open) and Rules, with New rule always beside them; the form opens over the panel with Back, and a save lands on Rules. A save the server confirms says how many markets the rule flags, with "Show". While a rule is being saved its row is dimmed with a spinner and "Saving…" (the mock answers after ~1.2 s).
- Where it shows: a bell in the header with the number of flagged markets (desktop) and on the Alerts tab (phone); Top risks adds on-track markets the rules flag and names the rules on every flagged row; a bell button in the markets table; a line in the map's tooltip and an Alerts column in its table view. A ringing bell is critical, a plain one a warning, always with the rule names as text.
- `tab=alerts`: the Alerts tab on a phone (full screen, like the assistant) and a right sheet on desktop; Back closes it, closing it does not leave a step to come back to. A phone link to it shows the alerts area before the page loads.
- `/api/v1/alerts` mock (GET, POST, PATCH, DELETE, ~1.2 s): the list lives in one httpOnly cookie (compressed, so ten full rules fit), checked with the same schema; writes only from the app's own pages and as JSON.

### Fixed
- Alerts: two changes saved within a second of each other (switching two rules, or a new rule and a switch) could lose the first one after the list reloaded, with no error; saves now reach the server one at a time, and the screen still changes at once.
- Alerts: in German and Russian, the first save renamed the two example rules to English.
- Alerts: the "Saved … it flags N markets" message did not come when another rule was switched before the save was confirmed, or when the panel was closed meanwhile; then its "Show" opens the panel again.
- Alerts: closing the sheet opened from the bell left a second copy of the page in the history, so Back seemed to do nothing once; now it goes back. A link that opens on the sheet still closes it in place.
- Alerts: a save with "chosen markets" and none ticked now focuses the first market, which reads the error; after a delete, focus goes to New rule instead of the page.
- Alerts: a revenue threshold shows as typed, "$1.25M" (it was rounded to "$1.3M").
- Alerts: bigger touch targets (44 px): each market row in the form, a rule's on/off switch, and the bell and ⚠ in the markets table; the bell opens on a tap and lists its rules.
- Closing a side sheet (alerts, phone settings) flashed twice: the dimmed, blurred backdrop faded in 100 ms and the panel in 200 ms; both now take 200 ms and leave in the same frame (measured in the browser).
- The browser console no longer warns "Encountered a script tag while rendering React component": the scripts that mark the page before it is painted (collapsed assistant, phone tab, Analyst mode) go into the server HTML only.

## [0.8.0] - Unreleased

### Added
- Heat map in Analyst, full width under the markets table: the scope's markets × 24 months, coloured by the map's metric with the map's steps (one picker for both, also on the card); status and share have no months, so it shows growth YoY with a notice, which is where Germany's March 2026 dip shows (−31 %; as attainment it stays at 92 %, the forecast fell too). Whole numbers in the cells, one decimal and the anomaly note in the line under the grid, a ⚠ mark on anomaly cells, the selected window marked on the month headers and around its cells, selected markets marked in their row. One Tab stop and arrow keys; Enter or a click opens the market at that month (the window stays), Shift+click or Shift+Enter selects it; on a touch screen a tap shows the cell and the line under the grid has Open and Select (the line previews the hovered cell and otherwise keeps the one picked, so its buttons act on it). Scrolls sideways inside its card on a phone with the market column fixed, opened at the selected month. In a product view the anomaly note is called the whole market's (the data has no per-product notes). Table alternative with the anomaly marks and notes, remembered per browser.
- Comparison radar in Analyst, under Top risks next to the map: the selected markets (the first four, with "Showing the first 4 of N"); with nothing selected, the open market and its neighbours in the region, the open region's markets, or the four regions; against a grey dashed portfolio average. Axes: growth, attainment, share, revenue and momentum (growth over the last 3 months minus the 3 before, in points), each scaled from the weakest to the strongest of the 13 markets (or of the 4 regions); the tooltip and the table show the real values. Follows the month and the window; an axis without data (share off the latest month, momentum before November 2024) is left out with a note rather than drawn at the centre. Four new series colours checked for colour blindness, each with its own dash and marker. Table alternative, remembered per browser.
- Text colours for every map and heat-map step, checked for contrast.
- The page title names the view ("Executive view" / "Analyst view") with a line of what it shows, so switching modes is visible at the top, also on a phone.

### Changed
- Analyst skeletons hold the radar and the heat map too, so an Analyst link does not grow on load.

## [0.7.0] - Unreleased

### Added
- Markets table in Analyst, full width under the map: every KPI per market of the scope (revenue, forecast, gap to forecast, attainment, prior year, growth, share, units, status), all calculated from monthly data so a row adds up and the total is the sum of the rows (share and status as stored; the tiles keep the stored KPIs), the country code, a ⚠ with the data's note when an anomaly falls in the window, a total of the rows shown, headers that sort (in the URL as `sort`, no history entry), a sticky market column on small screens, a market name that opens the market.
- `Markets ▾` filter: "At risk or off track", all or none of a region (a dash when part of it), a checkbox per market and "Clear all" in the menu, "N of M selected" next to it, removable chips below; in Analyst, Shift+click or Shift+Enter on the map or the tiles, or "Add to filter" in the touch tooltip, adds a market. A hint under the map says how. A pick on the map keeps the map still.
- `Export ▾` of the table as shown: Excel (.xlsx with three sheets: the markets as an Excel table with filters, banding, frozen header and market column, $ and % formats, status and negative values coloured and a total that follows the filter; the months behind it; an About sheet with source, view, selection, order and a link back; ExcelJS loads only on export) and CSV for tools (raw USD and percent numbers, English headers, UTF-8 BOM, formula-injection guard). Files `markets-<period>-<range>[-<product>].xlsx/.csv`. "Preparing…" on the button while the workbook is made; any failure (ExcelJS not loaded, file not written, download refused) is logged and shown as a message, the dashboard stays as it is.
- Selection bar on the Market status card in both modes: "Selected", chips, Clear.
- Units in the revenue trend in Analyst (table column and chart tooltip).
- Analyst-shaped skeletons for an Analyst link: the static page knows `?mode=analyst` before the first paint, so the markets table and the map card's metric picker and hint have their place from the start and nothing jumps on load.

### Fixed
- A page opened with a drill or a selection (e.g. China) no longer shows the whole world for a moment and then jumps: the map appears already fitted.
- Menus, popovers and tooltips in the dashboard no longer slide over the header when the page scrolls under them: they stay within the scroll area and hide once their button has scrolled away.
- A market listed twice in a link is kept once; removing a chip keeps keyboard focus in the chips.

### Changed
- Checkbox items in menus show a dash, not a tick, when only part of a group is picked.
- `markets` is one selection list for the assistant, the map, the tiles and the filter; "highlighted from the assistant" now reads "selected", and the open market reads "open now".

## [0.6.0] - Unreleased

### Added
- CI on PRs into `release/*`: format check, lint (ESLint + Steiger) and typecheck, no tests (ADR 0007).
- Market map in the Market status card, behind a `Map / Tiles / Table` switch remembered per browser (map from the md width, tiles on a phone; an old "table" choice is kept). World without Antarctica, coloured by status (colour + dots / hatching) or, in Analyst, by attainment, growth, share or revenue on stepped scales with a legend that counts markets per step. Hover or keyboard focus shows name, value ("Calculated" when computed) and status; click or Enter opens the market; a touch tap shows the tooltip with an "Open" button. One finger and the plain wheel scroll the page; pinch or Ctrl/⌘ + wheel zoom, plus `+ / − / Whole world`. A drill or "Show on dashboard" flies the map to fit; a zoom set by hand survives month, window and metric changes. Status or share where they do not exist fall back to attainment with a notice. On a phone the map gets a taller frame (land fills it, only Pacific edges fall outside), smaller-looking zoom buttons with 44px targets, and "Open" in the tooltip brings the page to its top. The metric menu is not modal and keeps one width, so the card does not flash. The map loads on its own chunk.
- `kpi` URL param (map metric, Analyst only, picked in the card with the map or the table; changes replace history).
- The table view gets the map metric's column; tiles, table and map follow the chosen product (status stays market level).

### Removed
- The unused 7-step attainment scale tokens (`--scale-1…7`); the heat map will use the map's diverging scale.

### Changed
- Phone header: the app name is back on the first row next to ⚙︎; the path moves to its own row.
- Moving to another market keeps the chosen product (map, tiles, top risks, top movers, breadcrumbs); picking the current market again in the breadcrumbs goes back up from the product.

## [0.5.0] - Unreleased

### Added
- Dashboard header: drill-down path `Portfolio › Region › Market › Product` (each step opens the list of its siblings; picking the current one goes back up to it), period, mode, language and theme; on phones the path and a ⚙︎ button that opens language, theme and "Reset view" in a bottom sheet (whole rows are the targets), period and mode below. Skeleton of the same shape in the static HTML.
- Market status (variant A): markets as tiles grouped by region, status by shape, word and colour, off-track tiles hatched, attainment following the period; markets listed by the assistant ("Show on dashboard") are ringed and named as highlighted; a tile drills into its market; "Show as table" gives the same facts. Off the latest month the tiles show attainment only, with a notice.
- Top risks: non-on-track markets, off track first then by attainment, each with attainment, growth and the status word; a row drills in; an empty region says so.
- Top movers: highest and lowest growth YoY in the window for the markets of the scope (brief: "health at a glance"), with a bar per market (red only for a decline); a row drills in.
- Revenue trend: actual vs forecast vs prior year over 24 months for the current scope (Recharts, loaded on its own after the page), the selected month marked with a dashed labelled line (a labelled band for 3 / 12 months), anomalies in the data marked and named under the chart; a legend with each line's pattern, a sentence describing the selected month for screen readers, keyboard access through the Recharts accessibility layer and "Show as table" with every month.
- shadcn `card`; a `bg-hatch` utility for the off-track pattern.
- KPI cards for the current view: revenue, forecast attainment, growth YoY and markets at risk ("6 of 13", "2 off track · 4 at risk"), each with a supporting line and a 12-month line; computed figures carry a "Calculated" badge that names the formula. Off the latest month the risk card says status exists for the latest month only and offers to jump there; a product says status is per market.
- Scope title: "Veltrix · Germany" with the number of markets and products and the latest data month.
- Period picker: a month grid with a year switch (months without data cannot be picked, arrow keys move between months) and the window 1 / 3 / 12 months; both go into the URL with a history entry.
- Executive / Analyst switch; each switch is a history entry, so Back returns to the previous mode.
- The app name leads to the clean dashboard (portfolio, latest month, Executive) in one history step; on phones "Reset view" in the ⚙︎ sheet.
- "Show as table" on market status and the revenue trend is remembered per browser, and the button then reads "Show as tiles" / "Show as chart"; the card keeps its skeleton until the choice is read, so a reload never flashes the other view.
- Reset and the assistant's source / "Show on dashboard" scroll the dashboard back to its top, so the change is in view.
- Phone settings sheet: the whole Language and Theme rows open their menus and show the current choice.
- Chart motion: the trend lines draw in and move to new values, sparklines reveal left to right, mover bars grow; all off under reduced motion.
- Drill-down actions (portfolio, region, market, product) keep the period and range; a market brings its region.
- shadcn `breadcrumb`, `chart` (trimmed to the frame; Recharts 3), `sheet`, `table`, `toggle-group`.
- Dashboard URL state is checked against the data: a market brings its own region, a product needs a market, unknown ids, months, ranges and modes fall back to the default, and a bad link is corrected in place without a history entry.

- When the dataset cannot load, the dashboard shows one message with one "Try again" instead of one alert per widget; a widget that fails on its own names itself ("Couldn't load Key figures", "Try again: Key figures").
- A phone link to the Assistant tab (`?tab=assistant`) shows the assistant area from the first paint (inline script, ADR 0015) instead of flashing Overview.

### Fixed
- Review of 0.5.0: market tiles' names start with the visible code ("DE Germany, …", WCAG 2.5.3); the "Calculated" badge is a 44px target that opens the formula on tap; the header steps aside when the dataset fails, so the page shows its single message; repeated `markets` keys are read; a product step clears highlights; tiles say they are whole markets when a product is chosen; the trend table shows whole dollars; the month picker keeps focus at the first and last year; Russian verb agreement in the risk split; table caption names the window.
- Owner check of 0.5.0: a wide table no longer widens its card past the phone screen; screen-reader-only text no longer stretches the page below the tab bar; the "Calculated" badge has no grey box on hover and keeps its corner (a calculator icon in a narrow card); the selected month on the trend chart is a thin dashed line with its name (a light band for 3 / 12 months) instead of a thick grey bar; phone chart axes are shorter ("Jun 24", a tick a year); the mode and range switches have room around their labels; the phone period picker is as wide as its button; the phone Assistant tab hides the header; the bottom tab bar is a segmented track with the current section as a raised chip (owner, variant E); market status and revenue trend skeletons have the real card's title, corner button and layout; the chart tooltip shows each line's colour and pattern next to its name; a source card no longer flashes in the screen corner after "Show on dashboard" on touch screens.
- The 404 page has a skip link and a `main#main` landmark.
- Switching language keeps repeated query keys (`markets=de&markets=es`) and the `#hash`.

## [0.4.0] - 2026-11-04

### Added
- Assistant (ADR 0014, variant A): streamed answers with Stop, Retry, confidence and one source button per citation; hover, focus or tap shows an evidence card with the real numbers; clicking focuses the dashboard through the URL.
- "What the data shows" table under each answer: portfolio row, cited rows and two deterministic gap rules ("Not mentioned in the answer", region gaps, each market listed once), closed by default with the gap count in its header; "Show on dashboard" highlights the listed markets.
- Composer with Enter / Shift+Enter / Esc, a 500-character limit with counter and four suggested questions (translated label, English question). A non-English question gets a client-side reply "I only understand English…" instead of being sent.
- Answers without matching data read as "I can't answer this from the data"; the suggested questions appear after two such replies in a row.
- App shell: assistant as a right panel on desktop (collapsible, remembered and applied before the first paint, ADR 0015, badge for unseen answers), Overview / Assistant tabs on phones. Dashboard and assistant each sit in their own error boundary.
- Page title and description per locale; `noindex, nofollow` (internal console).
- `AGENTS.md` (entry point for coding agents, keeps the `next dev` block) and `DESIGN.md` (tokens, type, spacing, inventory, checklist).
- Answer actions: Copy (text with sources and confidence, "Treat as directional" for Low, "Copied" for 2 s), 👍 / 👎 with a reason, once per answer (logged through `logEvent`, never the question, thanks as a toast); "New chat" with a tooltip clears the conversation and focuses the composer (not on touch screens).
- The conversation survives a reload of the same tab (sessionStorage, last 50 messages), read after hydration behind a skeleton so server and client HTML match; restored answers are not counted as new. An answer cut by the reload comes back as "Stopped" without its partial text (written when a message starts or ends, not per token).
- Toasts (sonner, top centre, as wide as the text), tooltips and skeletons (shadcn).
- Disabled controls show the not-allowed cursor and no hover or press effect.
- The data block says that status exists for the latest month only.
- MSW test harness for the SSE chat stream and the data route.

### Changed
- A streaming answer starts in a neutral frame; the AI or "can't answer" style is applied at `done`, when its kind is known.
- Chat failures are logged once to the console (`[chat]`, named errors) and shown as a translated message; the server's own text stays in the log.
- Confidence shown as three equal bars; percents always with one decimal.
- Evidence card: latest status for a past month, the month's anomaly, a full-width trend with period labels; a failed dataset load shows the error instead of "Loading data…".
- Pointer cursor on clickable controls; floating cards keep 15px from the screen edge.
- `withErrorHandling` is exported only from `@/shared/api/server`.
- "Show on dashboard" resets the scope to the portfolio and the latest month before highlighting.

### Fixed
- Chat route validates the request before reading fixtures, so a bad request is always a 400.
- A failing write in the chat stream can no longer throw out of the stream's error fallback.
- Error logs use the error name (e.g. `TimeoutError`) as `code` for errors that are not `AppError`.
- Screen-reader-only text inside the chat log no longer stretches the page with an empty scroll area.
- A server that keeps the stream open after `done` no longer blocks the next question.
- Keyboard focus follows collapse / expand and stays in the composer after a suggestion or Stop.
- The evidence popover closes when it sends a phone to the dashboard; the unread badge clears on Back.
- The collapsed state stays in sync across tabs and with full storage.

## [0.3.0] - Unreleased

### Added
- Design direction (ADR 0014, owner decision): dashboard variant D (map console), assistant variant A; dashboard A is the fallback if time runs out.
- Design tokens in `src/app/styles/globals.css` for light and dark: shadcn base colours, trust surfaces (`surface-ai`, `surface-data`), status (`status-on-track`, `status-at-risk`, `status-off-track` + `-muted`), confidence, map (`map-sea`, `map-land`, `map-hatch`) and a 7-step attainment scale with a text colour per step.
- `tokens.test.ts`: WCAG contrast check of every text pair (4.5:1) and control/chart pair (3:1) in both themes.
- Fonts via `next/font`: Space Grotesk for text, JetBrains Mono for numbers (both SIL OFL 1.1); Cyrillic text uses the system font.

## [0.2.0] - Unreleased

### Added
- Next.js 16 app scaffold with TypeScript 6 (strict), Tailwind v4 + shadcn/ui (Radix), ESLint 10, Prettier, Steiger and Vitest.
- Typed env (`@t3-oss/env-nextjs`) and versioned API paths (`/api/v1/*`).
- Shared fetch client with timeouts (8 s JSON; 10 s first event, 15 s idle for streams), typed errors and an SSE reader.
- zod contracts for `data.json`, `fixtures.json` and the chat stream.
- `entities/performance`: KPI, status and trend selectors (stored vs calculated values, status only for the latest month).
- Mock API: `GET /api/v1/data`, `POST /api/v1/chat` (SSE; stops when the client aborts; JSON errors).
- i18n with next-intl: en-GB (default), en-US, de-DE, ru-RU; `as-needed` prefixes; static pages per locale; global number/date formats.
- App providers (TanStack Query, nuqs, offline guard; intl and theme providers in the root layout), dataset prefetched into static HTML, localised 404 and error pages.
- Theme switch (`@wrksz/themes`, replaces `next-themes` to avoid the React 19 script warning), locale switch that keeps URL state, offline guard.
- Error handling (ADR 0013): domain errors (`ValidationError`, `NotFoundError`, `DataIntegrityError`), `withErrorHandling` for route handlers, SSE `error` event on stream failures, validated lazy loading of source data, central `logError` (routes, error boundaries, query/mutation caches), `WidgetBoundary` and `useErrorMessage`.
- CI: PR guards for `develop` (release branches only; format, lint, typecheck, tests) and `master` (develop only; version check), `scripts/check-version.ts`.

## [0.1.0] - Unreleased

### Added
- Starter pack: dataset, assistant fixtures, streaming contract, reference SSE route.
- `CLAUDE.md` and scoped agent rules in `.claude/rules/`.
- Architecture decision records in `docs/decisions/`.
- Feature-Sliced Design folder skeleton.
- Decisions on theming/dark mode (ADR 0009), i18n with static locale routing (ADR 0010), linting and formatting (ADR 0011).
- ADR 0012: API versioning, timeouts, offline guard, error pages.
- Product design spec: `docs/specs/2026-11-03-market-ops-console-design.md`.
