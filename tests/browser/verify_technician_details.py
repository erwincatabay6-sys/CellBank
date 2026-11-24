"""Technician Details checks with isolated, role-scoped API responses."""
import asyncio
import os
from pathlib import Path
from urllib.parse import urlsplit

from playwright.async_api import async_playwright, expect

from verify_application import CUSTOMER, REPAIR, USER

BASE = os.environ.get("CELLBANK_TEST_URL", "http://localhost:5173")
OUT = Path(os.environ.get("CELLBANK_TEST_OUTPUT", "/tmp/cellbank-technician-details"))
LONG_REFERENCE = "CB-LEGACY-" + "REFERENCE" * 10
LONG_CUSTOMER = "LongCustomerFixture" * 6
LONG_DEVICE = "LongDeviceModelFixture" * 6
STATUSES = ["RECEIVED", "AWAITING_APPROVAL", "IN_PROGRESS", "AWAITING_PARTS", "READY_FOR_RELEASE"]


def repairs(numbers, history=False):
    return [
        {"id": number, "reference": LONG_REFERENCE if number == 26 else f"CB-TEST-{number:03}",
         "customer": LONG_CUSTOMER if number == 26 else CUSTOMER["name"],
         "device": LONG_DEVICE if number == 26 else "Local test laptop",
         "status": ("COMPLETED" if number % 2 else "CANCELLED") if history
         else ("AWAITING_APPROVAL" if index < 2 else "IN_PROGRESS")}
        for index, number in enumerate(numbers)
    ]


