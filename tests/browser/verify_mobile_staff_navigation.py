"""Exercise the staff drawer and responsive workspace with browser-only data."""
import asyncio
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from urllib.parse import urlparse

from playwright.async_api import async_playwright, expect

from verify_application import USER, CUSTOMER, REPAIR
from verify_reports_refinement import report

BASE = os.environ.get("CELLBANK_TEST_URL", "http://localhost:5173")
OUT = Path(os.environ.get("CELLBANK_TEST_OUTPUT", "/tmp/cellbank-mobile-staff"))
ACCOUNT = {**USER, "name": "Local Test Administrator", "status": "ACTIVE"}
LONG_EMAIL = "cellbank.mobile." + "long-address" * 4 + "@internal-fixture.example.test"
TECHNICIAN = {"id": 1, "name": "Local Technician", "status": "ACTIVE", "activeRepairs": 1, "totalRepairs": 1}
NOTIFICATIONS = {"unreadCount": 1, "notifications": [
    {"id": 1, "message": "Your repair queue has an update", "read": False, "createdAt": "2026-11-22T01:00:00Z"},
]}


def fixture(account, pending=False, calls=None):
    signed_in = True

    async def intercept(route):
        nonlocal signed_in
        path = urlparse(route.request.url).path
        if not path.startswith("/api/"):
            await route.continue_()
            return

        method = route.request.method
        if calls is not None:
            calls.append((method, path))
        if path == "/api/auth/logout":
            assert route.request.headers.get("x-fixture-csrf") == "browser-only"
            signed_in = False
            await route.fulfill(status=204)
            return
        if path == "/api/auth/me" and not signed_in:
            await route.fulfill(status=401, json={})
            return

        now = datetime.now(timezone.utc)
        payloads = {
            "/api/auth/me": account,
            "/api/auth/csrf": {"headerName": "X-Fixture-CSRF", "token": "browser-only"},
            "/api/auth/me/email-verification": {"emailVerified": account["emailVerified"]},
            "/api/auth/me/pending-email-change": {
                "pending": pending, "maskedProposedEmail": "l***@example.test",
                "serverTime": now.isoformat(), "expiresAt": (now + timedelta(minutes=5)).isoformat(),
                "resendAvailableAt": now.isoformat(),
            },
            "/api/notifications": NOTIFICATIONS,
            "/api/dashboard": {
                "summary": {"totalRepairs": 1, "activeRepairs": 1, "readyForRelease": 0, "completedRepairs": 0},
                "financialSnapshot": {"totalAgreedValue": 1000, "totalCollected": 0, "outstandingBalance": 1000},
                "technicianOnly": False, "statusCounts": {}, "attentionRepairs": [], "recentActiveRepairs": [],
                "technicianWorkload": [], "frontDeskActivity": [],
            },
            "/api/repairs": [REPAIR],
            "/api/repairs/1": REPAIR,
            "/api/repairs/1/ai/context": {"device": CUSTOMER["devices"][0]},
            "/api/repairs/technicians": [TECHNICIAN],
            "/api/customers": [CUSTOMER],
            "/api/customers/1": CUSTOMER,
            "/api/technicians": [TECHNICIAN],
            "/api/technicians/1": {"technician": TECHNICIAN, "statusCounts": {}, "activeRepairs": [], "repairHistory": []},
            "/api/users": [account, {**TECHNICIAN, "id": 2, "roles": ["TECHNICIAN"], "username": "test-tech"}],
            "/api/reports": report(),
        }
        await route.fulfill(content_type="application/json", json=payloads.get(path, []))

    return intercept


async def assert_in_view(locator, width, height):
    await expect(locator).to_be_visible()
    box = await locator.bounding_box()
    assert 0 <= box["x"] <= box["x"] + box["width"] <= width + 1, box
    assert 0 <= box["y"] <= box["y"] + box["height"] <= height + 1, box


async def assert_no_page_overflow(page):
    assert await page.evaluate("""() => {
      const main = document.querySelector('.main-content');
      return document.documentElement.scrollWidth <= innerWidth + 1 &&
        (!main || main.scrollWidth <= main.clientWidth + 1);
    }"""), await page.evaluate("""() => Array.from(document.querySelectorAll('.main-content *'))
      .filter(el => el.getBoundingClientRect().right > innerWidth + 1)
      .slice(0, 10).map(el => [el.tagName, el.className])""")


