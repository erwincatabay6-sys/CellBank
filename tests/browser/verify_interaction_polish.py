"""Interaction regression checks through the app with isolated API fixtures."""
import asyncio
import os
from urllib.parse import urlsplit

from playwright.async_api import async_playwright, expect
from verify_application import USER

BASE = os.environ.get("CELLBANK_TEST_URL", "http://localhost:5173")
STAFF = {**USER, "id": 2, "name": "Test Technician", "username": "local-tech",
         "email": "staff@example.test", "roles": ["TECHNICIAN"], "status": "ACTIVE"}


async def main():
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(
            executable_path=os.environ.get("CHROMIUM_PATH", "/usr/bin/chromium"),
            args=["--no-sandbox"],
        )
        for theme, width, motion in [("light", 1366, "no-preference"), ("dark", 360, "reduce")]:
            context = await browser.new_context(
                viewport={"width": width, "height": 900}, color_scheme=theme, reduced_motion=motion
            )
            account = {**USER, "status": "ACTIVE"}
            release_load = asyncio.Event()
            release_save = asyncio.Event()
            save_started = asyncio.Event()
            save_count = 0
            row_count = 10

            async def route(request):
                nonlocal save_count
                path = urlsplit(request.request.url).path
                if not path.startswith("/api/"):
                    await request.continue_()
                    return
                path = path.removeprefix("/api/")
                status = 200
                if path == "users":
                    await release_load.wait()
                    data = [STAFF]
                elif path == "users/2" and request.request.method == "PUT":
                    save_count += 1
                    save_started.set()
                    await release_save.wait()
                    data = {**STAFF, **request.request.post_data_json}
                elif path == "auth/me":
                    data = account
                elif path == "auth/csrf":
                    data = {"headerName": "X-CSRF-TEST", "token": "isolated-test"}
                elif path == "notifications":
                    data = {"items": [], "unreadCount": 0}
                elif path == "dashboard":
                    data = {
                        "technicianOnly": account["roles"] == ["TECHNICIAN"],
                        "summary": {}, "statusCounts": {}, "attentionRepairs": [],
                        "technicianWorkload": [], "frontDeskActivity": [],
                        "financialSnapshot": {"totalAgreedValue": 0, "totalCollected": 0, "outstandingBalance": 0},
                        "recentActiveRepairs": [
                            {"id": i, "reference": f"FIXTURE-{i:03}", "customer": "Test Customer",
                             "device": "Test Device", "technician": "Test Technician", "status": "IN_PROGRESS"}
                            for i in range(1, row_count + 1)
                        ],
                    }
                else:
                    status, data = 404, {}
                await request.fulfill(status=status, json=data)

            await context.route("**/api/**", route)
            page = await context.new_page()
            errors = []
            page.on("pageerror", lambda error: errors.append(str(error)))
            await page.goto(BASE + "/administration")
            loading = page.locator(".loading-status[role=status]").filter(has_text="Loading staff accounts")
            await expect(loading.locator(".loading-spinner")).to_be_visible()
            await expect(page.locator(".staff-table-wrapper .skeleton").first).to_be_visible()
            release_load.set()

            opener = page.get_by_role("button", name="Edit staff member Test Technician")
            await opener.focus()
            await opener.press("Enter")
            modal = page.locator(".device-modal")
            await expect(modal.get_by_role("heading", name="Edit Staff Account")).to_be_visible()
            await expect(modal).to_have_css("animation-name", "interaction-enter" if motion == "no-preference" else "none")
            await expect(page.locator(".modal-backdrop")).to_have_css(
                "animation-name", "interaction-fade-in" if motion == "no-preference" else "none"
            )
            cancellation = modal.get_by_role("button", name="Cancel any pending email change")
            assert await cancellation.evaluate("(e) => e.offsetWidth < e.parentElement.clientWidth")
            assert await cancellation.evaluate("(e) => e.offsetHeight >= 44")

            await cancellation.focus()
            await cancellation.press("Enter")
            await expect(modal.locator(".staff-email-cancellation")).to_have_css(
                "animation-name", "interaction-enter" if motion == "no-preference" else "none"
            )
            await modal.get_by_role("button", name="Keep proposal").click()
            await expect(cancellation).to_be_visible()
            name = modal.get_by_label("Full Name")
            if motion == "no-preference":
                await modal.evaluate(
                    """(element) => element.getAnimations().find(
                        (animation) => animation.animationName === 'interaction-enter'
                    )?.finished"""
                )
                await modal.evaluate(
                    """(element) => {
                        window.modalReplays = 0;
                        element.addEventListener('animationstart', () => window.modalReplays++);
                    }"""
                )
            await name.fill("Test Technician Updated")
            if motion == "no-preference":
                await page.evaluate("() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))")
                assert await page.evaluate("window.modalReplays") == 0

            save = modal.get_by_role("button", name="Save Changes")
            idle_width = (await save.bounding_box())["width"]
            await save.click()
            await asyncio.wait_for(save_started.wait(), timeout=5)
            busy = modal.get_by_role("button", name="Saving account")
            await expect(busy).to_be_disabled()
            await expect(busy.locator(".loading-spinner")).to_be_visible()
            assert abs(idle_width - (await busy.bounding_box())["width"]) < 1
            await name.press("Enter")
            assert save_count == 1
            release_save.set()
            await expect(modal).to_have_count(0)

            for roles, subtitle in [
                (["ADMIN"], "Up to 10 active repairs, most recently updated first."),
                (["TECHNICIAN"], "Up to 10 of your active repairs, most recently updated first."),
            ]:
                account["roles"] = roles
                row_count = 10
                await page.goto(BASE + "/dashboard")
                await expect(page.get_by_text(subtitle, exact=True)).to_be_visible()
                table = page.locator(".dashboard-recent-table-wrapper")
                await expect(table.locator("tbody tr")).to_have_count(10)
                assert await table.evaluate("(e) => e.scrollHeight <= e.clientHeight + 1")
                await expect(table.get_by_role("button", name="Open repair FIXTURE-010")).to_be_visible()
                row_count = 0
                await page.reload()
                await expect(page.get_by_text("No active repairs", exact=True)).to_be_visible()
                await expect(table).to_have_count(0)

            assert not errors, errors
            await context.close()
        await browser.close()
    print("PASS Administration loading, staff editor motion and sizing, stable pending save, both dashboard views and responsive reduced motion")


asyncio.run(main())
