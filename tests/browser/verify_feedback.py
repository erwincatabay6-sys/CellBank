"""Run against `npm run dev`. Requires Python Playwright and Chromium, no production API."""
import asyncio, json, os, traceback
from pathlib import Path
from playwright.async_api import async_playwright, expect

BASE = os.environ.get('CELLBANK_TEST_URL', 'http://localhost:5173')
OUT = Path(os.environ.get('CELLBANK_TEST_OUTPUT', '/tmp/cellbank-feedback-tests'))
OUT.mkdir(parents=True, exist_ok=True)
results = []

async def main():
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium'), args=['--no-sandbox'])
        async def setup(width=1440):
            context = await browser.new_context(viewport={'width':width,'height':900}, reduced_motion='reduce')
            page = await context.new_page()
            await page.clock.install()
            await page.goto(BASE + '/tests/browser/feedback.html')
            await expect(page.get_by_role('button', name='Success', exact=True)).to_be_visible()
            return context, page
        async def check(name, fn):
            try:
                await fn()
                results.append({'check': name, 'passed': True})
                print('PASS', name, flush=True)
            except Exception:
                results.append({'check':name,'passed':False,'error':traceback.format_exc()})
                print('FAIL',name,traceback.format_exc(),flush=True)
        async def lifetime():
            c,p = await setup()
            await p.get_by_role('button',name='Success',exact=True).click()
            toast=p.locator('.feedback-toast')
            await expect(toast).to_have_count(1)
            assert await toast.get_attribute('role')=='status'
            await p.clock.run_for(1500)
            await toast.hover()
            await p.clock.run_for(6000)
            await expect(toast).to_have_count(1)
            await p.mouse.move(0,0)
            await p.clock.run_for(1500)
            close=toast.get_by_role('button')
            await p.keyboard.press('Tab');await close.focus()
            assert await close.evaluate('(e)=>getComputedStyle(e).outlineStyle')=='solid'
            await p.clock.run_for(6000)
            await expect(toast).to_have_count(1)
            await p.get_by_role('button',name='Success',exact=True).focus()
            await p.clock.run_for(2200)
            await expect(toast).to_have_count(0)
            await c.close()
        await check('Success expires after remaining five seconds; hover and keyboard focus pause/resume',lifetime)
        async def queue():
            c,p=await setup()
            await p.get_by_role('button',name='Five errors',exact=True).click()
            await expect(p.locator('.feedback-toast')).to_have_count(3)
            assert await p.get_by_text('Queued error 4',exact=True).count()==0
            await p.get_by_role('button',name='Success',exact=True).click()
            await p.clock.run_for(60000)
            await expect(p.locator('.feedback-toast')).to_have_count(3)
            for i in range(1,6):
                toast=p.locator('.feedback-toast').filter(has_text=f'Queued error {i}')
                await expect(toast).to_be_visible()
                assert await toast.get_attribute('role')=='alert'
                await toast.get_by_role('button').click()
                assert await p.locator('.feedback-toast').count()<=3
            await expect(p.get_by_text('Same saved result',exact=True)).to_be_visible()
            await p.mouse.move(0,0)
            await p.get_by_role('button',name='Success',exact=True).focus()
            await p.clock.run_for(5200)
            await expect(p.locator('.feedback-toast')).to_have_count(0)
            await c.close()
        await check('Persistent errors queue without loss; max three; queued success gets full lifetime on promotion',queue)
        async def events():
            c,p=await setup()
            await p.get_by_role('button',name='Error',exact=True).click()
            await p.get_by_role('button',name='Error',exact=True).click()
            await expect(p.locator('.feedback-toast')).to_have_count(2)
            for _ in range(4):await p.get_by_role('button',name='Rerender',exact=False).click()
            await expect(p.locator('.feedback-toast')).to_have_count(2)
            for _ in range(2):
                button=p.locator('.feedback-toast').first.get_by_role('button')
                assert await button.get_attribute('type')=='button'
                await button.focus();await button.press('Enter')
            await p.get_by_role('button',name='Save and navigate',exact=True).click()
            await expect(p.get_by_role('heading',name='Next page')).to_be_visible()
            await expect(p.locator('.feedback-toast')).to_have_count(1)
            await p.get_by_role('button',name='Return to form',exact=True).click()
            await expect(p.locator('.feedback-toast')).to_have_count(1)
            await p.clock.run_for(5200)
            await expect(p.locator('.feedback-toast')).to_have_count(0)
            await p.get_by_role('button',name='Save and navigate',exact=True).click()
            await expect(p.locator('.feedback-toast')).to_have_count(1)
            await c.close()
        await check('Identical actions, Strict Mode/rerenders, manual keyboard dismissal, navigation persistence and no remount replay',events)
        async def responsive():
            for theme in ['light','dark']:
                for width in [320,768,1440]:
                    c,p=await setup(width)
                    await p.evaluate('(theme)=>document.documentElement.dataset.theme=theme',theme)
                    await p.get_by_role('button',name='Long variants',exact=True).click()
                    await expect(p.locator('.feedback-toast')).to_have_count(3)
                    assert await p.evaluate('document.documentElement.scrollWidth<=innerWidth')
                    for toast in await p.locator('.feedback-toast').all():
                        box=await toast.bounding_box()
                        assert box['x']>=0 and box['x']+box['width']<=width+1
                        assert await toast.evaluate('(e)=>e.scrollWidth<=e.clientWidth')
                    await p.get_by_role('button',name='Rerender',exact=False).click()
                    inline=p.locator('main > .feedback-notice')
                    assert await inline.get_by_role('button').count()==1
                    assert await inline.get_by_role('button',name='Retry records').is_visible()
                    assert await inline.locator('.feedback-dismiss').count()==0
                    await p.screenshot(path=str(OUT/f'variants-{theme}-{width}.png'),full_page=True)
                    await c.close()
        await check('Long text, inline action alignment, both themes, reduced motion and 320/768/1440px layouts',responsive)
        await browser.close()
    (OUT/'browser-results.json').write_text(json.dumps(results,indent=2))
    if not all(r['passed'] for r in results):raise SystemExit(1)

if __name__ == '__main__':asyncio.run(main())
