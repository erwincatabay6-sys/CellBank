"""Public landing routes, accessibility geometry, and themes with isolated API responses."""
import asyncio, json, os
from pathlib import Path
from urllib.parse import urlparse
from playwright.async_api import async_playwright, expect

BASE = os.environ.get('CELLBANK_TEST_URL', 'http://localhost:5173')
OUT = Path(os.environ.get('CELLBANK_TEST_OUTPUT', '/tmp/cellbank-landing-tests'))
OUT.mkdir(parents=True, exist_ok=True)

async def main():
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium'), args=['--no-sandbox'])
        errors, results = [], []
        async def intercept(route):
            if not urlparse(route.request.url).path.startswith('/api/'):
                await route.continue_()
                return
            await route.fulfill(status=401, content_type='application/json', body='{"message":"Isolated signed-out test"}')

        for theme in ['light', 'dark']:
            context = await browser.new_context(color_scheme=theme)
            await context.route('**/api/**', intercept)
            page = await context.new_page()
            page.on('pageerror', lambda error: errors.append(str(error)))
            await page.goto(BASE)
            await expect(page.locator('html')).to_have_attribute('data-theme', theme)
            for width, height in [(1440,900), (1366,768), (768,1024), (390,844), (320,568), (844,390)]:
                await page.set_viewport_size({'width':width, 'height':height})
                await expect(page.get_by_role('link', name='Track Your Repair', exact=True)).to_have_count(1)
                await expect(page.get_by_role('link', name='Staff Sign In', exact=True)).to_have_count(1)
                await expect(page.locator('.header-brand-subtitle')).to_have_count(0)
                assert await page.evaluate('document.documentElement.scrollWidth <= innerWidth'), (theme,width)
                for selector in ['.landing-sign-in', '.landing-steps p', '.landing-hero p']:
                    assert await page.locator(selector).first.evaluate('(e) => parseFloat(getComputedStyle(e).fontSize) >= 16')
                for selector in ['.landing-sign-in', '.theme-toggle', '.landing-track-link']:
                    box = await page.locator(selector).bounding_box()
                    assert box['height'] >= 44 and box['width'] >= 44
                if width <= 760:
                    action = await page.locator('.landing-track-link').bounding_box()
                    art = await page.locator('.landing-illustration').bounding_box()
                    assert art['y'] > action['y'] + action['height']
                    assert action['y'] + action['height'] <= height
                    steps = await page.locator('.landing-steps li').evaluate_all('(nodes) => nodes.map(e => e.getBoundingClientRect().top)')
                    assert steps[0] < steps[1] < steps[2]
                # Compute contrast against the actual nearest opaque background.
                contrast = await page.evaluate('''() => {
                    const rgb = s => s.match(/[\\d.]+/g).slice(0,3).map(Number);
                    const lum = c => rgb(c).map(v => v/255).map(v => v <= .04045 ? v/12.92 : ((v+.055)/1.055)**2.4).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
                    const ratio = (a,b) => (Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
                    return ['.landing-sign-in','.landing-hero p','.landing-steps p','.landing-track-link'].map(s => {
                        const e = document.querySelector(s); let p=e;
                        while (getComputedStyle(p).backgroundColor === 'rgba(0, 0, 0, 0)') p=p.parentElement;
                        return {selector:s, ratio:ratio(getComputedStyle(e).color,getComputedStyle(p).backgroundColor)};
                    });
                }''')
                assert all(item['ratio'] >= 4.5 for item in contrast), contrast
                await page.screenshot(path=str(OUT/f'landing-{theme}-{width}.png'), full_page=True)
                results.append({'theme':theme,'width':width,'passed':True,'contrast':contrast})
            # Keyboard-only path to theme, sign-in, then primary action.
            await page.goto(BASE)
            for selector in ['.landing-brand','.theme-toggle','.landing-sign-in','.landing-track-link']:
                await page.keyboard.press('Tab')
                await expect(page.locator(selector)).to_be_focused()
                assert await page.locator(selector).evaluate('(e) => getComputedStyle(e).outlineStyle !== "none"')
            await page.keyboard.press('Enter')
            await expect(page).to_have_url(BASE+'/track')
            await expect(page.locator('.header-brand-subtitle')).to_be_visible()
            assert await page.locator('.landing-layout').count() == 0
            await page.goto(BASE)
            await page.get_by_role('link',name='Staff Sign In').click()
            await expect(page).to_have_url(BASE+'/login')
            await expect(page.locator('#login-identifier')).to_be_visible()
            await expect(page.locator('.header-brand-subtitle')).to_be_visible()
            await page.goto(BASE)
            await page.locator('.theme-toggle').focus()
            await page.keyboard.press('Space')
            next_theme = 'dark' if theme == 'light' else 'light'
            await expect(page.locator('html')).to_have_attribute('data-theme',next_theme)
            await page.reload()
            await expect(page.locator('html')).to_have_attribute('data-theme',next_theme)
            assert await page.evaluate('localStorage.getItem("cellbank-theme")') == next_theme
            await context.close()
        assert not errors, errors
        (OUT/'results.json').write_text(json.dumps(results,indent=2))
        print(f'PASS {len(results)} theme/viewport checks; contrast, typography, touch targets, keyboard links, theme persistence, public header isolation; no browser exceptions')
        await browser.close()

asyncio.run(main())
