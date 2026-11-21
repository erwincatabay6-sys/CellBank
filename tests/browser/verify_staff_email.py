"""Browser regression checks with mocked APIs. No mail is sent."""
import asyncio
import json
import os
import secrets
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import urlparse

from playwright.async_api import async_playwright, expect
from verify_application import USER

BASE = os.environ.get("CELLBANK_TEST_URL", "http://localhost:5173")
OUTPUT = Path(os.environ.get("CELLBANK_TEST_OUTPUT", "/tmp/cellbank-staff-email"))
OUTPUT.mkdir(parents=True, exist_ok=True)
TEST_CODE = "0" + str(secrets.randbelow(100000)).zfill(5)
WRONG_CODE = "1" + TEST_CODE[1:]


async def main():
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(
            executable_path=os.environ.get("CHROMIUM_PATH", "/usr/bin/chromium"),
            args=["--no-sandbox"],
        )
        for theme, width in [("light", 1440), ("dark", 360)]:
            context = await browser.new_context(
                viewport={"width": width, "height": 940 if width > 400 else 780},
                color_scheme=theme,
                permissions=["clipboard-read", "clipboard-write"],
            )
            account = {**USER, "status": "ACTIVE", "emailVerified": None}
            calls = []
            pending = False
            delay = 0
            expiration = 600
            failures = 0
            verification_sent = False
            admin_target = {**USER, "id": 2, "name": "Test Technician", "username": "mock-tech",
                            "email": "current@example.test", "roles": ["TECHNICIAN"], "status": "ACTIVE"}
            api_errors = []

            async def route(request):
                nonlocal pending, failures, expiration, delay, verification_sent
                path = urlparse(request.request.url).path
                if not path.startswith("/api/"):
                    await request.continue_()
                    return
                method = request.request.method
                calls.append((method, path))
                http, data = 200, []
                # Use skewed server time so countdown checks don't depend on the browser's clock.
                now = datetime.now(timezone.utc) - timedelta(days=5)
                if path == "/api/auth/csrf":
                    data = {"headerName": "X-CSRF-TEST", "token": "mock-only"}
                elif path == "/api/auth/me":
                    await asyncio.sleep(.15)
                    http, data = (401, {}) if account["emailVerified"] is None else (200, account)
                elif path == "/api/auth/login":
                    account["emailVerified"] = False
                    http = 204
                elif path == "/api/auth/logout":
                    account["emailVerified"] = None
                    http = 204
                elif path == "/api/auth/me/email-verification":
                    if method == "POST":
                        if request.request.post_data is not None:
                            api_errors.append("Verification POST had a request body")
                        verification_sent = True
                        http = 204
                    else:
                        data = {"emailVerified": account["emailVerified"], "serverTime": now.isoformat(),
                                "resendAvailableAt": (now + timedelta(seconds=60)).isoformat() if verification_sent else None}
                elif path == "/api/auth/me/pending-email-change":
                    data = {
                        "pending": pending,
                        "maskedProposedEmail": "n***@example.test" if pending else None,
                        "serverTime": now.isoformat(),
                        "resendAvailableAt": (now + timedelta(seconds=delay)).isoformat(),
                        "expiresAt": (now + timedelta(seconds=expiration)).isoformat(),
                    }
                elif path.endswith("/pending-email-change/confirm"):
                    if request.request.headers.get("x-csrf-test") != "mock-only":
                        api_errors.append("Missing confirm CSRF")
                    if request.request.post_data_json["code"] == TEST_CODE:
                        pending = False
                        account["email"] = "new@example.test"
                        http = 204
                    else:
                        failures += 1
                        if failures == 5:
                            pending = False
                        http, data = 400, {"detail": "Incorrect confirmation code."}
                elif path.endswith("/pending-email-change/resend"):
                    if request.request.headers.get("x-csrf-test") != "mock-only" or request.request.post_data is not None:
                        api_errors.append("Invalid resend request")
                    delay = 60
                    expiration = 600
                    http = 204
                elif path == "/api/notifications":
                    data = {"items": [], "unreadCount": 0}
                elif path == "/api/repairs":
                    if not account["emailVerified"]:
                        http, data = 403, {"code": "EMAIL_VERIFICATION_REQUIRED"}
                elif path == "/api/repairs/999":
                    http, data = 403, {}
                elif path == "/api/users":
                    data = [admin_target]
                elif path == "/api/users/2" and method == "PUT":
                    data = admin_target
                elif path == "/api/users/2/pending-email-change" and method == "DELETE":
                    if request.request.headers.get("x-csrf-test") != "mock-only":
                        api_errors.append("Missing admin cancellation CSRF")
                    http = 204
                await request.fulfill(status=http, content_type="application/json",
                                      body="" if http == 204 else json.dumps(data))

            await context.route("**/api/**", route)
            page = await context.new_page()
            errors = []
            page.on("pageerror", lambda error: errors.append(str(error)))
            await page.goto(BASE + "/login")
            await page.get_by_label("Username or Email").fill("mock-staff")
            await page.locator("#login-password").fill("local-browser-test")
            await page.get_by_role("button", name="Login", exact=True).click()
            gate = page.get_by_role("heading", name="Verify your staff email")
            await expect(gate).to_be_visible()
            await page.goto(BASE + "/repairs")
            await expect(gate).to_be_visible()
            await page.reload()
            await expect(gate).to_be_visible()
            assert all(path not in ("/api/dashboard", "/api/repairs", "/api/notifications") for _, path in calls)
            for path, heading in [("/track", "Track Your Repair"), ("/verify-email", "Confirm Your Email")]:
                await page.goto(BASE + path)
                await expect(page.get_by_role("heading", name=heading, exact=True)).to_be_visible()
                await expect(gate).to_have_count(0)
            await page.goto(BASE + "/repairs")
            send = page.get_by_role("button", name="Send verification link")
            await expect(send).to_be_enabled()
            await page.screenshot(path=OUTPUT / f"verification-{theme}.png")
            await send.click()
            await expect(page.get_by_role("status")).to_contain_text("Verification link sent")
            await expect(page.get_by_role("button", name="Resend in")).to_be_disabled()

            account["emailVerified"] = True
            await page.evaluate("dispatchEvent(new Event('focus'))")
            await expect(gate).to_have_count(0)
            await page.goto(BASE + "/repairs/999")
            await expect(page.get_by_text("Access restricted", exact=True)).to_be_visible()
            await expect(gate).to_have_count(0)
            # The client initially sees a verified profile while a protected API gates a stale session.
            await page.goto(BASE + "/repairs/999")
            match = "**/api/repairs/999"
            await page.route(match, lambda r: r.fulfill(status=403, json={"code": "EMAIL_VERIFICATION_REQUIRED"}))
            await page.reload()
            await expect(gate).to_be_visible()
            await page.unroute(match)
            await page.get_by_role("button", name="Sign out", exact=True).click()
            await expect(page.get_by_role("heading", name="Staff Login")).to_be_visible()

            account["emailVerified"] = True
            account["email"] = "current@example.test"
            pending = True
            await page.goto(BASE + "/account")
            opener = page.get_by_role("button", name="Confirm new email")
            await opener.click()
            dialog = page.get_by_role("dialog", name="Confirm your new email")
            code = dialog.get_by_role("textbox", name="Six-digit confirmation code")
            await expect(code).to_be_focused()
            await code.press("Shift+Tab")
            close = dialog.get_by_role("button", name="Close email confirmation")
            await expect(close).to_be_focused()
            await close.press("Shift+Tab")
            await expect(dialog.get_by_role("button", name="Resend code", exact=True)).to_be_focused()
            await page.keyboard.press("Tab")
            await expect(close).to_be_focused()
            await page.keyboard.press("Tab")
            await expect(code).to_be_focused()
            await expect(dialog.get_by_text("n***@example.test", exact=True)).to_be_visible()
            await page.screenshot(path=OUTPUT / f"otp-{theme}.png")
            assert await dialog.evaluate("(el)=>el.scrollWidth <= el.clientWidth")
            await page.keyboard.press("Escape")
            await expect(dialog).to_have_count(0)
            await expect(opener).to_be_focused()
            assert pending and account["email"] == "current@example.test"
            await opener.click()
            # Expiry and successful resend use timestamps from the server.
            expiration = -1
            await page.evaluate("dispatchEvent(new Event('focus'))")
            await expect(dialog.get_by_text("This code has expired", exact=False)).to_be_visible()
            await dialog.get_by_role("button", name="Resend code", exact=True).click()
            await expect(dialog.get_by_role("button", name="Resend in")).to_be_disabled()
            for _ in range(5):
                await code.fill(WRONG_CODE)
                await dialog.get_by_role("button", name="Confirm email", exact=True).click()
                await expect(dialog.get_by_role("alert")).to_contain_text("Incorrect confirmation code")
            await expect(dialog.get_by_text("No replacement email is pending", exact=False)).to_be_visible()
            assert account["email"] == "current@example.test"
            await dialog.get_by_role("button", name="Close email confirmation").click()

            pending = True
            await page.evaluate("dispatchEvent(new Event('focus'))")
            await opener.click()
            # Paste all digits with the leading zero and correct a single digit through selection.
            await page.evaluate("(value) => navigator.clipboard.writeText(value)", WRONG_CODE)
            await code.press("Control+v")
            await expect(code).to_have_value(WRONG_CODE)
            await code.press("Home")
            await code.press("Shift+ArrowRight")
            await code.press("0")
            await expect(code).to_have_value(TEST_CODE)
            await dialog.get_by_role("button", name="Confirm email", exact=True).click()
            await expect(dialog.get_by_role("status")).to_contain_text("Your new email is confirmed")
            await dialog.get_by_role("button", name="Close email confirmation").click()
            await expect(page.get_by_text("new@example.test", exact=True).first).to_be_visible()
            await expect(opener).to_have_count(0)
            assert not errors and not api_errors, errors + api_errors

            await page.goto(BASE + "/administration")
            await page.get_by_role("button", name="Edit staff member Test Technician").click()
            await page.get_by_label("Email Address", exact=True).fill("proposed@example.test")
            await page.get_by_role("button", name="Save Changes").click()
            await expect(page.get_by_text("Replacement email proposed", exact=True)).to_be_visible()
            await page.locator(".feedback-toast").get_by_role("button", name="Dismiss").click()
            await page.get_by_role("button", name="Edit staff member Test Technician").click()
            await page.get_by_role("button", name="Cancel any pending email change").click()
            await page.get_by_role("button", name="Cancel pending email change", exact=True).click()
            await expect(page.get_by_text("This account has no pending replacement email.", exact=True)).to_be_visible()
            assert not errors and not api_errors, errors + api_errors
            await context.close()
        await browser.close()
    print("PASS mocked verification gate, code handling, OTP refresh/expiry/resend, admin cancellation and light/dark layouts")


asyncio.run(main())
