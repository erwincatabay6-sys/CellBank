"""Reports layout and data regression checks using browser-only API fixtures."""
import asyncio
import os
from collections import Counter
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

from playwright.async_api import async_playwright, expect

from verify_application import USER, CUSTOMER, REPAIR

START, END = '2026-01-15', '2026-03-20'
STATUS = ['RECEIVED', 'AWAITING_APPROVAL', 'IN_PROGRESS', 'AWAITING_PARTS',
          'READY_FOR_RELEASE', 'COMPLETED', 'CANCELLED']
JOBS = [
    ('2026-01-18', 'IN_PROGRESS', 'A. Reyes', 'Pixel 8', 2000),
    ('2026-01-21', 'COMPLETED', 'M. Cruz', 'iPhone 13', 3250),
    ('2026-02-04', 'COMPLETED', 'N. Santos', 'Galaxy A54', 1600),
    ('2026-02-10', 'AWAITING_APPROVAL', 'L. Ramos', 'iPad Air', None),
    ('2026-02-14', 'IN_PROGRESS', 'P. Flores', 'Lenovo ThinkPad', 4700),
    ('2026-02-23', 'READY_FOR_RELEASE', 'T. Garcia', 'MacBook Air', 1800),
    ('2026-03-05', 'RECEIVED', 'J. Aquino', 'Nintendo Switch', None),
    ('2026-03-12', 'CANCELLED', 'V. Dizon', 'OPPO Reno8', None),
    ('2025-12-19', 'COMPLETED', 'R. Lim', 'Nokia G42', None),
]
PAYMENTS = [(1, '2026-02-08', 700), (1, '2026-04-02', 300),
            (2, '2026-01-25', 3250), (3, '2026-03-03', 1600), (6, '2026-03-14', 900)]

def report(start=None, end=None):
    within = lambda value: (not start or value >= start) and (not end or value <= end)
    records, financial = [], []
    counts, volumes, trend = Counter(), Counter(), Counter()
    for i, (received, status, customer, device, price) in enumerate(JOBS, 1):
        if not within(received):
            continue
        counts[status] += 1
        volumes[received[:7]] += 1
        row = dict(id=i, reference=f'CB-TEST-{i:03}', createdAt=received, customer=customer,
                   device=device, technicianId=1 if i <= 6 else None,
                   technician='Local Technician' if i <= 6 else 'Unassigned', status=status)
        records.append(row)
        paid = sum(value for job, _, value in PAYMENTS if job == i)
        balance = price - paid if price is not None else None
        payment_status = ('Price Not Agreed' if price is None else 'Unpaid' if paid == 0
                          else 'Paid' if balance == 0 else 'Partially Paid')
        financial.append({**row, 'agreedPrice':price, 'totalPaid':paid, 'balance':balance, 'paymentStatus':payment_status})
    for _, paid_on, value in PAYMENTS:
        if within(paid_on):
            trend[paid_on[:7]] += value
    assigned = [r for r in records if r['technicianId']]
    closed = ('COMPLETED', 'CANCELLED')
    return dict(
        repairSummary=dict(totalRepairs=len(records), activeRepairs=sum(r['status'] not in closed for r in records),
                           completedRepairs=counts['COMPLETED'], cancelledRepairs=counts['CANCELLED']),
        financialSummary=dict(totalAgreedValue=sum(r['agreedPrice'] or 0 for r in financial),
                              totalOutstandingBalance=sum(r['balance'] or 0 for r in financial),
                              totalPaymentsCollected=sum(trend.values()),
                              **{k: sum(r['paymentStatus'] == v for r in financial) for k, v in [
                                  ('paidRepairs','Paid'), ('unpaidRepairs','Unpaid'),
                                  ('partiallyPaidRepairs','Partially Paid'), ('priceNotAgreedRepairs','Price Not Agreed')]}),
        statusCounts=dict(counts), repairVolume=[dict(month=m,value=v) for m,v in sorted(volumes.items())],
        paymentTrend=[dict(month=m,value=v) for m,v in sorted(trend.items())],
        repairRecords=records, financialRecords=financial,
        technicianActivity=[dict(id=1,name='Local Technician',repairsHandled=len(assigned),
                                 activeRepairs=sum(r['status'] not in closed for r in assigned),
                                 completedRepairs=sum(r['status']=='COMPLETED' for r in assigned))] if assigned else [],
    )

