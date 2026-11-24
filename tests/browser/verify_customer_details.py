"""Customer Details interactions with synthetic, role-scoped browser fixtures."""
import asyncio
import os
from pathlib import Path
from urllib.parse import urlsplit

from playwright.async_api import async_playwright, expect

from verify_application import REPAIR, USER

BASE = os.environ.get("CELLBANK_TEST_URL", "http://localhost:5173")
OUT = Path(os.environ.get("CELLBANK_TEST_OUTPUT", "/tmp/cellbank-customer-details"))

MODELS = [
    ("Apple", "iPhone 15 Pro Max", "Mobile Phone"),
    ("Apple", "MacBook Air M2", "Laptop"),
    ("Samsung", "Galaxy A54", "Mobile Phone"),
    ("Lenovo", "ThinkPad T14", "Laptop"),
    ("Xiaomi", "Redmi Note 12", "Mobile Phone"),
    ("Google", "Pixel 8", "Mobile Phone"),
]
LONG_EMAIL = "customer." + "long-example." * 5 + "address@example.test"
LONG_ADDRESS = "Building " + "Longaddresscomponentwithoutspaces" * 3 + ", Alaminos City"


def device(number):
    brand, model, kind = MODELS[(number - 1) % len(MODELS)]
    if number > len(MODELS):
        model += f" {number}"
    return {
        "id": number, "type": kind, "brand": brand, "model": model,
        "imei": str(351052460000000 + number) if kind == "Mobile Phone" else None,
        "serialNumber": f"TEST-SN-{number:04d}" if kind == "Laptop" else None,
    }


