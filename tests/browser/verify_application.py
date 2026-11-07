"""Actual routes with browser-intercepted API responses; never contacts a backend."""
import asyncio, json, os, traceback
from pathlib import Path
from urllib.parse import urlparse
from playwright.async_api import async_playwright, expect

BASE = os.environ.get('CELLBANK_TEST_URL', 'http://localhost:5173')
OUT = Path(os.environ.get('CELLBANK_TEST_OUTPUT', '/tmp/cellbank-feedback-tests'))
OUT.mkdir(parents=True, exist_ok=True)
USER = dict(id=1, name='Local Test Admin', username='local-admin', email='local@example.test', roles=['ADMIN'], emailVerified=True)
DEVICE = dict(id=1, brand='Local', model='Test phone', deviceType='PHONE')
CUSTOMER = dict(id=1, name='Local Test Customer', phone='09999999999', email=None, devices=[DEVICE])
REPAIR = dict(id=1, customerId=1, deviceId=1, repairReference='CB-TEST-1', trackingCode='EXACT-TRACKING-CODE-123456', status='IN_PROGRESS', updatedAt='2026-11-07T00:00:00Z', createdAt='2026-11-06T00:00:00Z', createdById=1, problemCategory='DISPLAY', reportedProblem='Local visual test only', serviceType='HARDWARE_REPAIR', agreedPrice='1000.00', estimatedCost='500.00')
results=[]

