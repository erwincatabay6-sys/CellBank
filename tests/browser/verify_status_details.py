"""Compact status history and read-only modal; all APIs use isolated fixtures."""
import asyncio, json, os
from urllib.parse import urlparse
from playwright.async_api import async_playwright, expect
from verify_application import USER, CUSTOMER, REPAIR

BASE = os.environ.get('CELLBANK_TEST_URL', 'http://localhost:5173')
NOTE = 'Private staff note\n<b>Plain text only</b>\n' + 'longword' * 250
UPDATE = 'Ready for collection.\nPlease bring your receipt.'
NAME = 'Long staff name ' * 18
ENTRIES = [dict(id=i, newStatus='IN_PROGRESS', changedAt=f'2026-11-{10+i}T12:00:00Z',
                changedByName=NAME if i == 0 else 'Local Test Staff', note=note, customerUpdate=update)
           for i, (note, update) in enumerate([(NOTE, UPDATE), (NOTE, None), (None, UPDATE), (' ', '\n'), (None, None)])]

async def main():
 async with async_playwright() as pw:
  browser = await pw.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
  for theme in ['light', 'dark']:
   for width, height in [(1440, 900), (375, 667), (667, 375)]:
    c = await browser.new_context(viewport={'width':width,'height':height}, color_scheme=theme)
    calls = []
    async def route(r):
     path = urlparse(r.request.url).path
     if not path.startswith('/api/'):
      await r.continue_(); return
     calls.append((r.request.method, path))
     data = []
     if path == '/api/auth/me': data = USER
     elif path == '/api/auth/csrf': data = {'headerName':'X-CSRF-TEST','token':'isolated'}
     elif path == '/api/notifications': data = {'items':[],'unreadCount':0}
     elif path == '/api/customers': data = [CUSTOMER]
     elif path == '/api/customers/1': data = CUSTOMER
     elif path == '/api/repairs/1': data = REPAIR
     elif path == '/api/repairs/1/status-history': data = ENTRIES
     await r.fulfill(content_type='application/json', body=json.dumps(data))
    await c.route('**/api/**', route)
    p = await c.new_page(); errors = []; p.on('pageerror', lambda e: errors.append(str(e)))
    await p.goto(BASE+'/repairs/1')
    await p.get_by_role('button', name='Status History', exact=True).click()
    cards = p.locator('.status-history-item')
    await expect(cards).to_have_count(5)
    assert await p.locator('.status-history-details-button').count() == 3
    assert NOTE not in await p.locator('.status-history-list').inner_text()
    assert UPDATE not in await p.locator('.status-history-list').inner_text()
    for index, entry in enumerate(reversed(ENTRIES)):
     card = cards.nth(index)
     await expect(card.locator('.status-history-metadata strong')).to_have_text('Changed by:')
     assert await card.locator('.status-history-metadata p').evaluate('(e)=>getComputedStyle(e).fontWeight') == '400'
     button = card.get_by_role('button')
     if not (entry['note'] and entry['note'].strip() or entry['customerUpdate'] and entry['customerUpdate'].strip()):
      await expect(button).to_have_count(0); continue
     await button.focus(); await p.keyboard.press('Enter')
     dialog = p.get_by_role('dialog', name='Status update details')
     await expect(dialog).to_be_visible()
     close = dialog.get_by_role('button', name='Close status update details')
     await expect(close).to_be_focused()
     body = dialog.get_by_role('region', name='Status update messages')
     await expect(body).to_contain_text(entry['changedByName'].strip())
     for label, value in [('Internal note', entry['note']), ('Customer update', entry['customerUpdate'])]:
      section = dialog.locator('.status-details-message').filter(has_text=label)
      if value:
       await expect(section.locator('p')).to_have_text(value)
       assert await section.locator('p').evaluate('(e)=>getComputedStyle(e).whiteSpace') == 'pre-wrap'
      else: await expect(section).to_have_count(0)
     assert await dialog.locator('b').count() == 0
     for key in ['Tab', 'Tab', 'Shift+Tab', 'Shift+Tab']:
      await p.keyboard.press(key)
      assert await dialog.evaluate('(e)=>e.contains(document.activeElement)')
     await body.focus(); await p.keyboard.press('End'); await p.wait_for_timeout(150)
     if await body.evaluate('(e)=>e.scrollHeight>e.clientHeight+1'):
      assert await body.evaluate('(e)=>e.scrollTop') > 0
     if width < 700 and entry['note']:
      assert await body.evaluate('(e)=>e.scrollHeight>e.clientHeight+1')
     bounds = await dialog.bounding_box()
     assert bounds['x'] >= 0 and bounds['y'] >= 0
     assert bounds['x']+bounds['width'] <= width+1 and bounds['y']+bounds['height'] <= height+1
     assert await body.evaluate('(e)=>e.scrollWidth<=e.clientWidth+1')
     if entry['id'] == 0:
      await body.evaluate('(e)=>e.scrollTop=0')
      await p.screenshot(path=f'/tmp/status-details-{theme}-{width}.png')
      await close.click()
     else: await p.keyboard.press('Escape')
     await expect(dialog).to_have_count(0)
     await expect(button).to_be_focused()
    assert not any(method != 'GET' for method, _ in calls), calls
    assert not errors, errors
    assert await p.evaluate('document.documentElement.scrollWidth<=innerWidth')
    await p.screenshot(path=f'/tmp/status-history-compact-{theme}-{width}.png')
    await c.close()
  await browser.close()
  print('PASS compact cards; both/either/neither messages; read-only plain text; focus trap/return, Escape/X; mobile/landscape and both themes')
asyncio.run(main())
