# Browser regression checks

## Public landing page

```sh
PYTHONDONTWRITEBYTECODE=1 python tests/browser/verify_landing.py
```

With the local frontend running, this checks the landing page at six desktop,
tablet, phone, and landscape sizes in both themes. It verifies text contrast,
minimum text/control sizes, overflow, mobile ordering, keyboard focus and links,
theme persistence, and the unchanged headers on login/tracking. API requests use
isolated signed-out responses. Screenshots and results default to
`/tmp/cellbank-landing-tests`; override with `CELLBANK_TEST_OUTPUT`.
Real-device and screen-reader checks remain manual.

## Feedback and application

Run the app locally with `npm run dev -- --host 0.0.0.0`, then:

```sh
node --test tests/*.test.js
python tests/browser/verify_feedback.py
python tests/browser/verify_application.py
npm run build
```

Browser scripts require Python Playwright and an installed Chromium. They do not add runtime dependencies. Set `CHROMIUM_PATH` if Chromium is not `/usr/bin/chromium`, `CELLBANK_TEST_URL` if the app is not at `http://localhost:5173`, and `CELLBANK_TEST_OUTPUT` to choose the screenshot/result directory (default `/tmp/cellbank-feedback-tests`).

`feedback.html` is an isolated development fixture using the real shared components and hook under Strict Mode. It covers expiration, remaining-time hover/focus pause, persistent error queues, identical events, navigation/remount behavior, keyboard dismissal, long text, and light/dark layouts at 320/768/1440px.

`verify_application.py` opens real routes and intercepts all `/api/` requests with local test responses. It covers login, account/password navigation, customer dialogs and validation, uncertain payments, blocking load errors/Retry, role visibility, and real clipboard success plus simulated rejection/unavailability. It takes repair-workspace screenshots at 375/1440px in both themes. No production credentials or records are used. Set `CELLBANK_TEST_FILTER` to part of an application check name to run only that check.

Fixtures are not imported by the production entry point or included in the production bundle. Actual assistive-technology announcements, Safari/Firefox behavior, and live backend integrations still require manual verification.

## Shared viewport layout

```sh
PYTHONDONTWRITEBYTECODE=1 python tests/browser/verify_viewport_layout.py
```

This suite reuses isolated application fixtures and requires `pdftotext` for the generated PDF check. It writes screenshots, a report PDF, and `layout-results.json` to `CELLBANK_TEST_OUTPUT` (default `/tmp/cellbank-layout-tests`). `LAYOUT_TEST_FILTER` selects checks by part of their name.

It exercises long Reports and repair forms, stationary header/sidebar/footer, internal navigation scrolling, expanded/collapsed states, desktop and short windows, mobile portrait/landscape, input/validation focus, route and back navigation, dropdowns, dialogs, toasts, public scrolling, and print output. It checks both themes and uses reduced viewport sizes to approximate zoom and keyboard-constrained space. Native browser zoom, real mobile keyboards, and Safari/Firefox still need manual checks. All API responses are intercepted; no production records or credentials are used.

## Staff role preservation

Run `PYTHONDONTWRITEBYTECODE=1 python tests/browser/verify_staff_roles.py` with Vite running. The isolated staff form fixture checks creation, Technician/Front Desk combinations, and preserving Admin while editing details. It does not contact a backend. The application clipboard check also covers short codes and long wrapping codes in both themes.
