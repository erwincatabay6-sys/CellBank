"""Viewport-bounded repair tables and combined-role dashboard, with isolated APIs."""
import asyncio, json, os
from pathlib import Path
from urllib.parse import urlparse
from playwright.async_api import async_playwright, expect
from verify_application import USER, CUSTOMER, REPAIR

BASE=os.environ.get('CELLBANK_TEST_URL','http://localhost:5173')
OUT=Path(os.environ.get('CELLBANK_TEST_OUTPUT','/tmp/cellbank-dashboard-space'));OUT.mkdir(parents=True,exist_ok=True)

async def main():
    async with async_playwright() as pw:
        browser=await pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
        for theme in ['light','dark']:
            c=await browser.new_context(viewport={'width':1905,'height':1000},color_scheme=theme)
            errors=[]
            state={'fail':False,'empty':False,'attention':False}
            records=[{**REPAIR,'id':i,'repairReference':f'LOCAL-{i:03}','updatedAt':f'2026-11-{i:02}T00:00:00Z','assignedTechnicianName':'Local technician'} for i in range(1,22)]
            records += [{**REPAIR,'id':22,'status':'COMPLETED'}, {**REPAIR,'id':23,'status':'CANCELLED'}]
            async def route(r):
                path=urlparse(r.request.url).path
                if not path.startswith('/api/'): await r.continue_();return
                data={};status=200
                if path=='/api/auth/me':data={**USER,'roles':['FRONT_DESK','TECHNICIAN']}
                elif path=='/api/customers':data=[CUSTOMER]
                elif path=='/api/repairs':
                    status=503 if state['fail'] else 200
                    data={'message':'Isolated failure'} if state['fail'] else ([] if state['empty'] else records)
                elif path=='/api/repairs/technicians':data=[]
                elif path=='/api/notifications':data={'notifications':[],'unreadCount':0}
                elif path=='/api/dashboard':data=dict(technicianOnly=False,summary=dict(totalRepairs=21,activeRepairs=21,readyForRelease=0,completedRepairs=0),statusCounts={},attentionRepairs=([dict(id=i,reference=f'ATTENTION-{i}',customer='Local customer',device='Local phone',technician='Local technician',status='AWAITING_APPROVAL') for i in range(10)] if state['attention'] else []),recentActiveRepairs=[dict(id=i,reference=f'LOCAL-{i:03}',customer='Local customer',device='Local phone',technician='Local technician',status='IN_PROGRESS') for i in range(1,6)],technicianWorkload=[dict(id=1,name='Local Person',activeRepairs=4,totalRepairs=9)],frontDeskActivity=[dict(id=1,name='Local Person',repairsRegistered=0,paymentsRecorded=2,repairsReleased=1)],activityDate='2026-11-13')
                else:status=404
                await r.fulfill(status=status,content_type='application/json',body=json.dumps(data))
            await c.route('**/api/**',route)
            p=await c.new_page();p.on('pageerror',lambda e: errors.append(str(e)))
            for path,selector in [('/repairs','.repair-table-wrapper')]:
                await p.goto(BASE+path)
                await expect(p.locator(selector+' tbody tr')).to_have_count(23 if path=='/repairs' else 21)
                for width,height in [(1905,1000),(1366,768),(1366,900),(375,812),(844,390)]:
                    await p.set_viewport_size({'width':width,'height':height})
                    await p.wait_for_timeout(350)
                    await p.locator('.main-content').evaluate('(e)=>e.scrollTop=0')
                    assert await p.evaluate('document.documentElement.scrollWidth<=innerWidth')
                    region=p.locator(selector)
                    box=await region.bounding_box()
                    if width>900 and height>700:
                        assert box['y']+box['height']<=height-12,(path,width,height,box)
                        assert box['y']+box['height']>=height-55,(path,width,height,box)
                    assert await region.evaluate('(e)=>e.scrollHeight>e.clientHeight'),(path,width,height,box)
                    before=await p.locator('.sidebar-profile').bounding_box()
                    await region.evaluate('(e)=>e.scrollTop=e.scrollHeight')
                    after=await p.locator('.sidebar-profile').bounding_box()
                    assert abs(after['y']-before['y'])<1,(path,width,height,before,after)
                    await region.locator('button').last.focus()
                    await expect(region.locator('button').last).to_be_focused()
                    await region.evaluate('(e)=>e.scrollTop=0')
                    await p.screenshot(path=str(OUT/f'{path[1:]}-{theme}-{width}-{height}.png'))
            await p.emulate_media(media='print')
            assert await p.locator('.repair-table-wrapper').evaluate('(e)=>e.scrollHeight<=e.clientHeight+1')
            await p.emulate_media(media='screen')
            for width,height in [(1905,1000),(375,812)]:
                await p.set_viewport_size({'width':width,'height':height})
                await p.goto(BASE+'/dashboard')
                await expect(p.get_by_role('heading',name='Your Workload & Activity',exact=True)).to_be_visible()
                assert await p.get_by_role('heading',name='Your Workload',exact=True).count()==0
                assert await p.get_by_text('Local Person',exact=True).count()==1
                assert await p.locator('.dashboard-technician-avatar').count()==1
                await expect(p.locator('.dashboard-personal-section')).to_contain_text('Total assigned9')
                await expect(p.locator('.dashboard-personal-section')).to_contain_text('2026-11-13 (Philippine time)')
                await expect(p.locator('.dashboard-recent-table tbody tr')).to_have_count(5)
                assert await p.evaluate('document.documentElement.scrollWidth<=innerWidth')
                await p.screenshot(path=str(OUT/f'dashboard-{theme}-{width}.png'))
            assert not errors,errors
            await c.close()
        await browser.close()
        print('PASS bounded repair table, resizing/mobile, keyboard/print, combined identity/counts and unchanged five-row dashboard in both themes')
asyncio.run(main())
