# Integrated Reception Browser Console Classification

Captured by the final `scripts/cf-f0-11-reception-integrated.playwright.js` on separate fresh synthetic Worker/D1 fixtures at mobile 375×812 and desktop 1280×900. Raw runner output is retained in:

- `output/playwright/f0-11-reception-integrated-mobile.log`
- `output/playwright/f0-11-reception-integrated-desktop.log`

Both browser results returned:

- `pageErrors: []`
- no console messages of type `error`
- console messages were only Vite `debug` connection notices and React DevTools download `info` notice.

The earlier CLI footer phrase “Console: 1 errors” was not an application error count. Read-only inspection of the CLI console artifacts showed a single React DevTools `INFO` record and no error record. The final script now classifies message types directly and fails on console `error` or `pageerror`.

No console error was suppressed or filtered from the asserted error set.
