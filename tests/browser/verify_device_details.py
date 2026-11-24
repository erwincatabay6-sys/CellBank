"""Check Device Details against browser-only, role-scoped fixtures."""
import asyncio
import os
from pathlib import Path
from urllib.parse import urlsplit

from playwright.async_api import async_playwright, expect

from verify_application import REPAIR, USER
from verify_customer_details import device

BASE = os.environ.get("CELLBANK_TEST_URL", "http://localhost:5173")
OUT = Path(os.environ.get("CELLBANK_TEST_OUTPUT", "/tmp/cellbank-device-details"))
LONG_PROBLEM = "Intermittent charging failure.\nReference: " + "LONGUNBROKENREFERENCE" * 5


async def main():
    OUT.mkdir(parents=True, exist_ok=True)
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(
            executable_path=os.environ.get("CHROMIUM_PATH", "/usr/bin/chromium"),
            args=["--no-sandbox"],
        )

        async def setup(count, width=1440, height=900, theme="light", roles=None):
            roles = roles or ["ADMIN"]
            laptop = {**device(4), "notes": "Silver chassis", "serialNumber": "PF-2048"}
            customer = {"id": 1, "name": "Mara Reyes", "phone": "+63 917 456 0123",
                        "devices": [laptop, device(2)]}
            repairs = [
                {
                    **REPAIR, "id": number, "deviceId": 4, "problemCategory": category,
                    "repairReference": f"CB-TEST-{number:03}", "status": status,
                    "reportedProblem": problem, "serviceType": service,
                }
                for number, category, status, problem, service in [
                    (23, "CHARGING", "RECEIVED", "Won’t charge", "DIAGNOSTIC"),
                    (20, "BATTERY", "IN_PROGRESS", "Battery drains quickly", "HARDWARE_REPAIR"),
                    (17, "CHARGING", "COMPLETED", "Loose charging port", "HARDWARE_REPAIR"),
                    (14, "DISPLAY", "COMPLETED", "Screen flickers", "DIAGNOSTIC"),
                    (10, "CHARGING", "CANCELLED", "Cancelled appointment", "DIAGNOSTIC"),
                    (8, "CHARGING", "COMPLETED", LONG_PROBLEM, "HARDWARE_REPAIR"),
                ][:count]
            ]
            authorized = repairs if roles != ["TECHNICIAN"] else repairs[:1] + repairs[-1:]
            other_device = [{**repair, "id": repair["id"] + 100, "deviceId": 2,
                             "repairReference": f"AUX-{repair['id']}"} for repair in repairs]
            errors = []

            page = await browser.new_page(
                viewport={"width": width, "height": height}, color_scheme=theme,
                has_touch=width < 650, is_mobile=width < 650, reduced_motion="reduce",
            )
            page.on("pageerror", lambda error: errors.append(str(error)))

            async def intercept(route):
                path = urlsplit(route.request.url).path
                if not path.startswith("/api/"):
                    await route.continue_()
                    return
                results = {
                    "/api/auth/me": {**USER, "roles": roles},
                    "/api/customers": [customer],
                    "/api/customers/1": customer,
                    "/api/customers/1/devices/4/repairs": authorized,
                    "/api/customers/1/devices/2/repairs": other_device,
                    "/api/notifications": {"notifications": [], "unreadCount": 0},
                }
                for repair in authorized:
                    results[f"/api/repairs/{repair['id']}"] = repair
                await route.fulfill(content_type="application/json", json=results.get(path, []))

            await page.route("**/api/**", intercept)
            await page.goto(BASE + "/customers/1/devices/4")
            await expect(page.get_by_role("heading", name="Lenovo ThinkPad T14")).to_be_visible()
            return page, errors

        for count in [0, 5, 6]:
            page, errors = await setup(count)
            await expect(page.get_by_role("link", name="Mara Reyes")).to_have_attribute("href", "/customers/1")
            info = page.locator(".device-info-grid")
            await expect(info.locator("dt")).to_have_text(["Device Type", "Brand", "Model", "IMEI", "Serial Number", "Notes"])
            await expect(info.locator("dd")).to_have_text(["Laptop", "Lenovo", "ThinkPad T14", "Not recorded", "PF-2048", "Silver chassis"])
            table = page.get_by_role("table", name="Device repair history")
            rows = table.locator("tbody tr")
            pager = page.get_by_role("navigation", name="Repair history pages")
            await expect(rows).to_have_count(min(5, count))
            await expect(pager).to_have_count(int(count > 5))
            if not count:
                await expect(page.get_by_text("No repair history", exact=True)).to_be_visible()
            if count == 5:
                await expect(page.get_by_text("Showing 1–5 of 5 repairs", exact=True)).to_be_visible()
            if count == 6:
                await expect(table.get_by_role("columnheader")).to_have_text([
                    "Repair reference", "Reported problem", "Service type", "Problem category", "Status",
                ])
                expected_refs = ["CB-TEST-023", "CB-TEST-020", "CB-TEST-017", "CB-TEST-014", "CB-TEST-010"]
                await expect(rows.locator("button")).to_have_text(expected_refs)
                repeated = page.locator(".device-history-repeated")
                await expect(repeated).to_contain_text("Charging issue recorded in 3 repair visits.")
                await expect(page.get_by_text("Showing 1–5 of 6 repairs", exact=True)).to_be_visible()
                await page.screenshot(path=OUT / "device-desktop-light.png")
                previous, next_page = pager.get_by_role("button", name="Previous"), pager.get_by_role("button", name="Next")
                await expect(previous).to_be_disabled()
                await next_page.click()
                await expect(rows.locator("button")).to_have_text(["CB-TEST-008"])
                await expect(page.get_by_text("Showing 6 of 6 repairs", exact=True)).to_be_visible()
                await expect(next_page).to_be_disabled()
                await expect(repeated).to_contain_text("Charging issue recorded in 3 repair visits.")
                await previous.click()
                await expect(rows.locator("button")).to_have_text(expected_refs)
                await page.get_by_role("button", name="Edit Device").click()
                modal = page.get_by_role("dialog", name="Edit Device")
                await expect(modal.get_by_label("Brand", exact=True)).to_have_value("Lenovo")
                await expect(modal.get_by_label("Model", exact=True)).to_have_value("ThinkPad T14")
                await modal.get_by_role("button", name="Cancel", exact=True).click()
                await next_page.click()
                await page.get_by_role("link", name="Mara Reyes").click()
                await page.get_by_role("link", name="Apple MacBook Air M2", exact=True).click()
                await expect(page.get_by_role("heading", name="Apple MacBook Air M2")).to_be_visible()
                await expect(page.get_by_text("Showing 1–5 of 6 repairs", exact=True)).to_be_visible()
                await expect(rows.locator("button")).to_have_text(["AUX-23", "AUX-20", "AUX-17", "AUX-14", "AUX-10"])
            assert not errors, errors
            await page.close()
            print(f"PASS desktop with {count} authorized repairs", flush=True)

        for width, height, theme in [(360, 800, "dark"), (390, 844, "light")]:
            page, errors = await setup(6, width, height, theme)
            mobile = page.get_by_role("list", name="Device repair history")
            await expect(mobile.get_by_role("listitem")).to_have_count(5)
            await expect(page.get_by_role("table", name="Device repair history")).to_have_count(0)
            await expect(mobile.locator(".device-history-row-top").first).to_contain_text("Received")
            if width == 390:
                await page.screenshot(path=OUT / "device-mobile-light.png")
            pager = page.get_by_role("navigation", name="Repair history pages")
            await pager.get_by_role("button", name="Next").tap()
            await expect(mobile.get_by_role("listitem")).to_have_count(1)
            await expect(mobile.locator(".device-history-problem")).to_have_text(LONG_PROBLEM)
            await expect(page.locator(".device-history-repeated")).to_contain_text("Charging issue recorded in 3 repair visits.")
            assert await page.evaluate("""() => {
                const main = document.querySelector('.main-content');
                return document.documentElement.scrollWidth <= innerWidth + 1 &&
                  main.scrollWidth <= main.clientWidth + 1;
            }""")
            previous = pager.get_by_role("button", name="Previous")
            await previous.scroll_into_view_if_needed()
            await expect(previous).to_be_in_viewport()
            if width == 360:
                await page.screenshot(path=OUT / "device-mobile-dark.png")
            await mobile.get_by_role("button", name="Open repair CB-TEST-008").tap()
            await expect(page).to_have_url(BASE + "/repairs/8")
            assert not errors, errors
            await page.close()
            print(f"PASS {width}px {theme} wrapping, pagination and repair navigation", flush=True)

        for roles in [["TECHNICIAN"], ["FRONT_DESK"], ["FRONT_DESK", "TECHNICIAN"]]:
            page, errors = await setup(6, roles=roles)
            await expect(page.get_by_role("button", name="Edit Device")).to_have_count(int(roles != ["TECHNICIAN"]))
            if roles == ["TECHNICIAN"]:
                await expect(page.get_by_text("Showing 1–2 of 2 repairs", exact=True)).to_be_visible()
                await expect(page.locator(".device-history-repeated")).to_contain_text("Charging issue recorded in 2 repair visits.")
                await expect(page.get_by_role("button", name="Open repair CB-TEST-020")).to_have_count(0)
            assert not errors, errors
            await page.close()
        print("PASS role-based edit visibility and authorized repeated-problem counts", flush=True)
        await browser.close()


if __name__ == "__main__":
    asyncio.run(main())
