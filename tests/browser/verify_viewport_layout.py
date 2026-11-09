"""Shared-shell regression checks with browser-only API fixtures; run against Vite."""
import asyncio
import json
import os
import subprocess
import traceback
from pathlib import Path
from urllib.parse import urlparse

from playwright.async_api import async_playwright, expect
from verify_application import USER, CUSTOMER, REPAIR

BASE = os.environ.get('CELLBANK_TEST_URL', 'http://localhost:5173')
OUT = Path(os.environ.get('CELLBANK_TEST_OUTPUT', '/tmp/cellbank-layout-tests'))
OUT.mkdir(parents=True, exist_ok=True)
REPORT = {
    'repairSummary': {'totalRepairs': 40, 'activeRepairs': 40},
    'financialSummary': {},
    'statusCounts': {'IN_PROGRESS': 40},
    'repairVolume': [{'month': '2026-11', 'value': 40}],
    'paymentTrend': [],
    'technicianActivity': [],
    'financialRecords': [],
    'repairRecords': [dict(id=i, reference=f'LOCAL-REPORT-{i:03}',
                           createdAt='2026-11-09', customer='Local Test Customer',
                           device='Test Phone', technician='Unassigned',
                           status='IN_PROGRESS') for i in range(1, 41)],
}

async def intercept(route):
    path = urlparse(route.request.url).path
    if not path.startswith('/api/'):
        await route.continue_()
        return
    responses = {
        '/api/auth/me': USER,
        '/api/auth/csrf': {'headerName': 'X-Test-CSRF', 'token': 'local-only'},
        '/api/reports': REPORT,
        '/api/customers': [CUSTOMER],
        '/api/customers/1': CUSTOMER,
        '/api/repairs/1': REPAIR,
        '/api/repairs/technicians': [],
        '/api/notifications': {'notifications': [
            {'id': i, 'message': f'Local notification {i}', 'read': True,
             'createdAt': '2026-11-09T00:00:00Z'} for i in range(1, 11)
        ], 'unreadCount': 0},
    }
    if path.startswith('/api/repairs/1/') or path.endswith('/repairs'):
        data, status = [], 200
    elif path in responses:
        data, status = responses[path], 200
    else:
        data, status = {'message': 'Isolated layout check: unavailable'}, 503
    await route.fulfill(status=status, content_type='application/json', body=json.dumps(data))

async def metrics(page):
    return await page.evaluate('''() => {
      const box = (s) => {
        const e=document.querySelector(s), r=e.getBoundingClientRect();
        return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,
          height:r.height,scroll:e.scrollTop,client:e.clientHeight,total:e.scrollHeight};
      };
      return {height:innerHeight,width:innerWidth,bodyHeight:document.documentElement.scrollHeight,
        bodyWidth:document.documentElement.scrollWidth,windowScroll:scrollY,
        header:box('.app-header'),sidebar:box('.sidebar'),footer:box('.sidebar-profile'),
        nav:box('.sidebar-nav'),main:box('.main-content')};
    }''')

async def assert_shell(page):
    m = await metrics(page)
    assert m['bodyHeight'] <= m['height'] + 1, m
    assert m['bodyWidth'] <= m['width'] + 1, m
    assert abs(m['header']['top']) <= 1, m
    assert m['footer']['bottom'] <= m['height'] + 1, m
    assert m['main']['client'] > 40, m
    assert m['nav']['client'] >= 40, m
    return m