def intercept(user=USER, calls=None, failure=None):
    async def route(r):
        url = urlsplit(r.request.url)
        path = url.path
        if not path.startswith('/api/'):
            await r.continue_()
            return
        status = 200
        if path == '/api/reports':
            query = parse_qs(url.query)
            start, end = (query.get(k, [None])[0] for k in ('startDate', 'endDate'))
            if calls is not None: calls.append((start, end))
            if failure and failure[0]:
                status, data = 503, {'message': 'Fixture unavailable'}
            else:
                data = report(start, end)
        else:
            data = {'/api/auth/me':user, '/api/notifications':{'items':[],'unreadCount':0},
                    '/api/repairs/1':REPAIR, '/api/customers/1':CUSTOMER}.get(path, [])
        await r.fulfill(status=status,json=data)
    return route

async def dates(page, start, end):
    await page.get_by_label('Start Date', exact=True).fill(start)
    await page.get_by_label('End Date', exact=True).fill(end)


async def main():
    base = os.environ.get('CELLBANK_TEST_URL', 'http://localhost:5173')
    output = Path(os.environ.get('CELLBANK_TEST_OUTPUT', '/tmp/cellbank-reports-refinement'))
    output.mkdir(parents=True, exist_ok=True)

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(
            executable_path=os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium'),
            args=['--no-sandbox'],
        )
        for width, height, theme in [(1440, 1000, 'light'), (360, 850, 'light'), (390, 850, 'dark')]:
            context = await browser.new_context(
                viewport={'width': width, 'height': height},
                color_scheme=theme, reduced_motion='reduce',
                has_touch=width < 400, is_mobile=width < 400,
            )
            calls, errors = [], []
            fail = [False]
            await context.route('**/api/**', intercept(calls=calls, failure=fail))
            page = await context.new_page()
            page.on('pageerror', lambda error: errors.append(str(error)))
            await page.goto(base + '/reports')
            await expect(page.get_by_role('status', name='Loading reports')).to_be_attached()
            await dates(page, START, END)
            overview = page.get_by_role('region', name='Period summary')
            await expect(overview).to_contain_text('₱6,450.00')
            assert calls[-1] == (START, END)
            assert await overview.locator('strong').all_text_contents() == ['8', '5', '2', '₱6,450.00']
            await expect(page.locator('.report-status-list dd')).to_have_text(['1', '1', '2', '0', '1', '2', '1'])
            await expect(page.locator('.report-status-list dt .status-badge')).to_have_text([
                'Received', 'Awaiting Approval', 'In Progress', 'Awaiting Parts',
                'Ready for Release', 'Completed', 'Cancelled',
            ])
            assert await page.evaluate('innerWidth === document.documentElement.clientWidth')
            assert await page.evaluate('document.documentElement.scrollWidth <= innerWidth')
            assert await page.evaluate('document.documentElement.scrollHeight <= innerHeight + 1')
            summary_cols = await overview.evaluate("(e) => getComputedStyle(e).gridTemplateColumns.split(' ').length")
            assert summary_cols == (4 if width > 400 else 2)
            charts = page.locator('.report-chart-grid')
            assert await charts.evaluate("(e) => getComputedStyle(e).gridTemplateColumns.split(' ').length") == (2 if width > 400 else 1)
            heading = page.get_by_role('heading', name='Reports', exact=True)
            start = page.get_by_label('Start Date', exact=True)
            if width < 400:
                assert (await start.bounding_box())['y'] > (await heading.bounding_box())['y'] + (await heading.bounding_box())['height']
            else:
                assert (await start.bounding_box())['x'] > (await heading.bounding_box())['x']
                first, second = await charts.locator('article').all()
                assert (await first.bounding_box())['width'] > (await second.bounding_box())['width']

            repair_tab = page.get_by_role('tab', name='Repair records')
            financial_tab = page.get_by_role('tab', name='Financial records')
            tech_tab = page.get_by_role('tab', name='Technician activity')
            await expect(repair_tab).to_have_attribute('aria-selected', 'true')
            await expect(page.get_by_role('tabpanel', name='Financial records')).to_have_count(0)
            await expect(page.get_by_text('Showing 8 of 8 repair records')).to_be_visible()

            await page.get_by_label('End Date', exact=True).blur()
            if width == 1440:
                await page.screenshot(path=output/'reports-after-desktop.png')
            elif width == 390:
                await page.mouse.move(0, 0)
                await page.screenshot(path=output/'reports-after-mobile-390.png')

            volume = page.get_by_role('img', name='Monthly repair volume')
            await expect(volume).to_have_accessible_description('Jan 2026: 2; Feb 2026: 4; Mar 2026: 2')
            await expect(volume.locator('.report-chart-point-value')).to_have_text(['2', '4', '2'])
            baseline = await volume.locator('.report-chart-axis-line').bounding_box()
            month_label = await volume.locator('.report-chart-x-label').first.bounding_box()
            assert month_label['y'] - baseline['y'] >= 8
            await expect(charts.get_by_text('View chart data')).to_have_count(0)
            await page.get_by_role('searchbox', name='Search repair records').fill('Pixel')
            await page.get_by_label('Filter by repair status').select_option('IN_PROGRESS')
            await page.get_by_label('Filter by technician').select_option('1')
            await expect(page.get_by_text('Showing 1 of 8 repair records')).to_be_visible()
            old_calls = len(calls)

            if width < 400:
                await financial_tab.tap()
            else:
                await repair_tab.focus()
                await repair_tab.press('ArrowRight')
                await expect(financial_tab).to_be_focused()
            await expect(financial_tab).to_have_attribute('aria-selected', 'true')
            finance = page.get_by_role('tabpanel', name='Financial records')
            await expect(finance.locator('.financial-summary-grid strong')).to_have_text(
                ['₱13,350.00', '₱6,450.00', '₱6,600.00']
            )
            await expect(finance.get_by_text('including payments recorded outside that period.', exact=False)).to_be_visible()
            await expect(finance.get_by_text('boundary months may cover only part of the month.', exact=False)).to_be_visible()
            await expect(finance.get_by_role('heading', name='Payments Received by Month — Jan 2026 – Mar 2026')).to_be_visible()
            await expect(finance.locator('.report-column-bar')).to_have_count(3)
            chart_data = finance.locator('.report-chart-data summary')
            if width < 400:
                await chart_data.tap()
            else:
                await chart_data.focus()
                await chart_data.press('Enter')
            chart_table = finance.get_by_role('table', name='Monthly payments received: Jan 2026 – Mar 2026')
            await expect(chart_table.get_by_role('row', name='Feb ₱700.00')).to_be_visible()
            await expect(chart_table.get_by_role('row', name='Mar ₱2,500.00')).to_be_visible()
            await expect(chart_table.get_by_role('row', name='Apr', exact=False)).to_have_count(0)
            await chart_data.click()
            payment_filter = finance.get_by_label('Filter by payment status')
            await payment_filter.select_option('Partially Paid')
            await expect(finance.get_by_text('Showing 2 of 8 financial records')).to_be_visible()
            cross_month = finance.get_by_role('row').filter(has_text='CB-TEST-001')
            await expect(cross_month.get_by_role('cell', name='₱1000.00', exact=True)).to_have_count(2)
            wide_table = finance.get_by_role('region', name='Financial records', exact=True)
            if width < 400:
                assert await wide_table.evaluate('(e) => e.scrollWidth > e.clientWidth')
                await wide_table.evaluate('(e) => { e.scrollLeft = 120; }')
                assert await wide_table.evaluate('(e) => e.scrollLeft') > 0
                await wide_table.evaluate('(e) => { e.scrollLeft = 0; }')
                assert await page.evaluate('document.documentElement.scrollWidth <= innerWidth')
                assert await finance.locator('.report-column-chart-wrapper').evaluate('(e) => e.scrollWidth <= e.clientWidth + 1')

            if width in (1440, 360):
                if width == 360:
                    await page.mouse.move(0, 0)
                    await page.set_viewport_size({'width': width, 'height': 1040})
                await page.evaluate('document.activeElement.blur()')
                await finance.locator('.report-payment-chart-card').evaluate("(element) => element.scrollIntoView({block:'start'})")
                assert await page.evaluate('scrollY === 0')
                await page.screenshot(path=output / f'reports-financial-{width}.png')
                if width == 360:
                    await page.set_viewport_size({'width': width, 'height': height})

            await financial_tab.focus()
            await financial_tab.press('End')
            await expect(tech_tab).to_be_focused()
            await expect(page.get_by_role('tabpanel', name='Technician activity').get_by_role('row', name='Local Technician 6 4 2')).to_be_visible()
            await tech_tab.press('Home')
            await expect(repair_tab).to_be_focused()
            await expect(page.get_by_role('searchbox', name='Search repair records')).to_have_value('Pixel')
            await expect(page.get_by_text('Showing 1 of 8 repair records')).to_be_visible()
            assert calls[-1] == (START, END) and len(calls) == old_calls
            await repair_tab.press('ArrowRight')
            await expect(payment_filter).to_have_value('Partially Paid')

            if width == 360:
                await dates(page, '2026-02-01', '2026-02-28')
                await expect(finance.get_by_role('heading', name='Payments Received by Month — Feb 2026')).to_be_visible()
                await expect(finance.get_by_text('Showing 1 of 4 financial records')).to_be_visible()
                await expect(overview).to_contain_text('₱700.00')
                assert calls[-1] == ('2026-02-01', '2026-02-28')
            elif width == 1440:
                await page.emulate_media(media='print')
                for title in ['Detailed Repair Records', 'Financial Records', 'Technician Repair Activity']:
                    await expect(page.get_by_role('heading', name=title, exact=True)).to_be_visible()
                await page.emulate_media(media='screen')
                await dates(page, '', '2026-01-31')
                await expect(page.locator('.report-selected-period')).to_contain_text('Through')
                await expect(overview).to_contain_text('₱3,250.00')
                assert calls[-1] == (None, '2026-01-31')
                await dates(page, '2026-01-15', '')
                await expect(page.locator('.report-selected-period')).to_contain_text('From')
                await expect(overview).to_contain_text('₱6,750.00')
                assert calls[-1] == (START, None)
                await page.get_by_role('button', name='All Time').click()
                await expect(page.locator('.report-selected-period')).to_have_text('All Time')
                await expect(volume.locator('.report-chart-x-label')).to_have_text([
                    'Dec 2025', 'Jan 2026', 'Feb 2026', 'Mar 2026',
                ])
                await expect(finance.get_by_text('Monthly payments for the current year.', exact=False)).to_be_visible()
                assert calls[-1] == (None, None)

                await dates(page, '2026-03-31', '2026-03-01')
                await expect(page.get_by_role('alert').filter(has_text='Start Date cannot be later')).to_be_visible()
                await expect(overview).to_have_count(0)
                await dates(page, '2026-01-18', '2026-01-18')
                await expect(page.locator('.report-chart-point')).to_have_count(1)
                await expect(page.locator('.report-chart-point')).to_be_visible()
                await dates(page, '2026-05-01', '2026-05-31')
                await expect(page.get_by_text('No data is available for the selected period.')).to_be_visible()
                await expect(page.locator('.report-status-list dd')).to_have_text(['0']*7)
                await expect(finance.get_by_text('No financial records found')).to_be_visible()
                await repair_tab.click()
                await expect(page.get_by_text('No repair records found')).to_be_visible()
                await tech_tab.click()
                await expect(page.get_by_text('No technician activity available')).to_be_visible()
                fail[0] = True
                await dates(page, START, END)
                await expect(page.get_by_text('Unable to load report', exact=True)).to_be_visible()
                fail[0] = False
                await page.get_by_role('button', name='Try Again').click()
                await expect(tech_tab).to_have_attribute('aria-selected', 'true')
                await repair_tab.click()
                await page.get_by_role('button', name='Open repair CB-TEST-001').press('Enter')
                await expect(page).to_have_url(base + '/repairs/1')
            assert not errors, errors
            await context.close()
            print(f'PASS Reports at {width}px ({theme})', flush=True)

        context = await browser.new_context()
        calls = []
        await context.route('**/api/**', intercept(user={**USER,'roles':['TECHNICIAN']}, calls=calls))
        page = await context.new_page()
        await page.goto(base + '/reports')
        await expect(page.get_by_text('Access Denied', exact=True)).to_be_visible()
        assert not calls
        await browser.close()
        print('PASS Reports access-denied guard', flush=True)


if __name__ == '__main__':
    asyncio.run(main())
