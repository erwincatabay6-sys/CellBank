"""Tracking/email/dashboard/report checks using isolated API responses; no emails sent."""
import asyncio, json, os
from urllib.parse import urlparse, unquote
from playwright.async_api import async_playwright, expect
from verify_application import USER, CUSTOMER, REPAIR
BASE=os.environ.get('CELLBANK_TEST_URL','http://localhost:5173')

async def main():
 async with async_playwright() as pw:
  browser=await pw.chromium.launch(executable_path='/usr/bin/chromium',args=['--no-sandbox'])
  async def setup(roles=None, email='test@example.test', theme='light', width=1440):
   c=await browser.new_context(viewport={'width':width,'height':950},color_scheme=theme)
   state={'status':200,'resend':204,'rows':3,'delay':False};calls=[]
   async def route(r):
    path=unquote(urlparse(r.request.url).path)
    if not path.startswith('/api/'): await r.continue_();return
    calls.append((r.request.method,path,r.request.post_data))
    data={};status=200;headers={}
    if path=='/api/auth/me': status,data=(200,{**USER,'roles':roles}) if roles else (401,{})
    elif path=='/api/auth/csrf': data={'headerName':'X-CSRF-TEST','token':'isolated'}
    elif path=='/api/notifications':data={'items':[],'unreadCount':0}
    elif path.startswith('/api/tracking/'):
     if state['delay']:await asyncio.sleep(0.6)
     status=state['status'];code=path.split('/')[-1]
     data={'trackingCode':code,'device':'Isolated device','status':'RECEIVED','receivedAt':'2026-11-01T00:00:00Z','lastUpdated':'2026-11-01T00:00:00Z','statusHistory':[]} if status==200 else {'retryAfterSeconds':3,'message':'Isolated failure'}
     if status==429:headers={'Retry-After':'3'}
    elif path.endswith('/tracking-email'):
     assert r.request.method=='POST' and r.request.post_data is None
     assert r.request.headers.get('x-csrf-test')=='isolated'
     status=state['resend'];data={'message':'Isolated failure'}
     if status==429:headers={'Retry-After':'3'}
     if status==0:await r.abort('failed');return
    elif path=='/api/customers':data=[{**CUSTOMER,'email':email}]
    elif path=='/api/customers/1':data={**CUSTOMER,'email':email}
    elif path in ['/api/repairs/1','/api/repairs/2']:data={**REPAIR,'id':int(path[-1]),'trackingCode':'K7MP-4X9R'}
    elif path=='/api/repairs/technicians':data=[]
    elif path.startswith('/api/repairs/'):data=[]
    elif path=='/api/dashboard':
     rows=[dict(id=i,name='Long local staff name that may wrap '+str(i),activeRepairs=0,totalRepairs=2,repairsRegistered=0,paymentsRecorded=1,repairsReleased=0) for i in range(state['rows'])]
     data=dict(technicianOnly=False,summary={},statusCounts={},attentionRepairs=[],recentActiveRepairs=[],technicianWorkload=rows,frontDeskActivity=rows,activityDate='2026-11-14',financialSnapshot=dict(totalAgreedValue=0,totalCollected=0,outstandingBalance=0))
    elif path=='/api/reports':
     data=dict(repairSummary={},financialSummary={},statusCounts={},repairVolume=[],paymentTrend=[],technicianActivity=[],repairRecords=[],financialRecords=[dict(id=i,reference='LOCAL-'+str(i),customer='Local',agreedPrice=None if i==0 else 100,totalPaid=0,balance=100,paymentStatus=s) for i,s in enumerate(['Price Not Agreed','Unpaid','Partially Paid','Paid'])])
    else:status=404
    await r.fulfill(status=status,headers=headers,content_type='application/json',body='' if status==204 else json.dumps(data))
   await c.route('**/api/**',route)
   p=await c.new_page();p.set_default_timeout(10000);p.on('pageerror',lambda e: print('PAGEERROR',str(e),flush=True))
   return c,p,state,calls
  c,p,s,calls=await setup()
  await p.goto(BASE+'/track');await expect(p.locator('#tracking-code')).to_have_value('');assert not any('/api/tracking/' in x[1] for x in calls)
  await p.goto(BASE+'/track?code=k7mp4x9r');await expect(p.get_by_text('Isolated device')).to_be_visible()
  assert sum('/api/tracking/' in x[1] for x in calls)==1
  for code in ['k7mp-4x9r','k7mp4x9r','aB_-'*10+'xYz']:
   await p.get_by_role('button',name='Track Another Repair').click();await p.locator('#tracking-code').fill(code);await p.get_by_role('button',name='Check Status').click();await expect(p.get_by_text('Isolated device')).to_be_visible()
  assert any(x[1].endswith('aB_-'*10+'xYz') for x in calls)
  await p.get_by_role('button',name='Track Another Repair').click();await p.locator('#tracking-code').fill('bad');await p.get_by_role('button',name='Check Status').click();await expect(p.locator('#tracking-code')).to_have_attribute('aria-invalid','true');await expect(p.locator('.feedback-toast')).to_have_count(1)
  await p.locator('#tracking-code').fill('K7MP4X9R');s['status']=404;await p.get_by_role('button',name='Check Status').click();await expect(p.locator('#tracking-error')).to_contain_text('Repair not found')
  s['status']=429;await p.get_by_role('button',name='Check Status').click();await expect(p.get_by_role('button',name='Check Status')).to_be_disabled();await p.wait_for_timeout(3300);await expect(p.get_by_role('button',name='Check Status')).to_be_enabled()
  s['status']=200;s['delay']=True;await p.get_by_role('button',name='Check Status').click();await p.locator('#tracking-code').fill('2ABC3DEF');await p.wait_for_timeout(800);await expect(p.get_by_text('Isolated device')).to_have_count(0)
  await c.close();print('PASS public auto/manual/legacy/invalid/404/429 and stale lookup',flush=True)
  for roles in [['ADMIN'],['FRONT_DESK'],['FRONT_DESK','TECHNICIAN'],['TECHNICIAN']]:
   c,p,s,calls=await setup(roles)
   await p.goto(BASE+'/repairs/1');await expect(p.get_by_label('Copy repair tracking code')).to_be_visible()
   button=p.get_by_role('button',name='Resend tracking email',exact=True)
   if roles==['TECHNICIAN']:await expect(button).to_have_count(0)
   else:
    await button.click();await expect(p.get_by_role('button',name='Resend in 60s')).to_be_disabled();await expect(p.locator('.feedback-toast')).to_contain_text('Tracking email sent.')
    await p.evaluate("history.pushState({}, '', '/repairs/2'); dispatchEvent(new PopStateEvent('popstate'))")
    await expect(p.get_by_role('button',name='Resend tracking email',exact=True)).to_be_enabled()
    await p.evaluate("history.pushState({}, '', '/repairs/1'); dispatchEvent(new PopStateEvent('popstate'))")
    await expect(p.get_by_role('button',name='Resend in',exact=False)).to_be_disabled()
   await c.close()
  for status in [400,403,404,429,503,0]:
   c,p,s,calls=await setup(['ADMIN']);s['resend']=status
   await p.goto(BASE+'/repairs/1');await p.get_by_role('button',name='Resend tracking email',exact=True).click();await expect(p.locator('.feedback-toast')).to_have_count(1)
   if status in [503,0]:await expect(p.locator('.feedback-toast')).to_contain_text('Check the inbox');await expect(p.get_by_role('button',name='Resend in 60s')).to_be_disabled()
   if status==429:await expect(p.get_by_role('button',name='Resend in 3s')).to_be_disabled();await p.wait_for_timeout(3300);await expect(p.get_by_role('button',name='Resend tracking email',exact=True)).to_be_enabled()
   assert sum(x[0]=='POST' for x in calls)==1
   await c.close()
  c,p,s,calls=await setup(['ADMIN'],email=None);await p.goto(BASE+'/repairs/1');await expect(p.get_by_role('button',name='Resend tracking email',exact=True)).to_be_disabled();await expect(p.get_by_role('link',name='Add a customer email')).to_be_visible();await c.close()
  print('PASS resend role matrix, no-body CSRF POST, missing email, success/errors and cooldowns',flush=True)
  for theme in ['light','dark']:
   for width in [1440,375]:
    c,p,s,calls=await setup(['ADMIN'],theme=theme,width=width)
    for count in [0,1,2,4]:
     s['rows']=count;await p.goto(BASE+'/dashboard')
     if not count:await expect(p.get_by_text('No technician workload available')).to_be_visible();continue
     lists=p.locator('.dashboard-staff-list');await expect(lists).to_have_count(2)
     for l in await lists.all():
      await expect(l.locator(':scope > div')).to_have_count(count);await p.wait_for_timeout(150)
      assert await l.evaluate('(e)=>e.scrollHeight>e.clientHeight+1') == (count>2)
      if count>2:
       assert await l.evaluate('(e)=>e.children[1].getBoundingClientRect().bottom<=e.getBoundingClientRect().bottom+1')
       await l.focus();await p.keyboard.press('End');await p.wait_for_timeout(300);assert await l.evaluate('(e)=>e.scrollTop')>0
    await p.screenshot(path=f'/tmp/tracking-dashboard-{theme}-{width}.png')
    await p.goto(BASE+'/reports');await expect(p.locator('.financial-status svg[aria-hidden="true"]')).to_have_count(4)
    await p.goto(BASE+'/repairs/1');await expect(p.get_by_role('button',name='Resend tracking email',exact=True)).to_be_visible();await p.screenshot(path=f'/tmp/tracking-resend-{theme}-{width}.png');assert await p.evaluate('document.documentElement.scrollWidth<=innerWidth')
    await c.close()
  print('PASS staff counts 0/1/2/4, wrapped rows, keyboard scrolling, four payment icons and both-theme mobile layout',flush=True)
  await browser.close()
asyncio.run(main())