async def main():
    OUT.mkdir(parents=True, exist_ok=True)
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(
            executable_path=os.environ.get("CHROMIUM_PATH", "/usr/bin/chromium"), args=["--no-sandbox"],
        )

        async def setup(width, height, theme, account=ACCOUNT, pending=False, calls=None, mobile=True):
            page = await browser.new_page(
                viewport={"width": width, "height": height}, is_mobile=mobile, has_touch=mobile,
                color_scheme=theme, reduced_motion="reduce",
            )
            await page.route("**/api/**", fixture(account, pending, calls))
            page.set_default_timeout(7500)
            return page

        for width, height, theme in [(360, 800, "light"), (390, 844, "dark")]:
            page = await setup(width, height, theme)
            await page.goto(BASE + "/account")
            menu = page.get_by_role("button", name="Open navigation menu")
            heading = page.get_by_role("heading", name="Account Settings")
            await assert_in_view(heading, width, height)
            choose_image = page.get_by_role("button", name="Choose Image")
            await assert_in_view(choose_image, width, height)
            assert (await heading.bounding_box())["y"] < 90
            await expect(menu).to_have_attribute("aria-expanded", "false")
            await expect(page.locator(".staff-body > .sidebar")).to_be_hidden()
            await assert_no_page_overflow(page)
            if width == 390:
                await expect(page.get_by_role("button", name="Notifications, 1 unread")).to_be_visible()
                await page.screenshot(path=OUT / "account-after.png")
            async with page.expect_file_chooser() as chooser:
                await choose_image.press("Enter")
            assert await (await chooser.value).element.get_attribute("accept") == "image/jpeg,image/png"

            await menu.focus()
            await menu.press("Enter")
            drawer = page.get_by_role("dialog", name="Staff navigation")
            close = drawer.get_by_role("button", name="Close navigation menu")
            await expect(close).to_be_focused()
            await expect(drawer).to_have_css("animation-name", "none")
            await expect(page.locator(".staff-menu-button")).to_have_attribute("aria-expanded", "true")
            await expect(drawer.get_by_role("button", name="Account Settings")).to_have_attribute("aria-current", "page")
            await expect(page.locator(".main-content")).to_have_css("overflow", "hidden")
            if width == 390:
                await close.blur()
                await page.screenshot(path=OUT / "account-drawer.png")
                await close.focus()
            await page.keyboard.press("Shift+Tab")
            await expect(drawer.get_by_role("button", name="Logout")).to_be_focused()
            await page.keyboard.press("Tab")
            await expect(close).to_be_focused()
            await page.keyboard.press("Escape")
            await expect(drawer).to_have_count(0)
            await expect(menu).to_be_focused()
            await expect(page.locator(".main-content")).to_have_css("overflow", "auto")
            await menu.tap()
            await page.touchscreen.tap(width - 8, height // 2)
            await expect(drawer).to_have_count(0)
            await expect(menu).to_be_focused()

            await menu.tap()
            await drawer.get_by_role("button", name="Repairs", exact=True).tap()
            await expect(drawer).to_have_count(0)
            await assert_in_view(page.get_by_role("heading", name="Repairs", exact=True), width, height)
            await menu.tap()
            await expect(drawer.get_by_role("button", name="Repairs", exact=True)).to_have_attribute("aria-current", "page")
            theme_switch = drawer.get_by_role("switch", name="Dark mode")
            await expect(theme_switch).to_have_attribute("aria-checked", str(theme == "dark").lower())
            await theme_switch.tap()
            await expect(page.locator("html")).to_have_attribute("data-theme", "dark" if theme == "light" else "light")
            await close.tap()
            bell = page.get_by_role("button", name="Notifications, 1 unread")
            await bell.tap()
            await assert_in_view(page.get_by_role("region", name="Notifications", exact=True), width, height)
            await page.keyboard.press("Escape")
            await expect(bell).to_be_focused()
            await menu.tap()
            await page.go_back()
            await expect(drawer).to_have_count(0)
            await page.reload()
            await expect(menu).to_have_attribute("aria-expanded", "false")
            await assert_in_view(page.get_by_role("button", name="Choose Image"), width, height)
            await page.close()
            print(f"PASS Account and drawer flows at {width}×{height} ({theme})", flush=True)

        for roles in [["ADMIN"], ["TECHNICIAN"], ["FRONT_DESK"], ["FRONT_DESK", "TECHNICIAN"]]:
            page = await setup(360, 420, "dark", {**ACCOUNT, "roles": roles})
            await page.goto(BASE + "/account")
            await page.get_by_role("button", name="Open navigation menu").tap()
            drawer = page.get_by_role("dialog", name="Staff navigation")
            destinations = ["Dashboard", "Repairs", "Customers", "Technicians"]
            if roles == ["ADMIN"]:
                destinations += ["Reports", "Administration"]
            await expect(drawer.get_by_role("navigation").get_by_role("button")).to_have_text(destinations)
            logout = drawer.get_by_role("button", name="Logout")
            await logout.scroll_into_view_if_needed()
            await assert_in_view(logout, 360, 420)
            theme_icon = await drawer.get_by_role("switch", name="Dark mode").locator("svg").bounding_box()
            logout_icon = await logout.locator(".pending-action > span").first.locator("svg").bounding_box()
            assert abs(theme_icon["x"] - logout_icon["x"]) <= 1
            assert theme_icon["width"] == logout_icon["width"]
            await expect(drawer.get_by_role("button", name="Close navigation menu")).to_be_in_viewport()
            if roles == ["ADMIN"]:
                await logout.tap()
                await expect(page).to_have_url(BASE + "/login")
                await expect(drawer).to_have_count(0)
            await page.close()
        print("PASS all four roles, short-drawer scrolling, and logout", flush=True)

        page = await setup(844, 390, "dark", pending=True)
        await page.goto(BASE + "/account")
        menu = page.get_by_role("button", name="Open navigation menu")
        await menu.tap()
        await expect(page.get_by_role("dialog", name="Staff navigation")).to_be_visible()
        await page.set_viewport_size({"width": 1440, "height": 900})
        await expect(page.locator(".staff-drawer")).to_have_count(0)
        await expect(page.locator(".sidebar")).to_be_visible()
        await expect(page.get_by_role("button", name="Collapse sidebar")).to_be_visible()
        await expect(page.locator(".header-actions").get_by_role("button", name="Logout")).to_be_visible()
        await expect(page.locator(".main-content")).to_have_css("overflow", "auto")
        await page.close()

        for width, height, theme in [(360, 800, "dark"), (390, 844, "light")]:
            page = await setup(width, height, theme, {**ACCOUNT, "email": LONG_EMAIL, "name": "Local " + "Very Long Name " * 5}, pending=True)
            await page.goto(BASE + "/account")
            await expect(page.get_by_text(LONG_EMAIL, exact=True).first).to_be_visible()
            await assert_no_page_overflow(page)
            opener = page.get_by_role("button", name="Confirm new email")
            await opener.tap()
            modal = page.get_by_role("dialog", name="Confirm your new email")
            boxes = modal.locator(".staff-otp-boxes span")
            await expect(boxes).to_have_count(6)
            for box in await boxes.all():
                await assert_in_view(box, width, height)
            await assert_in_view(modal.get_by_role("button", name="Confirm email"), width, height)
            await assert_in_view(modal.get_by_role("button", name="Resend code"), width, height)
            await modal.get_by_role("textbox", name="Six-digit confirmation code").fill("042817")
            await expect(boxes).to_have_text(list("042817"))
            await page.keyboard.press("Escape")
            await expect(opener).to_be_focused()
            await page.close()
        print("PASS landscape, desktop resize, long account values, and six-position OTP in both themes", flush=True)

        calls = []
        page = await setup(360, 800, "light", {**ACCOUNT, "emailVerified": False}, calls=calls)
        await page.goto(BASE + "/account")
        await expect(page.get_by_role("heading", name="Verify your staff email")).to_be_visible()
        await expect(page.locator(".staff-layout")).to_have_count(0)
        assert not any(path == "/api/notifications" for _, path in calls)
        await page.close()

        routes = {
            "/dashboard": ".dashboard-summary-grid, .dashboard-summary",
            "/repairs": ".repair-table-wrapper",
            "/repairs/new": "#new-repair-form, .repair-form",
            "/repairs/1": ".tracking-code-value",
            "/customers": ".customer-table-wrapper",
            "/customers/1": ".customer-info-grid",
            "/customers/1/devices/1": ".device-info-grid",
            "/technicians": ".technician-table-wrapper",
            "/technicians/1": ".technician-info-grid",
            "/reports": ".report-summary-strip",
            "/administration": ".staff-table-wrapper",
            "/account": ".account-settings-grid",
        }
        for width, height, theme in [(360, 800, "light"), (390, 844, "dark")]:
            page = await setup(width, height, theme)
            errors = []
            page.on("pageerror", lambda error: errors.append(str(error)))
            for path, selector in routes.items():
                await page.goto(BASE + path)
                await expect(page.get_by_role("button", name="Open navigation menu")).to_have_attribute("aria-expanded", "false")
                await expect(page.locator(".main-content .skeleton:visible")).to_have_count(0)
                await expect(page.locator(selector).first).to_be_visible()
                await assert_no_page_overflow(page)
                heading = page.locator(".main-content h2").first
                await assert_in_view(heading, width, height)
                if path == "/repairs/1":
                    sections = page.get_by_role("navigation", name="Repair workspace sections")
                    for section in await sections.get_by_role("button").all():
                        await section.tap()
                        await expect(section).to_have_attribute("aria-pressed", "true")
                        await assert_no_page_overflow(page)
            await page.goto(BASE + "/track")
            await expect(page.locator(".staff-layout")).to_have_count(0)
            await assert_no_page_overflow(page)
            assert not errors, errors
            await page.close()
            print(f"PASS all 12 authenticated routes, and public tracking, at {width}px", flush=True)
        await browser.close()


if __name__ == "__main__":
    asyncio.run(main())