async def main():
    OUT.mkdir(parents=True, exist_ok=True)
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch(
            executable_path=os.environ.get("CHROMIUM_PATH", "/usr/bin/chromium"),
            args=["--no-sandbox"],
        )

        async def setup(count, *, width=1440, height=900, theme="light", roles=None,
                        long_contact=False, history_status=200):
            roles = roles or ["ADMIN"]
            all_devices = [device(number) for number in range(1, count + 1)]
            first = {"id": 1, "name": "Mara Reyes", "phone": "+63 917 456 0123",
                     "email": LONG_EMAIL if long_contact else "mara@example.test",
                     "address": LONG_ADDRESS if long_contact else "Alaminos City",
                     "devices": all_devices if roles != ["TECHNICIAN"] else all_devices[:2]}
            second = {"id": 2, "name": "Nico Santos", "phone": "+63 917 456 0124",
                      "email": None, "address": None, "devices": [device(19)]}
            repairs = [
                {**REPAIR, "id": 22, "deviceId": 2, "repairReference": "CB-TEST-022",
                 "status": "IN_PROGRESS", "reportedProblem": "Intermittent screen flicker"},
                {**REPAIR, "id": 11, "deviceId": 1, "repairReference": "CB-TEST-011",
                 "status": "COMPLETED", "reportedProblem": "Battery drains rapidly"},
            ][:1 if roles == ["TECHNICIAN"] else 2] if count else []
            calls = []
            errors = []
            page = await browser.new_page(
                viewport={"width": width, "height": height},
                color_scheme=theme, has_touch=width < 650, is_mobile=width < 650,
                reduced_motion="reduce",
            )
            page.on("pageerror", lambda error: errors.append(str(error)))

            async def intercept(route):
                path = urlsplit(route.request.url).path
                if not path.startswith("/api/"):
                    await route.continue_()
                    return
                method = route.request.method
                calls.append((method, path))
                status = 200
                if method in ("POST", "PUT"):
                    assert route.request.headers["x-fixture-csrf"] == "local-only"
                    body = route.request.post_data_json
                    if path == "/api/customers/1" and method == "PUT":
                        first.update(body)
                        data = first
                    elif path == "/api/customers/1/devices" and method == "POST":
                        data = {"id": 25, **body}
                        first["devices"].append(data)
                        status = 201
                    else:
                        raise AssertionError(f"Unexpected write {method} {path}")
                elif path == "/api/customers/1/repairs":
                    status = history_status
                    data = repairs if status == 200 else {"message": "Fixture history unavailable"}
                else:
                    data = {
                        "/api/auth/me": {**USER, "roles": roles},
                        "/api/auth/csrf": {"headerName": "X-Fixture-CSRF", "token": "local-only"},
                        "/api/customers": [first, second],
                        "/api/customers/1": first,
                        "/api/repairs/22": repairs[0] if repairs else {},
                        "/api/notifications": {"notifications": [], "unreadCount": 0},
                    }.get(path, [])
                await route.fulfill(status=status, content_type="application/json", json=data)

            await page.route("**/api/**", intercept)
            return page, calls, errors

        for count in [0, 2, 5, 6, 18]:
            page, _, errors = await setup(count)
            await page.goto(BASE + "/customers")
            await page.get_by_role("button", name="Open customer Mara Reyes").click()
            await expect(page.get_by_role("heading", name="Mara Reyes", exact=True)).to_have_count(1)
            devices_tab = page.get_by_role("tab", name=f"Registered devices ({count})")
            history_tab = page.get_by_role("tab", name=f"Repair history ({2 if count else 0})")
            await expect(devices_tab).to_have_attribute("aria-selected", "true")
            await expect(history_tab).to_be_visible()
            table = page.get_by_role("table", name="Registered devices")
            rows = table.locator("tbody tr")
            pager = page.get_by_role("navigation", name="Device pages")
            search = page.get_by_role("searchbox", name="Search registered devices")
            await expect(rows).to_have_count(min(count, 5))
            await expect(pager).to_have_count(int(count > 5))
            if count == 0:
                await expect(page.get_by_text("No registered devices", exact=True)).to_be_visible()
                await history_tab.click()
                await expect(page.get_by_text("No repair history", exact=True)).to_be_visible()
            if count == 6:
                await pager.get_by_role("button", name="Next").click()
                await expect(rows).to_have_count(1)
                await expect(page.get_by_text("6 of 6 devices", exact=True)).to_be_visible()
            if count == 18:
                await page.screenshot(path=OUT / "customer-desktop-light.png")
                await expect(page.get_by_text("1–5 of 18 devices", exact=True)).to_be_visible()
                await expect(rows.first).to_contain_text("351052460000001")
                await expect(rows.first).to_contain_text("Not recorded")
                await pager.get_by_role("button", name="Page 4").click()
                await expect(rows).to_have_count(3)
                await expect(page.get_by_text("16–18 of 18 devices", exact=True)).to_be_visible()
                await devices_tab.press("ArrowRight")
                await expect(history_tab).to_be_focused()
                await expect(history_tab).to_have_attribute("aria-selected", "true")
                history = page.get_by_role("tabpanel", name="Repair history (2)")
                await expect(history.locator(".customer-repair-item")).to_have_count(2)
                await expect(history.locator(".customer-repair-item").first).to_contain_text("CB-TEST-022")
                await expect(history.get_by_text("Intermittent screen flicker")).to_be_visible()
                await expect(history.get_by_text("Apple MacBook Air M2")).to_be_visible()
                await expect(history.get_by_text("In Progress")).to_be_visible()
                await history_tab.press("Home")
                await expect(devices_tab).to_be_focused()
                await expect(page.get_by_text("16–18 of 18 devices", exact=True)).to_be_visible()
                for query in ["pixel 8 18", "test-sn-0016", "351052460000017"]:
                    await search.fill(query)
                    await expect(rows).to_have_count(1)
                    await expect(devices_tab).to_have_text("Registered devices (18)")
                    await expect(page.get_by_text("1 device", exact=True)).to_be_visible()
                await history_tab.click()
                await devices_tab.click()
                await expect(search).to_have_value("351052460000017")
                await search.fill("not a real model")
                await expect(page.get_by_text("No matching devices", exact=True)).to_be_visible()
                await page.get_by_role("button", name="Clear search").click()
                await expect(search).to_be_focused()
                await expect(page.get_by_text("1–5 of 18 devices", exact=True)).to_be_visible()
                await search.fill("Pixel")
                await page.get_by_role("link", name="Customers", exact=True).click()
                await page.get_by_role("button", name="Open customer Nico Santos").click()
                await expect(search).to_have_value("")
                await expect(page.get_by_role("tab", name="Registered devices (1)")).to_have_attribute("aria-selected", "true")
                await expect(page.get_by_text("Not recorded", exact=True).first).to_be_visible()
            assert not errors, errors
            await page.close()
            print(f"PASS fixture with {count} registered devices", flush=True)

        for width, height, theme in [(360, 800, "light"), (390, 844, "dark")]:
            page, _, errors = await setup(18, width=width, height=height, theme=theme, long_contact=width == 360)
            await page.goto(BASE + "/customers/1")
            devices_tab = page.get_by_role("tab", name="Registered devices (18)")
            history_tab = page.get_by_role("tab", name="Repair history (2)")
            await expect(devices_tab).to_be_in_viewport()
            await expect(history_tab).to_be_in_viewport()
            mobile_rows = page.get_by_role("list", name="Registered devices")
            await expect(mobile_rows.get_by_role("listitem")).to_have_count(5)
            await expect(page.get_by_role("table", name="Registered devices")).to_have_count(0)
            if width == 390:
                await page.screenshot(path=OUT / "customer-mobile-dark.png")
            disclosure = mobile_rows.locator("summary").first
            await expect(disclosure).to_have_accessible_name("Apple iPhone 15 Pro Max, Mobile Phone, device identifiers")
            await disclosure.press("Enter")
            await expect(mobile_rows.get_by_text("351052460000001")).to_be_visible()
            await expect(mobile_rows.get_by_text("Not recorded", exact=True).first).to_be_visible()
            assert await page.evaluate("""() => {
                const main = document.querySelector('.main-content');
                return document.documentElement.scrollWidth <= innerWidth + 1 &&
                  main.scrollWidth <= main.clientWidth + 1;
            }""")
            if width == 390:
                await page.screenshot(path=OUT / "customer-mobile-identifiers.png")
            pager = page.get_by_role("navigation", name="Device pages")
            await pager.get_by_role("button", name="Next").tap()
            await expect(page.get_by_text("6–10 of 18 devices", exact=True)).to_be_visible()
            await history_tab.tap()
            await expect(page.get_by_role("button", name="Open repair CB-TEST-022")).to_be_visible()
            await devices_tab.tap()
            await expect(page.get_by_text("6–10 of 18 devices", exact=True)).to_be_visible()
            await history_tab.tap()
            await page.get_by_role("button", name="Open repair CB-TEST-022").tap()
            await expect(page).to_have_url(BASE + "/repairs/22")
            assert not errors, errors
            await page.close()
            print(f"PASS mobile rows, disclosure, paging and repair navigation at {width}px", flush=True)

        for roles in [["ADMIN"], ["FRONT_DESK"], ["TECHNICIAN"], ["FRONT_DESK", "TECHNICIAN"]]:
            page, _, errors = await setup(18, roles=roles)
            await page.goto(BASE + "/customers/1")
            manages = roles != ["TECHNICIAN"]
            await expect(page.get_by_role("tab", name=f"Registered devices ({18 if manages else 2})")).to_be_visible()
            await expect(page.get_by_role("tab", name=f"Repair history ({2 if manages else 1})")).to_be_visible()
            await expect(page.get_by_role("button", name="Edit Customer")).to_have_count(int(manages))
            await expect(page.get_by_role("button", name="New Device")).to_have_count(int(manages))
            await page.get_by_role("searchbox").fill("Pixel 8 18")
            if not manages:
                await expect(page.get_by_text("No matching devices", exact=True)).to_be_visible()
                await page.get_by_role("tab", name="Repair history (1)").click()
                await expect(page.get_by_role("button", name="Open repair CB-TEST-011")).to_have_count(0)
                await expect(page.get_by_role("button", name="Open repair CB-TEST-022")).to_be_visible()
            else:
                await expect(page.get_by_role("link", name="Google Pixel 8 18")).to_be_visible()
            assert not errors, errors
            await page.close()
        print("PASS authorized counts, identifier search and write controls for all four roles", flush=True)

        page, calls, errors = await setup(5)
        await page.goto(BASE + "/customers/1")
        await page.get_by_role("button", name="Edit Customer").click()
        await page.locator("#customer-name").fill("Mara Reyes Updated")
        await page.get_by_role("button", name="Save Changes").click()
        await expect(page.get_by_role("heading", name="Mara Reyes Updated")).to_be_visible()
        await page.get_by_role("searchbox").fill("Xiaomi")
        await page.get_by_role("button", name="New Device").click()
        await page.get_by_label("Device Type").select_option("Laptop")
        await page.get_by_label("Brand", exact=True).fill("Local")
        await page.get_by_label("Model", exact=True).fill("New Demo Laptop")
        await page.get_by_label("Serial Number", exact=True).fill("TEST-NEW-DEVICE")
        await page.get_by_role("button", name="Register Device").click()
        await expect(page.get_by_role("tab", name="Registered devices (6)")).to_be_visible()
        await expect(page.get_by_role("searchbox")).to_have_value("")
        await expect(page.get_by_text("6 of 6 devices", exact=True)).to_be_visible()
        link = page.get_by_role("link", name="Local New Demo Laptop")
        await expect(link).to_be_visible()
        await link.click()
        await expect(page).to_have_url(BASE + "/customers/1/devices/25")
        assert calls.count(("PUT", "/api/customers/1")) == 1
        assert calls.count(("POST", "/api/customers/1/devices")) == 1
        assert not errors, errors
        await page.close()
        print("PASS customer edit, registration, immediate new-device paging and navigation", flush=True)

        page, _, errors = await setup(2, history_status=403)
        await page.goto(BASE + "/customers/1")
        await page.get_by_role("tab", name="Repair history (unavailable)").click()
        await expect(page.get_by_text("Access restricted", exact=True)).to_be_visible()
        await expect(page.get_by_role("button", name="Try Again")).to_have_count(0)
        assert not errors, errors
        await page.close()
        print("PASS restricted repair history keeps its persistent access message", flush=True)
        await browser.close()


if __name__ == "__main__":
    asyncio.run(main())
