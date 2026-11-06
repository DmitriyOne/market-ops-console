# Empty on purpose

Next.js treats a `pages/` folder as the Pages Router. This empty root folder stops it from picking up `src/pages`, which is the Feature-Sliced Design *pages* layer. Routing lives in the root `app/` folder. See `docs/decisions/0005-feature-sliced-design.md`.
