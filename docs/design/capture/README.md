# Design capture

Captures built screens from the running app into `screens/`, `html/` and `source/`, then updates `screen-index.md`, `README.md`, `source/Index.dc.html` and `source/canvas.json`.

1. Start the app's dev server: `npx expo start` in `app/`. The API isn't needed: `fixtures.mjs` answers with the design's sample data.
2. In this folder: `npm ci`, then `npm run capture`, or `npm run capture -- E11 R21` for some screens.

Every state of every built screen is listed in `screens.mjs`. Add a new one there, in the place it should have in the screen index. Each screen's files sit in a folder for its area, such as `screens/workout/`. `node check.mjs` checks that each one is in the screen index, that every screen's files are in its area's folder, and that the design document names every screen. CI runs it when `docs/design` changes.

It runs the app's web version in Edge. Set `APP_URL` or `BROWSER` to use something else.

Drawings of screens not built yet are rendered with `node render-drawing.mjs <file names>`, which prints each height.
