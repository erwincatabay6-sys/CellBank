# Feedback regression checks

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
