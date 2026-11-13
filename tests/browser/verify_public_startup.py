"""Public routes must boot even when a client filter blocks trackingCode.js."""
import asyncio, os
from urllib.parse import urlparse
from playwright.async_api import async_playwright, expect

async def main():
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
        context = await browser.new_context()
        blocked = []
        errors = []

        async def intercept(route):
            path = urlparse(route.request.url).path
            if path.endswith('/trackingCode.js'):
                blocked.append(path)
                await route.abort('blockedbyclient')
            elif path.startswith('/api/'):
                await route.fulfill(status=401, content_type='application/json', body='{}')
            else:
                await route.continue_()

        await context.route('**/*', intercept)
        page = await context.new_page()
        page.on('pageerror', lambda error: errors.append(str(error)))
        base = os.environ.get('CELLBANK_TEST_URL', 'http://localhost:5173')
        for path, heading in [('/track', 'Track Your Repair'), ('/login', 'Staff Login'), ('/', 'Your repair updates, all in one place.')]:
            await page.goto(base + path)
            await expect(page.get_by_role('heading', name=heading)).to_be_visible()
            if path == '/track':
                await expect(page.locator('#tracking-code')).to_have_value('')
        assert not blocked, 'Application still requests the filename blocked by client filters'
        assert not errors, errors
        await browser.close()
        print('PASS public tracking, login and landing boot with trackingCode.js blocked; no runtime errors')

asyncio.run(main())
