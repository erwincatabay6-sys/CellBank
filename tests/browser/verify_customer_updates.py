"""Status/customer updates with mocked APIs only. No backend emails are triggered."""
import asyncio, json, os
from urllib.parse import urlparse
from playwright.async_api import async_playwright, expect
from verify_application import USER, CUSTOMER, REPAIR

BASE = os.environ.get('CELLBANK_TEST_URL', 'http://localhost:5173')
NOTE = 'Staff only: supplier cost\nDo not publish <b>private</b>'
UPDATE = 'Your device is ready.\nPlease bring your receipt. <b>plain text</b>'

async def main():
 async with async_playwright() as pw:
  browser = await pw.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
  for theme in ['light', 'dark']:
   for width in [1440, 375]:
    c = await browser.new_context(viewport={'width':width,'height':950}, color_scheme=theme)
    state = {'repair':dict(REPAIR), 'saved':None, 'fail':False}
    calls = []
    async def route(r):
     path = urlparse(r.request.url).path
     if not path.startswith('/api/'): await r.continue_(); return
     calls.append((r.request.method,path,r.request.post_data))
     status=200; data={}
     if path=='/api/auth/me':data=USER
     elif path=='/api/auth/csrf':data={'headerName':'X-CSRF-TEST','token':'isolated'}
     elif path=='/api/notifications':data={'items':[],'unreadCount':0}
     elif path=='/api/customers':data=[CUSTOMER]
     elif path=='/api/customers/1':data=CUSTOMER
     elif path=='/api/repairs/1':data=state['repair']
     elif path=='/api/repairs/technicians':data=[]
     elif path=='/api/repairs/1/status':
      payload=r.request.post_data_json
      assert payload['expectedUpdatedAt']==state['repair']['updatedAt']
      assert payload['note']==NOTE
      if state['fail']:status=400;data={'errors':{'customerUpdate':'Customer update rejected by test'}}
      else:
       state['saved']=payload
       state['repair']={**state['repair'],'status':payload['status'],'updatedAt':'2026-11-14T12:00:00Z'}
       data=state['repair']
     elif path=='/api/repairs/1/status-history':
      data=[dict(id=1,newStatus='RECEIVED',changedAt='2026-11-01T00:00:00Z',note=' ',customerUpdate=None)]
      if state['saved']:data.append(dict(id=2,newStatus='READY_FOR_RELEASE',changedAt='2026-11-14T12:00:00Z',note=NOTE,customerUpdate=state['saved']['customerUpdate']))
     elif path=='/api/tracking/K7MP-4X9R':
      # Deliberately include a forbidden note key to prove the UI never falls back to it.
      data=dict(trackingCode='K7MP-4X9R',device='Local device',status='READY_FOR_RELEASE',receivedAt='2026-11-01T00:00:00Z',lastUpdated='2026-11-14T12:00:00Z',statusHistory=[dict(status='RECEIVED',changedAt='2026-11-01T00:00:00Z',description='Repair received.',note=NOTE),dict(status='IN_PROGRESS',changedAt='2026-11-02T00:00:00Z',description='Work started.',customerUpdate=' ',note=NOTE),dict(status='READY_FOR_RELEASE',changedAt='2026-11-14T12:00:00Z',description='Ready for collection.',customerUpdate=UPDATE+'\n'+'x'*300,note=NOTE)])
     elif path.startswith('/api/repairs/1/'):data=[]
     else:status=404
     await r.fulfill(status=status,content_type='application/json',body=json.dumps(data))
    await c.route('**/api/**',route)
    p=await c.new_page();errors=[];p.on('pageerror',lambda e:errors.append(str(e)))
    await p.goto(BASE+'/repairs/1')
    await p.get_by_role('button',name='Status History',exact=True).click()
    await p.get_by_role('button',name='Change Status',exact=True).click()
    await p.get_by_label('New Status',exact=True).select_option('READY_FOR_RELEASE')
    note=p.get_by_label('Internal note',exact=True);update=p.get_by_label('Customer update',exact=True)
    await expect(note).to_have_attribute('aria-describedby','status-note-help')
    await expect(update).to_have_attribute('maxlength','2000')
    await note.fill(NOTE)
    await update.evaluate("e=>e.removeAttribute('maxlength')")
    await update.fill('x'*2001)
    await p.get_by_role('button',name='Confirm Status Change').click()
    await expect(update).to_have_attribute('aria-invalid','true')
    assert not any(x[0]=='PATCH' for x in calls)
    await update.fill(UPDATE)
    state['fail']=True
    await p.get_by_role('button',name='Confirm Status Change').click()
    await expect(p.get_by_text('Customer update rejected by test',exact=True)).to_be_visible()
    await expect(note).to_have_value(NOTE);await expect(update).to_have_value(UPDATE)
    assert await p.evaluate('document.documentElement.scrollWidth<=innerWidth')
    await update.scroll_into_view_if_needed()
    await p.screenshot(path=f'/tmp/customer-update-form-{theme}-{width}.png')
    state['fail']=False
    value=UPDATE+'\n'+'x'*(1999-len(UPDATE)) if width==1440 else ('' if theme=='light' else '   ')
    await update.fill(value)
    await p.get_by_role('button',name='Confirm Status Change').click()
    await expect(p.locator('.status-history-item')).to_have_count(2)
    assert state['saved']['customerUpdate']==(value.strip() or None)
    await expect(p.locator('.status-history-text').filter(has_text='Internal note')).to_contain_text(NOTE)
    assert await p.locator('.status-history-text b').count()==0
    if width==1440:await expect(p.locator('.status-history-text').filter(has_text='Customer update')).to_contain_text(UPDATE)
    else:assert await p.locator('.status-history-text').filter(has_text='Customer update').count()==0
    assert not any('/tracking-email' in x[1] for x in calls)
    assert 'Email delivered' not in await p.locator('body').inner_text()
    await p.goto(BASE+'/track?code=K7MP-4X9R')
    await expect(p.locator('.tracking-customer-update')).to_have_count(1)
    await expect(p.locator('.tracking-customer-update')).to_contain_text(UPDATE)
    assert NOTE not in await p.locator('body').inner_text()
    assert await p.locator('.tracking-customer-update b').count()==0
    assert await p.locator('.tracking-customer-update').evaluate("e=>getComputedStyle(e).whiteSpace")=='pre-wrap'
    assert await p.evaluate('document.documentElement.scrollWidth<=innerWidth')
    await p.screenshot(path=f'/tmp/customer-update-{theme}-{width}.png',full_page=True)
    assert not errors,errors
    await c.close()
  await browser.close()
  print('PASS status payload/version, optional updates, length guard, failed-save drafts, no extra email, staff/public plain-text separation and both-theme mobile layouts')
asyncio.run(main())
