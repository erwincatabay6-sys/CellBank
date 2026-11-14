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

## Revised repair access and dashboard

Run `node --test tests/repair-access.test.js` and, with Vite running,
`PYTHONDONTWRITEBYTECODE=1 python tests/browser/verify_repair_access.py`.
The browser suite intercepts API requests with contracts reviewed at backend
`bb1a17a5c5726046ba5e784af510b391bf7cb341`. It checks assignment/role combinations,
independent findings failures, reassignment, permission navigation, technician
links, personal/admin dashboard panels, calendar dates, failed/loaded photos,
and desktop/mobile themes. Screenshots default to `/tmp/cellbank-access-tests`.
These are mocked checks, not Spring Boot integration tests. Verify actual session
changes, backend reassignment races, customer/device filtering, employee image
cookies, and status/payment operations against the revised local backend before merging.

## Repair-list space and combined roles

`PYTHONDONTWRITEBYTECODE=1 python tests/browser/verify_dashboard_space.py`
checks the repair list's viewport bounds and internal scrolling, resize/mobile
layouts, keyboard reachability, and combined-role identity/counts in both themes.
It uses mocked API responses and saves screenshots under `/tmp/cellbank-dashboard-space`.
Recent Active Repairs retains the dashboard API's existing five-record limit.

### Tracking-code/email revision

Run `PYTHONDONTWRITEBYTECODE=1 python tests/browser/verify_tracking_email.py` against the local Vite server. It intercepts API calls and sends no real emails. Covers public short/legacy lookups, query-link automatic lookup, invalid/404/429 and stale requests; resend role permissions, no-body CSRF requests, missing email, success/error cooldowns; two-row staff lists at desktop/mobile widths in both themes; all four report payment icons.

Notification audit: general action feedback already uses FeedbackProvider/useFeedbackState throughout auth, account, administration, customers and repairs. Tracking lookup validation now publishes through that same provider, retaining plain input-linked descriptions without a second alert card; clipboard failures also use toasts. Compact field validation remains associated with inputs. Load failures, invalid verification/recovery links, access/unavailable states, inline Retry/conflict recovery, and uncertain-save safeguards remain persistent. Repair creation confirms only the saved repair, not email delivery.

These are mocked browser checks, not SMTP delivery or live backend integration tests. Backend reference: backend-cb feature/tracking-code-email at 9aea49f (preserved Retry-After headers).

### Internal notes and customer updates

`PYTHONDONTWRITEBYTECODE=1 python tests/browser/verify_customer_updates.py` verifies the status PATCH retains `expectedUpdatedAt` and sends separate `note`/`customerUpdate` fields, accepts exactly 2,000 characters, rejects longer drafts, normalizes empty updates to null, and preserves drafts on a mocked validation failure. It checks labeled staff history, public omission of internal notes (even if a mock supplies one), older/missing/blank updates, plain-text rendering, line breaks, mobile widths and both themes. No frontend email request is made on status changes. All API responses are mocked; actual backend/SMTP integration is not tested.

Backend contract reference: `backend-cb` branch `feature/tracking-code-email`, commit `f11d105`. **Deployment prerequisite, not confirmed:** apply `database/005_add_status_customer_update.sql` to add nullable `repair_status_history.customer_update varchar(2000)` before deploying that backend. This frontend PR does not apply migrations or deploy either repository.

### Compact status history details

`PYTHONDONTWRITEBYTECODE=1 python tests/browser/verify_status_details.py` checks compact metadata, conditional ellipsis buttons for both/either/neither message, plain-text modal content, Escape/X dismissal, Tab/Shift+Tab containment, focus restoration, long names/messages and scrollable mobile/landscape layouts in both themes. APIs are mocked; no records or emails are changed. `verify_customer_updates.py` also checks the existing status submission and public/private separation with staff messages now shown in this modal. Native Safari/Firefox and screen-reader checks remain manual.
