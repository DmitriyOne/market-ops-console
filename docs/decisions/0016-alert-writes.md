# 0016. Alert rule writes: Route Handler + TanStack mutations, not Server Actions + `useOptimistic`

**Context.** The brief asks for a schema-validated form saved "with an optimistic update and roll back on failure". One saved rule changes four places at once: the header count, Top risks, the markets table and the map. The owner asked (2026-11-05) whether Server Actions with `useOptimistic` would be safer or more idiomatic for Next.js. Checked against the Next.js 16.2 docs (context7).

**Decision.** Keep `/api/v1/alerts` (GET, POST, PATCH, DELETE) and TanStack Query: the list is a query, writes are `useMutation` with an optimistic cache write in `onMutate`, a rollback of that one write in `onError` and a refetch when the last write settles (`features/configure-alerts`). Writes reach the server one at a time (a mutation `scope`): the cookie stores the whole list with each answer, so two writes in flight would both start from the old list and one would be lost; the change on screen still shows at once (found in the agent review, 2026-11-05). Owner, 2026-11-05. The examples carry a preset and are named on the client in the page's language, so the list is the same in every language and requests carry no locale (2026-11-06; before, the cached list kept the first visit's language and a save after a switch stored the examples in another one, found by the production check). A write the API refuses (`duplicate_name`, `too_many`, `invalid_request`, `not_found`) gets no Retry: Edit opens the form with the error, a delete only Dismiss.

**Why.**
- **Security is the same.** The Next docs say Server Actions are reachable by direct POST and must be treated "with the same security considerations as public-facing API endpoints". Their built-in protection is an `Origin` / `Host` check and encrypted action ids. The route has the equivalent: same-origin writes (`Sec-Fetch-Site`, `Origin`), JSON only, an httpOnly `SameSite=Lax` cookie, the same zod schema as the form, a size cap on the cookie.
- **`useOptimistic` is local.** It keeps the optimistic state inside one component and drops it when the action ends; the four places that show a rule's effect would need the list lifted into a context by hand, which is what the query cache already is.
- **Reads are not Server Actions.** The docs present Server Functions for mutations; the list would still need a GET (or props from a server render, which the static pages do not have), so there would be two mechanisms instead of one.
- **One shape for every endpoint**: `/api/v1/data`, `/api/v1/chat` and `/api/v1/alerts` are versioned routes with typed errors (ADR 0012, 0013), testable with MSW like the rest.

**Considered.**
- Server Action + `useOptimistic` + a rules context: about a day of rework (state, tests), no gain in safety.
- Server Action as the `mutationFn` inside the same `useMutation`: keeps the cache and rollback, adds Next's CSRF check for writes; tests would mock the action instead of MSW. Worth it with real users and auth; not for a mock store.

**Consequences.** The README explains the choice under "forms & validation". With a real backend the route would also check the session (the docs' advice applies to both).