async def main():
    async with async_playwright() as pw:
        browser=await pw.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'), args=['--no-sandbox'])
        async def setup(path, width=1440, theme='light', user=USER, overrides=None, clipboard=None):
            c=await browser.new_context(viewport={'width':width,'height':1000}, permissions=['clipboard-read','clipboard-write'])
            await c.add_init_script(f'localStorage.setItem("cellbank-theme", "{theme}")')
            if clipboard:
                await c.add_init_script(clipboard)
            calls=[]
            async def route(r):
                path=urlparse(r.request.url).path; method=r.request.method
                if not path.startswith('/api/'):
                    await r.continue_();return
                calls.append((method,path))
                if overrides and (method,path) in overrides:
                    response=overrides[(method,path)]
                    if callable(response): await response(r);return
                    status,data=response
                elif path=='/api/auth/me':status,data=(200,user) if user else (401,{'message':'Signed out'})
                elif path=='/api/auth/csrf':status,data=200,dict(headerName='X-CSRF-TEST',token='isolated-test')
                elif path=='/api/notifications':status,data=200,dict(items=[],unreadCount=0)
                elif path=='/api/customers':status,data=200,[CUSTOMER]
                elif path=='/api/customers/1':status,data=200,CUSTOMER
                elif path=='/api/repairs/1':status,data=200,REPAIR
                elif path=='/api/repairs/technicians':status,data=200,[]
                elif path in ['/api/repairs/1/status-history','/api/repairs/1/findings','/api/repairs/1/payments','/api/repairs/1/parts']:status,data=200,[]
                else:status,data=500,{'message':'Isolated test: unconfigured endpoint'}
                await r.fulfill(status=status,content_type='application/json',body=json.dumps(data) if status!=204 else '')
            await c.route('**/api/**',route)
            p=await c.new_page();p.set_default_timeout(8000)
            p.on('pageerror',lambda error:results.append({'check':'Unexpected browser exception','passed':False,'error':str(error)}))
            await p.goto(BASE+path)
            return c,p,calls
        async def check(name,fn):
            if os.environ.get('CELLBANK_TEST_FILTER') and os.environ['CELLBANK_TEST_FILTER'] not in name:return
            try:
                await fn();results.append({'check':name,'passed':True});print('PASS',name,flush=True)
            except Exception:
                results.append({'check':name,'passed':False,'error':traceback.format_exc()});print('FAIL',name,traceback.format_exc(),flush=True)
        async def login():
            c,p,calls=await setup('/login',user=None,overrides={('POST','/api/auth/login'):(400,{'message':'Isolated invalid credentials'})})
            await p.locator('#login-identifier').fill('local-test');await p.locator('#login-password').fill('local-test-password')
            for _ in range(2):
                await p.get_by_role('button',name='Login',exact=True).click()
                await expect(p.locator('.feedback-toast').last).to_contain_text('Unable to complete sign-in. Please try again.')
            await expect(p.locator('.feedback-toast')).to_have_count(2)
            await expect(p.locator('main .feedback-notice')).to_have_count(0)
            for _ in range(2):await p.locator('.feedback-toast').first.get_by_role('button').click()
            await expect(p.locator('#login-identifier')).to_have_value('local-test')
            await expect(p.locator('#login-password')).to_have_value('local-test-password')
            await c.close()
        await check('Login errors toast, identical retries appear again, dismissal retains credentials',login)
        async def account():
            c,p,calls=await setup('/account',overrides={('PATCH','/api/auth/me'):(200,{**USER,'name':'Updated Local Admin'}),('POST','/api/auth/change-password'):(204,None)})
            await p.locator('#account-full-name').fill('Updated Local Admin')
            await p.get_by_role('button',name='Save Full Name',exact=True).click()
            await expect(p.locator('.feedback-toast')).to_contain_text('Profile updated')
            await p.locator('.feedback-toast').get_by_role('button').click()
            await expect(p.locator('#account-full-name')).to_have_value('Updated Local Admin')
            await p.locator('#current-password').fill('old-local-password')
            await p.locator('#new-password').fill('new-local-password')
            await p.locator('#confirm-password').fill('wrong-local-password')
            await p.get_by_role('button',name='Change Password',exact=True).click()
            await expect(p.locator('#confirm-password-feedback')).to_be_visible()
            assert await p.locator('#confirm-password').get_attribute('aria-invalid')=='true'
            assert await p.locator('.feedback-toast').count()==0
            await p.locator('#confirm-password').fill('new-local-password')
            await p.get_by_role('button',name='Change Password',exact=True).click()
            await expect(p).to_have_url(BASE+'/login')
            await expect(p.locator('.feedback-toast')).to_contain_text('Password changed')
            assert await p.get_by_text('Your password was changed successfully. Please sign in again.',exact=True).count()==1
            await c.close()
        await check('Profile save and password field validation; password confirmation survives real navigation',account)
        async def clipboard():
            for theme,width in [('light',1440),('dark',1440),('light',375),('dark',375)]:
                c,p,calls=await setup('/repairs/1',width,theme)
                code=p.get_by_role('textbox',name='Repair tracking code',exact=True)
                copy=p.get_by_role('button',name='Copy repair tracking code',exact=True)
                await expect(code).to_have_value(REPAIR['trackingCode'])
                await copy.focus();await copy.press('Enter')
                await expect(p.locator('.feedback-toast')).to_contain_text('Copied')
                assert await p.evaluate('navigator.clipboard.readText()')==REPAIR['trackingCode']
                a,b=await code.bounding_box(),await copy.bounding_box();assert b['x']>=a['x']+a['width']-1
                assert await p.evaluate('document.documentElement.scrollWidth<=innerWidth')
                await p.screenshot(path=str(OUT/f'workspace-copy-{theme}-{width}.png'),full_page=True)
                await c.close()
            for script in ["Object.defineProperty(navigator,'clipboard',{value:{writeText:()=>Promise.reject(new Error('denied'))}})","Object.defineProperty(navigator,'clipboard',{value:undefined})"]:
                c,p,_=await setup('/repairs/1',clipboard=script)
                await p.get_by_role('button',name='Copy repair tracking code',exact=True).click()
                await expect(p.get_by_text('Could not copy automatically. Select the tracking code and copy it manually.',exact=True)).to_be_visible()
                assert await p.locator('.feedback-toast').count()==0
                code=p.get_by_role('textbox',name='Repair tracking code');await code.focus();await code.press('Control+a')
                assert await code.evaluate('(e)=>e.value.slice(e.selectionStart,e.selectionEnd)')==REPAIR['trackingCode']
                await c.close()
            c,p,_=await setup('/repairs/1',overrides={('GET','/api/repairs/1'):(200,{**REPAIR,'trackingCode':None})})
            await expect(p.get_by_role('heading',name='Repair Overview')).to_be_visible()
            assert await p.get_by_role('button',name='Copy repair tracking code',exact=True).count()==0
            await c.close()
        await check('Real clipboard success, rejection/unavailability fallback, missing code, keyboard and both-theme mobile layout',clipboard)
        async def customer():
            async def lost_response(route):
                await route.abort('failed')
            for mode in ['general','uncertain','field','success']:
                response=(400,{'message':'Local save rejected'}) if mode=='general' else lost_response if mode=='uncertain' else (400,{'message':'Check details','errors':{'phone':'Local phone validation'}}) if mode=='field' else (200,{**CUSTOMER,'id':2,'name':'Unsaved Local Customer'})
                c,p,calls=await setup('/customers',overrides={('POST','/api/customers'):response})
                await p.get_by_role('button',name='New Customer').click()
                await p.locator('#customer-name').fill('Unsaved Local Customer');await p.locator('#customer-phone').fill('09999999999')
                save=p.get_by_role('button',name='Register Customer',exact=True);await save.click()
                if mode=='general':
                    await expect(p.locator('.feedback-toast')).to_contain_text('Local save rejected')
                    await p.locator('.feedback-toast').get_by_role('button').click()
                    await expect(p.locator('#customer-name')).to_have_value('Unsaved Local Customer');await expect(save).to_be_enabled()
                elif mode=='uncertain':
                    card=p.locator('[role=dialog] .feedback-notice');await expect(card).to_contain_text('may have completed')
                    assert await card.locator('.feedback-dismiss').count()==0
                    await expect(save).to_be_disabled()
                    assert calls.count(('POST','/api/customers'))==1
                elif mode=='field':
                    await expect(p.locator('#customer-phone-error')).to_have_text('Local phone validation')
                    assert await p.locator('#customer-phone').get_attribute('aria-describedby')=='customer-phone-error'
                    assert await p.locator('.feedback-toast').count()==0
                else:
                    await expect(p.locator('[role=dialog]')).to_have_count(0)
                    await expect(p.locator('.feedback-toast')).to_contain_text('Customer registered')
                    await expect(p.get_by_text('Unsaved Local Customer',exact=True)).to_be_visible()
                await c.close()
        await check('Customer modal errors, unchanged form values, field associations and uncertain-save lock',customer)
        async def payment():
            c,p,calls=await setup('/repairs/1',overrides={('POST','/api/repairs/1/payments'):(200,{})})
            await p.get_by_role('button',name='Payments',exact=True).click()
            await p.get_by_role('button',name='Record Payment',exact=True).click()
            await p.locator('#payment-amount').fill('1001')
            await p.locator('.payment-form').get_by_role('button',name='Record Payment',exact=True).click()
            await expect(p.locator('#payment-amount-feedback')).to_contain_text('cannot exceed')
            assert calls.count(('POST','/api/repairs/1/payments'))==0
            await p.locator('#payment-amount').fill('100')
            await p.locator('.payment-form').get_by_role('button',name='Record Payment',exact=True).click()
            await expect(p.get_by_text('The payment save could not be confirmed. Reload the page and check payment history before trying again.',exact=True)).to_be_visible()
            await expect(p.locator('#payment-amount')).to_be_disabled()
            assert await p.locator('.feedback-warning .feedback-dismiss').count()==0
            assert calls.count(('POST','/api/repairs/1/payments'))==1
            await c.close()
        await check('Payment field validation and uncertain-result submission safeguards',payment)
        async def conflict():
            c,p,calls=await setup('/repairs/1',overrides={('POST','/api/repairs/1/findings'):(409,{'message':'Local conflict'})})
            await p.get_by_role('button',name='Findings',exact=True).click()
            await p.get_by_role('button',name='Add Finding',exact=True).click()
            await p.locator('#finding').fill('Local finding draft')
            await p.get_by_role('button',name='Save Finding',exact=True).click()
            card=p.locator('.feedback-notice').filter(has_text='This repair changed or is already closed.')
            await expect(card).to_be_visible()
            assert await card.locator('.feedback-dismiss').count()==0
            assert await p.locator('.feedback-toast').count()==0
            await expect(p.get_by_role('button',name='Save Finding',exact=True)).to_be_disabled()
            await expect(p.locator('#finding')).to_have_value('Local finding draft')
            await c.close()
        await check('Conflict recovery stays inline with disabled controls and retained draft',conflict)
        async def blocking():
            hold={'enabled':False}
            release=asyncio.Event()
            async def unavailable(route):
                if hold['enabled']:await release.wait()
                await route.fulfill(status=503,content_type='application/json',body=json.dumps({'message':'Local records unavailable'}))
            c,p,calls=await setup('/customers',375,'dark',overrides={('GET','/api/customers'):unavailable})
            card=p.locator('main .feedback-notice');await expect(card).to_contain_text('Local records unavailable')
            assert await card.locator('.feedback-dismiss').count()==0
            button=card.get_by_role('button');a,b=await card.locator('.feedback-notice-content').bounding_box(),await button.bounding_box()
            assert abs(a['x']-b['x'])<2 and b['y']>=a['y']+a['height']
            before=calls.count(('GET','/api/customers'));hold['enabled']=True;await button.click()
            await expect(p.get_by_role('status',name='Loading customers')).to_be_visible()
            await expect(p.get_by_role('button',name='Try Again')).to_have_count(0)
            await expect(p.get_by_role('button',name='New Customer')).to_be_disabled()
            release.set()
            await expect(card).to_contain_text('Local records unavailable')
            assert calls.count(('GET','/api/customers'))>before
            await p.screenshot(path=str(OUT/'customer-retry-dark-mobile.png'),full_page=True)
            await c.close()
        await check('Blocking load error stays inline; Retry alignment and actual retry request',blocking)
        async def roles():
            for role,canpay,canfind in [('TECHNICIAN',False,True),('FRONT_DESK',True,False)]:
                c,p,_=await setup('/repairs/1',user={**USER,'roles':[role]})
                await expect(p.get_by_role('heading',name='Repair Overview')).to_be_visible()
                assert bool(await p.get_by_role('button',name='Findings',exact=True).count())==canfind
                await p.get_by_role('button',name='Payments',exact=True).click()
                assert bool(await p.get_by_role('button',name='Record Payment',exact=True).count())==canpay
                await c.close()
        await check('Technician/front-desk repair controls retain role visibility',roles)
        await browser.close()
    (OUT/'application-results.json').write_text(json.dumps(results,indent=2))
    if not all(r['passed'] for r in results):raise SystemExit(1)

if __name__=='__main__':asyncio.run(main())
