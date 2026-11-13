"""Revised backend contract fixtures; no production requests or records."""
import asyncio, json, os
from pathlib import Path
from urllib.parse import urlparse
from playwright.async_api import async_playwright, expect
from verify_application import USER, CUSTOMER, REPAIR

BASE=os.environ.get('CELLBANK_TEST_URL','http://localhost:5173')
OUT=Path(os.environ.get('CELLBANK_TEST_OUTPUT','/tmp/cellbank-access-tests'));OUT.mkdir(parents=True,exist_ok=True)

async def main():
    async with async_playwright() as pw:
        browser=await pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
        async def setup(roles,assigned=2,denied=None,width=1366,theme='light'):
            c=await browser.new_context(viewport={'width':width,'height':900},color_scheme=theme)
            calls=[]
            user={**USER,'roles':roles}
            rows=[dict(id=i,name=f'Local Staff {i}',activeRepairs=0,totalRepairs=2,repairsRegistered=0,paymentsRecorded=1,repairsReleased=0,profileImageUrl=f'/api/staff/{i}/profile-image') for i in [1,2]]
            async def route(r):
                nonlocal assigned
                path=urlparse(r.request.url).path
                if not path.startswith('/api/'): await r.continue_();return
                calls.append(path)
                data={};status=200
                if denied and path==denied[0]:status,data=denied[1],{'message':'Isolated failure'}
                elif path=='/api/auth/me':data=user
                elif path=='/api/auth/csrf':data={'headerName':'X-CSRF-TEST','token':'local-only'}
                elif path=='/api/repairs/1/assignment':
                    assigned=r.request.post_data_json['assignedTechnicianId']
                    data={**REPAIR,'assignedTechnicianId':assigned}
                elif path=='/api/customers':data=[CUSTOMER]
                elif path=='/api/customers/1':data=CUSTOMER
                elif path=='/api/repairs/1':data={**REPAIR,'assignedTechnicianId':assigned}
                elif path=='/api/repairs/technicians':data=[{'id':1,'name':'Local Staff 1','active':True},{'id':2,'name':'Local Staff 2','active':True}]
                elif path.endswith('/profile-image'):status,data=403,{}
                elif path=='/api/dashboard':data=dict(technicianOnly=roles==['TECHNICIAN'],summary=dict(totalRepairs=4,activeRepairs=2,readyForRelease=0,completedRepairs=2),statusCounts={},attentionRepairs=[],technicianWorkload=rows,recentActiveRepairs=[],financialSnapshot=dict(totalAgreedValue=0,totalCollected=0,outstandingBalance=0),frontDeskActivity=rows,activityDate='2026-11-13')
                elif path=='/api/technicians':data=[{**row,'status':'ACTIVE'} for row in rows]
                elif path.endswith('/context'):data={'device':{}}
                elif path.startswith('/api/repairs/1/'):data=[]
                elif path=='/api/notifications':data={'notifications':[],'unreadCount':0}
                else:status=404
                await r.fulfill(status=status,content_type='application/json',body=json.dumps(data))
            await c.route('**/api/**',route)
            p=await c.new_page();p.set_default_timeout(10000)
            return c,p,calls
        for roles in [['ADMIN'],['FRONT_DESK'],['TECHNICIAN'],['FRONT_DESK','TECHNICIAN']]:
            for assigned in [1,2]:
                technical='ADMIN' in roles or ('TECHNICIAN' in roles and assigned==1)
                forbidden=roles==['TECHNICIAN'] and assigned!=1
                c,p,calls=await setup(roles,assigned,('/api/repairs/1',403) if forbidden else None)
                await p.goto(BASE+'/repairs/1')
                if forbidden:
                    await expect(p.get_by_text('Access restricted',exact=True)).to_be_visible()
                    assert await p.get_by_role('button',name='Try Again',exact=True).count()==0
                else:
                    await expect(p.get_by_role('heading',name='Repair Overview',exact=True)).to_be_visible()
                    assert await p.get_by_role('button',name='Findings',exact=True).count()==int(technical)
                    assert ('/api/repairs/1/findings' in calls)==technical
                    if not technical: assert not any('/ai/' in path for path in calls)
                    await p.get_by_role('button',name='Parts & Costs',exact=True).click()
                await c.close()
        for status in [403,500]:
            c,p,calls=await setup(['FRONT_DESK','TECHNICIAN'],1,('/api/repairs/1/findings',status))
            await p.goto(BASE+'/repairs/1')
            await expect(p.get_by_role('heading',name='Repair Overview',exact=True)).to_be_visible()
            if status==500: await expect(p.get_by_role('button',name='Retry findings')).to_be_visible()
            else: assert await p.get_by_role('button',name='AI Troubleshooting',exact=True).count()==0
            await c.close()
        c,p,calls=await setup(['FRONT_DESK','TECHNICIAN'],1)
        await p.goto(BASE+'/repairs/1')
        await expect(p.get_by_role('button',name='Findings',exact=True)).to_be_visible()
        await p.get_by_role('button',name='Change Technician',exact=True).click()
        await p.locator('#workspace-technician').select_option('2')
        await p.get_by_role('button',name='Save Assignment',exact=True).click()
        await expect(p.get_by_role('button',name='Findings',exact=True)).to_have_count(0)
        await expect(p.get_by_role('heading',name='Repair Overview',exact=True)).to_be_visible()
        await c.close()
        for status in [403,404]:
            c,p,calls=await setup(['TECHNICIAN'],1,('/api/repairs/1',status))
            await p.goto(BASE+'/repairs/1')
            await expect(p.get_by_role('link',name='Back to repairs')).to_be_visible()
            assert await p.get_by_role('button',name='Try Again',exact=True).count()==0
            await c.close()
        c,p,calls=await setup(['TECHNICIAN'],1)
        await p.goto(BASE+'/technicians/2')
        await expect(p.get_by_role('heading',name='Access restricted')).to_be_visible()
        assert '/api/technicians/2' not in calls
        await c.close()
        for roles in [['ADMIN'],['FRONT_DESK'],['TECHNICIAN'],['FRONT_DESK','TECHNICIAN']]:
            for theme in ['light','dark']:
                c,p,calls=await setup(roles,width=375,theme=theme)
                await p.goto(BASE+'/dashboard')
                admin='ADMIN' in roles
                await expect(p.get_by_role('status',name='Loading dashboard')).to_have_count(0)
                await expect(p.get_by_role('region',name='Repair summary',exact=True)).to_be_visible()
                assert await p.get_by_role('heading',name='Technician Workload' if admin else 'Your Workload',exact=True).count()==int(admin or 'TECHNICIAN' in roles)
                assert await p.get_by_role('heading',name='Front Desk Activity' if admin else 'Your Front Desk Activity',exact=True).count()==int(admin or 'FRONT_DESK' in roles)
                await expect(p.locator('.dashboard-technician-avatar img')).to_have_count(0)
                assert await p.evaluate('document.documentElement.scrollWidth<=innerWidth')
                assert not any('/auth/me/profile-image' in path for path in calls)
                assert calls.count('/api/staff/1/profile-image')<=2
                if not admin: assert await p.get_by_text('Local Staff 2',exact=True).count()==0
                await p.screenshot(path=str(OUT/f'dashboard-{theme}-{"-".join(roles)}.png'))
                await p.goto(BASE+'/technicians')
                await expect(p.get_by_role('button',name='Open technician Local Staff 1')).to_be_visible()
                assert await p.get_by_role('button',name='Open technician Local Staff 2').count()==int(admin or 'FRONT_DESK' in roles)
                await c.close()
        for theme in ['light','dark']:
            c,p,calls=await setup(['ADMIN'],theme=theme)
            async def photo(r):
                await r.fulfill(content_type='image/svg+xml',body='<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34"><rect width="34" height="34" fill="#777"/></svg>')
            await c.route('**/api/staff/*/profile-image',photo)
            await p.goto(BASE+'/dashboard')
            await expect(p.get_by_role('region',name='Repair summary',exact=True)).to_be_visible()
            await expect(p.locator('.dashboard-technician-avatar img')).to_have_count(4)
            await p.wait_for_function("[...document.querySelectorAll('.dashboard-technician-avatar img')].every(e=>e.complete && e.naturalWidth>0)")
            await expect(p.get_by_text('Activity on 2026-11-13 (Philippine time).',exact=True)).to_be_visible()
            await p.locator('.dashboard-side-column').screenshot(path=str(OUT/f'staff-panels-{theme}.png'))
            await p.set_viewport_size({'width':375,'height':900})
            await p.locator('.dashboard-side-column').screenshot(path=str(OUT/f'staff-panels-mobile-{theme}.png'))
            assert await p.evaluate('document.documentElement.scrollWidth<=innerWidth')
            await c.close()
        c,p,calls=await setup(['FRONT_DESK','TECHNICIAN'],1,('/api/repairs/1/ai/messages',403))
        await p.goto(BASE+'/repairs/1')
        await expect(p.get_by_role('heading',name='Repair Overview',exact=True)).to_be_visible()
        await expect(p.get_by_role('button',name='AI Troubleshooting',exact=True)).to_have_count(0)
        await expect(p.get_by_role('button',name='Change Technician',exact=True)).to_be_visible()
        await c.close()
        c,p,calls=await setup(['TECHNICIAN'],1)
        release=asyncio.Event()
        started=asyncio.Event()
        async def delayed(r):
            started.set()
            await release.wait()
            try: await r.fulfill(content_type='application/json',body='[]')
            except Exception: pass  # Navigation may have already aborted this request.
        await c.route('**/api/repairs/1/findings',delayed)
        await p.goto(BASE+'/repairs/1')
        await started.wait()
        await p.get_by_role('button',name='Technicians',exact=True).click()
        release.set()
        await expect(p.get_by_role('button',name='Open technician Local Staff 1')).to_be_visible()
        assert await p.get_by_role('heading',name='Repair Overview',exact=True).count()==0
        await c.close()
        await browser.close()
        print('PASS role/assignment matrix, findings 403/500 isolation, dashboard roles, missing photo fallback, directory access and mobile themes')
asyncio.run(main())
