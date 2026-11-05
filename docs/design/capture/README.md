# Design capture

Captures built screens from the running app into `screens/`, `html/` and `source/`, then updates `screen-index.md`, `README.md`, `source/Index.dc.html` and `source/canvas.json`.

1. Start the app's dev server: `npx expo start` in `app/`. The API isn't needed: `fixtures.mjs` answers with the design's sample data.
2. In this folder: `npm ci`, then `npm run capture`, or `npm run capture -- E11 R21` for some screens.

Every built screen and state is listed in `screens.mjs`. Add a new one there, in the place it should have in the screen index.

It runs the app's web version in Edge. Set `APP_URL` or `BROWSER` to use something else.

Drawings of screens not built yet are rendered with `node render-drawing.mjs <file names>`, which prints each height.