async def main():
    OUT.mkdir(parents=True, exist_ok=True)
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(
            executable_path=os.environ.get("CHROMIUM_PATH", "/usr/bin/chromium"),
            args=["--no-sandbox"],
        )

        async def setup(width=1440, height=900, theme="light", roles=None):
            first_active = repairs([18, 4, 15, 14, 13])
            first_history = repairs([29, 24, 30, 28, 27, 26], history=True)
            second_active = repairs([38, 36, 37, 35, 34, 33])
            data = {}
            directory = []
            for identifier, name, state, active, history in [
                (1, "Local Test Technician", "ACTIVE", first_active, first_history),
                (2, "Second Test Technician", "INACTIVE", second_active, first_history),
                (3, "Idle Test Technician", "ACTIVE", [], first_history),
                (4, "New Test Technician", "ACTIVE", first_active, []),
            ]:
                technician = {
                    "id": identifier, "name": name, "role": "Technician", "status": state,
                    "activeRepairs": len(active), "totalRepairs": len(active) + len(history),
                }
                directory.append(technician)
                data[f"/api/technicians/{identifier}"] = {
                    "technician": technician, "activeRepairs": active, "repairHistory": history,
                    "statusCounts": {status: sum(row["status"] == status for row in active) for status in STATUSES},
                }
            calls, errors = [], []
            context = await browser.new_context(
                viewport={"width": width, "height": height}, color_scheme=theme,
                is_mobile=width < 650, has_touch=width < 650, reduced_motion="reduce",
            )
            page = await context.new_page()
            page.on("pageerror", lambda error: errors.append(str(error)))

            async def intercept(route):
                path = urlsplit(route.request.url).path
                if not path.startswith("/api/"):
                    await route.continue_()
                    return
                calls.append(path)
                status = 200
                if path == "/api/technicians/99":
                    status, payload = 403, {"message": "Local access restriction fixture"}
                else:
                    payload = {
                        **data,
                        "/api/auth/me": {**USER, "roles": roles or ["ADMIN"]},
                        "/api/technicians": directory,
                        "/api/repairs/26": {**REPAIR, "id": 26, "repairReference": LONG_REFERENCE},
                        "/api/customers": [CUSTOMER],
                        "/api/customers/1": CUSTOMER,
                        "/api/notifications": {"notifications": [], "unreadCount": 0},
                    }.get(path, [])
                await route.fulfill(status=status, content_type="application/json", json=payload)

            await context.route("**/api/**", intercept)
            return context, page, calls, errors

        context, page, _, errors = await setup()
        await page.goto(BASE + "/technicians")
        await page.get_by_role("button", name="Open technician Local Test Technician").click()
        await expect(page.get_by_role("heading", name="Local Test Technician", exact=True)).to_be_visible()
        await expect(page.locator(".technician-detail-role")).to_have_text("TechnicianActive")
        await expect(page.locator(".technician-detail-counts dd")).to_have_text(["5", "11"])
        stats = page.locator(".technician-detail-status-counts dd")
        await expect(stats).to_have_text(["0", "2", "3", "0", "0"])
        await expect(page.get_by_text("Technician Information", exact=True)).to_have_count(0)

        active = page.get_by_role("tab", name="Active repairs (5)")
        history = page.get_by_role("tab", name="Repair history (6)")
        await expect(active).to_have_attribute("aria-selected", "true")
        active_table = page.get_by_role("table", name="Active repairs")
        await expect(active_table.get_by_role("columnheader")).to_have_text(["Repair reference", "Customer", "Device", "Status"])
        await expect(active_table.locator("tbody button")).to_have_text(
            ["CB-TEST-018", "CB-TEST-004", "CB-TEST-015", "CB-TEST-014", "CB-TEST-013"]
        )
        await expect(page.get_by_text("Showing 1–5 of 5 repairs", exact=True)).to_be_visible()
        await expect(page.get_by_role("navigation", name="Active repairs pages")).to_have_count(0)
        await page.screenshot(path=OUT / "technician-desktop-light.png")

        await active.press("ArrowRight")
        await expect(history).to_be_focused()
        await expect(history).to_have_attribute("aria-selected", "true")
        assert await history.evaluate("(e) => getComputedStyle(e).outlineStyle !== 'none'")
        table = page.get_by_role("table", name="Repair history")
        await expect(table.locator("tbody button")).to_have_text(
            ["CB-TEST-029", "CB-TEST-024", "CB-TEST-030", "CB-TEST-028", "CB-TEST-027"]
        )
        pager = page.get_by_role("navigation", name="Repair history pages")
        previous = pager.get_by_role("button", name="Previous")
        next_page = pager.get_by_role("button", name="Next")
        await expect(previous).to_be_disabled()
        await next_page.click()
        await expect(table.locator("tbody button")).to_have_text([LONG_REFERENCE])
        await expect(next_page).to_be_disabled()
        await expect(page.get_by_text("Showing 6 of 6 repairs", exact=True)).to_be_visible()
        await expect(stats).to_have_text(["0", "2", "3", "0", "0"])
        await history.press("Home")
        await expect(active).to_be_focused()
        await expect(active_table.locator("tbody tr")).to_have_count(5)
        await history.click()
        await expect(table.locator("tbody button")).to_have_text([LONG_REFERENCE])

        await page.get_by_role("link", name="Technicians", exact=True).click()
        await page.get_by_role("button", name="Open technician Second Test Technician").click()
        await expect(page.get_by_text("Inactive", exact=True)).to_be_visible()
        active = page.get_by_role("tab", name="Active repairs (6)")
        await expect(active).to_have_attribute("aria-selected", "true")
        await expect(active_table.locator("tbody button").first).to_have_text("CB-TEST-038")
        await page.get_by_role("navigation", name="Active repairs pages").get_by_role("button", name="Next").click()
        await history.click()
        await expect(previous).to_be_disabled()
        await expect(table.locator("tbody tr")).to_have_count(5)
        await next_page.click()
        await active.click()
        await expect(active_table.locator("tbody button")).to_have_text(["CB-TEST-033"])
        await history.click()
        await expect(table.locator("tbody button")).to_have_text([LONG_REFERENCE])

        await page.goto(BASE + "/technicians/3")
        await expect(page.get_by_text("No active repairs", exact=True)).to_be_visible()
        await expect(page.get_by_role("navigation", name="Active repairs pages")).to_have_count(0)
        await page.goto(BASE + "/technicians/4")
        await page.get_by_role("tab", name="Repair history (0)").click()
        await expect(page.get_by_text("No repair history", exact=True)).to_be_visible()
        assert not errors, errors
        await context.close()
        print("PASS desktop order, 5/6 records, boundaries, keyboard tabs, independent paging, reset, and both empty states", flush=True)

        for width, height, theme in [(360, 800, "dark"), (390, 844, "light")]:
            context, page, _, errors = await setup(width, height, theme)
            await page.goto(BASE + "/technicians/1")
            await expect(page.get_by_role("tab", name="Active repairs (5)")).to_be_in_viewport()
            history = page.get_by_role("tab", name="Repair history (6)")
            await expect(history).to_be_in_viewport()
            if width == 390:
                await page.screenshot(path=OUT / "technician-mobile-light.png")
            await history.tap()
            rows = page.get_by_role("list", name="Repair history")
            await expect(rows.get_by_role("listitem")).to_have_count(5)
            await expect(page.get_by_role("table")).to_have_count(0)
            pager = page.get_by_role("navigation", name="Repair history pages")
            await pager.get_by_role("button", name="Next").tap()
            await expect(rows.get_by_role("listitem")).to_have_count(1)
            reference = rows.get_by_role("button", name=f"Open repair {LONG_REFERENCE}", exact=True)
            await expect(reference).to_have_text(LONG_REFERENCE)
            await expect(rows.get_by_text(LONG_CUSTOMER)).to_be_visible()
            await expect(rows.get_by_text(LONG_DEVICE)).to_be_visible()
            assert await page.evaluate("""() => {
                const main = document.querySelector('.main-content');
                return document.documentElement.scrollWidth <= innerWidth + 1 &&
                  main.scrollWidth <= main.clientWidth + 1;
            }""")
            assert await reference.evaluate("(e) => e.scrollWidth <= e.clientWidth + 1")
            previous = pager.get_by_role("button", name="Previous")
            await previous.scroll_into_view_if_needed()
            await expect(previous).to_be_in_viewport()
            if width == 360:
                await page.screenshot(path=OUT / "technician-mobile-dark.png")
            await reference.tap()
            await expect(page).to_have_url(BASE + "/repairs/26")
            assert not errors, errors
            await context.close()
            print(f"PASS {width}px {theme} layout, full long reference, touch pager and repair navigation", flush=True)

        context, page, calls, errors = await setup(roles=["TECHNICIAN"])
        await page.goto(BASE + "/technicians/1")
        await expect(page.get_by_role("tab", name="Active repairs (5)")).to_be_visible()
        await page.goto(BASE + "/technicians/2")
        await expect(page.get_by_role("heading", name="Access restricted")).to_be_visible()
        assert "/api/technicians/2" not in calls
        await expect(page.get_by_role("tablist")).to_have_count(0)
        assert not errors, errors
        await context.close()

        context, page, calls, errors = await setup(roles=["FRONT_DESK", "TECHNICIAN"])
        await page.goto(BASE + "/technicians/2")
        await expect(page.get_by_role("tab", name="Active repairs (6)")).to_be_visible()
        assert "/api/technicians/2" in calls
        await page.goto(BASE + "/technicians/99")
        await expect(page.get_by_role("heading", name="Access restricted")).to_be_visible()
        await expect(page.get_by_role("button", name="Back to Technicians")).to_be_visible()
        assert not errors, errors
        await context.close()
        print("PASS own-details access, restricted viewer, combined role and API access denial", flush=True)
        await browser.close()


if __name__ == "__main__":
    asyncio.run(main())