async def main():
    results = []
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium'), args=['--no-sandbox'])
        async def setup(width=1366, height=768, theme='light', path='/reports'):
            context = await browser.new_context(viewport={'width':width,'height':height}, reduced_motion='reduce')
            await context.add_init_script(f'localStorage.setItem("cellbank-theme", "{theme}")')
            await context.route('**/api/**', intercept)
            page = await context.new_page()
            page.set_default_timeout(10000)
            await page.goto(BASE + path)
            await expect(page.locator('.main-content')).to_be_visible()
            if path == '/reports':
                await expect(page.get_by_role('heading',name='Detailed Repair Records')).to_be_attached()
            return context, page

        if os.environ.get('LAYOUT_BASELINE'):
            c,p = await setup()
            (OUT/'before-metrics.json').write_text(json.dumps(await metrics(p),indent=2))
            await p.screenshot(path=str(OUT/'reports-before.png'))
            await c.close();await browser.close();return

        async def check(name, fn):
            if os.environ.get('LAYOUT_TEST_FILTER') and os.environ['LAYOUT_TEST_FILTER'] not in name:
                return
            try:
                await fn()
                results.append({'check':name,'passed':True})
                print('PASS',name,flush=True)
            except Exception as error:
                results.append({'check':name,'passed':False,'error':str(error)})
                print('FAIL',name,traceback.format_exc(),flush=True)

        async def reports():
            for theme in ['light','dark']:
                for width,height in [(1366,768),(1366,420),(390,844),(844,390),(375,430)]:
                    c,p = await setup(width,height,theme)
                    before = await assert_shell(p)
                    await p.locator('.main-content').evaluate('(e)=>e.scrollTop=e.scrollHeight')
                    after = await assert_shell(p)
                    assert after['main']['scroll'] > 500, after
                    for part in ['header','sidebar','footer']:
                        assert abs(before[part]['top']-after[part]['top'])<1, after
                    table=p.get_by_role('region',name='Detailed repair records',exact=True)
                    await table.evaluate('(e)=>e.scrollTop=e.scrollHeight')
                    last=p.get_by_role('button',name='Open repair LOCAL-REPORT-040',exact=True)
                    await last.focus()
                    box=await last.bounding_box()
                    assert box['y']>=after['main']['top'] and box['y']+box['height']<=height, box
                    if height==420:
                        assert after['nav']['total']>after['nav']['client']
                        await p.get_by_role('button',name='Administration',exact=True).focus()
                        nav=await p.get_by_role('button',name='Administration',exact=True).bounding_box()
                        footer=await p.locator('.sidebar-profile').bounding_box()
                        assert nav['y']+nav['height']<=footer['y']+1
                    await p.get_by_role('button',name='Collapse sidebar',exact=True).click()
                    await assert_shell(p)
                    await p.get_by_role('button',name='Expand sidebar',exact=True).click()
                    await assert_shell(p)
                    await p.screenshot(path=str(OUT/f'reports-{theme}-{width}x{height}.png'))
                    await c.close()
        await check('Long Reports: independent scrolling, footer, short navigation, collapse, mobile and both themes', reports)

        async def form_and_routes():
            c,p=await setup(path='/repairs/new')
            await p.get_by_label('Intake Notes',exact=True).focus()
            m=await assert_shell(p)
            assert m['main']['scroll']>0
            field=await p.get_by_label('Intake Notes',exact=True).bounding_box()
            assert field['y']>=m['main']['top'] and field['y']+field['height']<=m['height']
            await p.keyboard.press('Tab')
            await p.get_by_role('button',name='Create Repair',exact=True).click()
            await expect(p.get_by_label('Customer',exact=True)).to_be_focused()
            box=await p.get_by_label('Customer',exact=True).bounding_box()
            assert box['y']>=(await metrics(p))['main']['top']
            assert box['y']+box['height']<=768
            await p.get_by_role('button',name='Reports',exact=True).click()
            await expect(p.get_by_role('heading',name='Detailed Repair Records')).to_be_attached()
            assert (await metrics(p))['main']['scroll']==0
            await p.locator('.main-content').evaluate('(e)=>e.scrollTop=1200')
            await p.get_by_role('button',name='Customers',exact=True).click()
            await expect(p.get_by_role('heading',name='Customers',exact=True)).to_be_visible()
            assert (await metrics(p))['main']['scroll']==0
            await p.go_back()
            await expect(p.get_by_role('heading',name='Detailed Repair Records')).to_be_attached()
            # The pre-existing pathname-keyed main resets on back navigation too.
            assert (await metrics(p))['main']['scroll']==0
            await c.close()
        await check('Long repair form focus and route/back navigation reset', form_and_routes)

        async def overlays():
            c,p=await setup(path='/repairs/new')
            await p.locator('.main-content').evaluate('(e)=>e.scrollTop=e.scrollHeight')
            await p.get_by_role('button',name='Notifications',exact=True).click()
            panel=p.locator('.notification-panel')
            await expect(panel).to_be_visible()
            box=await panel.bounding_box()
            assert box['y']>=0 and box['x']>=0 and box['x']+box['width']<=1366
            await p.keyboard.press('Escape')
            await expect(panel).to_have_count(0)
            await p.get_by_role('button',name='Customers',exact=True).click()
            await p.get_by_role('button',name='New Customer',exact=True).click()
            modal=p.get_by_role('dialog')
            await expect(modal).to_be_visible()
            backdrop=await p.locator('.modal-backdrop').bounding_box()
            assert backdrop['x']==0 and backdrop['y']==0 and backdrop['height']==768, backdrop
            await p.get_by_role('button',name='Cancel',exact=True).click()
            await p.get_by_role('button',name='Repairs',exact=True).click()
            await p.goto(BASE+'/repairs/1')
            await p.context.grant_permissions(['clipboard-read','clipboard-write'])
            await p.get_by_role('button',name='Copy repair tracking code',exact=True).click()
            toast=p.locator('.feedback-toast')
            await expect(toast).to_be_visible()
            first=await toast.bounding_box()
            await p.locator('.main-content').evaluate('(e)=>e.scrollTop=0')
            assert (await toast.bounding_box())['y']==first['y']
            await c.close()
            c,p=await setup(375,430,path='/repairs/new')
            await p.get_by_role('button',name='Notifications',exact=True).click()
            panel=p.locator('.notification-panel')
            box=await panel.bounding_box()
            assert box['y']+box['height']<=430, box
            last=panel.get_by_role('button').last
            await last.focus()
            item=await last.bounding_box()
            assert item['y']>=box['y'] and item['y']+item['height']<=box['y']+box['height'], item
            await p.keyboard.press('Escape')
            await p.get_by_role('button',name='New Customer',exact=True).click()
            modal=p.get_by_role('dialog')
            await expect(modal).to_be_visible()
            await modal.get_by_label('Address',exact=True).focus()
            await modal.get_by_role('button',name='Cancel',exact=True).click()
            await p.locator('.main-content').evaluate('(e)=>e.scrollTop=e.scrollHeight')
            assert (await metrics(p))['main']['scroll']>0
            await c.close()
        await check('Header dropdown, full-viewport modal and viewport-anchored toast', overlays)

        async def resize_and_public():
            c,p=await setup()
            for width,height in [(1024,576),(683,384),(455,256),(390,844),(844,390)]:
                await p.set_viewport_size({'width':width,'height':height})
                await assert_shell(p)
            await p.goto(BASE+'/repairs/new')
            await p.set_viewport_size({'width':390,'height':430})
            await p.get_by_label('Intake Notes',exact=True).focus()
            await assert_shell(p)
            await p.get_by_role('button',name='Collapse sidebar',exact=True).click()
            await p.get_by_role('button',name='Expand sidebar',exact=True).click()
            await p.locator('.main-content').evaluate('(e)=>e.scrollTop=e.scrollHeight')
            assert (await metrics(p))['main']['scroll']>0
            for path in ['/login','/forgot-password','/reset-password','/verify-email','/track']:
                await p.goto(BASE+path)
                await p.set_viewport_size({'width':390,'height':300})
                assert await p.locator('.staff-layout').count()==0
                assert await p.evaluate('document.documentElement.scrollHeight>innerHeight')
                await p.evaluate('scrollTo(0,document.documentElement.scrollHeight)')
                assert await p.evaluate('scrollY>0')
            await c.close()
        await check('Resize/zoom-equivalent viewports, keyboard-height viewport and normal public scrolling', resize_and_public)

        async def printing():
            c,p=await setup()
            await p.emulate_media(media='print')
            assert await p.locator('.main-content').evaluate('(e)=>e.scrollHeight<=e.clientHeight+1')
            for table in await p.locator('.report-table-wrapper').all():
                assert await table.evaluate('(e)=>e.scrollHeight<=e.clientHeight+1')
            await p.pdf(path=str(OUT/'report-print.pdf'),format='A4',print_background=True)
            text=subprocess.check_output(['pdftotext',str(OUT/'report-print.pdf'),'-'],text=True)
            assert 'Detailed Repair Records' in text and 'LOCAL-REPORT-040' in text
            await c.close()
        await check('Print media and PDF include report bottom and final table row', printing)
        await browser.close()
    (OUT/'layout-results.json').write_text(json.dumps(results,indent=2))
    if not all(result['passed'] for result in results):
        raise SystemExit(1)

if __name__=='__main__':
    asyncio.run(main())
