"""Exercise actual staff form payloads without any backend requests."""
import asyncio, os
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium'), args=['--no-sandbox'])
        page = await browser.new_page()
        base = os.environ.get('CELLBANK_TEST_URL', 'http://localhost:5173')
        for role in ['', 'ADMIN', 'TECHNICIAN', 'FRONT_DESK', 'TECHNICIAN,FRONT_DESK']:
            await page.goto(base + '/tests/browser/staff-roles.html?role=' + role)
            await expect(page.locator('#staff-name')).to_be_visible()
            assert await page.get_by_role('checkbox', name='Admin', exact=True).count() == 0
            await page.locator('#staff-name').fill('Updated local staff')
            if not role:
                await page.locator('#staff-username').fill('local')
                await page.locator('#staff-email').fill('local@example.test')
                await page.locator('#staff-password').fill('local-password-only')
                await page.get_by_role('checkbox', name='Front Desk', exact=True).check()
            if role == 'ADMIN':
                await expect(page.get_by_text('Admin (read-only)', exact=True)).to_be_visible()
                assert await page.get_by_role('checkbox').count() == 0
            await page.get_by_role('button', name='Save Changes' if role else 'Create Account', exact=True).click()
            saved = await page.evaluate('window.savedStaff')
            assert saved['roles'] == (role.split(',') if role else ['TECHNICIAN', 'FRONT_DESK']), saved
            assert saved['name'] == 'Updated local staff'
        await browser.close()
        print('PASS creation and all existing role combinations; administrator role preserved on detail edits')

asyncio.run(main())
