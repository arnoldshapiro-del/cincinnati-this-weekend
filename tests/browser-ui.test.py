import json, datetime, pathlib, os, shutil
from playwright.sync_api import sync_playwright
root=pathlib.Path(__file__).resolve().parents[1]
base=os.environ.get('CINCY_TEST_URL','http://127.0.0.1:4187')
original=json.loads((root/'data/cincinnati/current-weekend.json').read_text())
original['weekend'].update(startDate='2026-10-03',endDate='2026-10-04',shortLabel='Oct 3–4',label='Saturday, October 3 – Sunday, October 4, 2026',updatedAt='2026-10-03T21:00:00Z')
for e in original['events']:e['date']='2026-10-04'
fresh=json.loads(json.dumps(original));fresh['weekend'].update(startDate='2026-10-09',endDate='2026-10-11',shortLabel='Oct 9–11',label='Friday, October 9 – Sunday, October 11, 2026',updatedAt='2026-10-10T22:00:20Z',editionId='test-edition')
for e in fresh['events']:e['date']='2026-10-10'
checks=[]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_EXECUTABLE') or shutil.which('chromium') or p.chromium.executable_path,headless=True)
 def page(width=1280):
  ctx=browser.new_context(viewport={'width':width,'height':900},service_workers='block')
  x=ctx.new_page();x.route('**/data/cincinnati/current-weekend.json',lambda r:r.fulfill(json=original));x.clock.install(time=datetime.datetime(2026,10,10,22,0,tzinfo=datetime.timezone.utc));x.route('**/fonts.googleapis.com/**',lambda r:r.abort());x.route('**/fonts.gstatic.com/**',lambda r:r.abort());return ctx,x
 ctx,x=page();errors=[];x.on('pageerror',lambda e:errors.append(str(e)));x.goto(base);x.wait_for_selector('.event-card');assert x.locator('html').get_attribute('data-edition-status')=='stale';checks.append('expired edition remains labeled')
 x.locator('#refresh-button').click();x.wait_for_function("document.querySelector('#refresh-status').textContent.includes('No current')");assert x.locator('.event-card').count()>40;assert not x.locator('#refresh-button').is_disabled();checks.append('unchanged expired response is persistent and truthful')
 x.route('**/data/cincinnati/current-weekend.json?check=*',lambda r:r.fulfill(status=503,body='unavailable'));x.locator('#refresh-button').click();x.wait_for_function("document.querySelector('#refresh-status').dataset.kind==='error'");assert x.locator('.event-card').count()>40;checks.append('failed refresh retains last good guide')
 x.unroute('**/data/cincinnati/current-weekend.json?check=*');x.route('**/data/cincinnati/current-weekend.json?check=*',lambda r:r.fulfill(json=fresh));x.locator('#refresh-button').click();x.wait_for_function("document.querySelector('#refresh-status').dataset.kind==='success'");assert x.locator('html').get_attribute('data-edition-status')=='current';assert 'Oct 9' in x.locator('#weekend-date').inner_text();checks.append('validated new guide replaces stale guide')
 x.route('**/data/chicago/current-weekend.json',lambda r:r.fulfill(status=503,body='failed'));x.select_option('#city-select','chicago');x.wait_for_function("document.querySelector('#refresh-status').dataset.kind==='error'");assert x.locator('#city-select').input_value()=='cincinnati';assert x.locator('.event-card').count()>40;checks.append('failed city switch keeps correct previous city')
 assert not errors,errors;ctx.close()
 ctx,x=page(390);x.goto(base);x.wait_for_selector('.event-card');assert x.evaluate('document.documentElement.scrollWidth<=innerWidth');x.screenshot(path=str(root/'ui-mobile.png'),full_page=False);checks.append('390px layout has no horizontal overflow');ctx.close()
 ctx,x=page();posts=[];counts={'status':0};
 conf={'enabled':True,'statusUrl':base+'/test-status.json','pollIntervalMs':10000,'pollWindowMs':60000}
 x.route('**/refresh-config.json',lambda r:r.fulfill(json=conf))
 def st(r):
  counts['status']+=1
  state='idle' if counts['status']==1 else 'gathering' if counts['status']==2 else 'succeeded'
  r.fulfill(json={'schemaVersion':1,'jobId':'job-test','state':state,'cities':['cincinnati'],'targetWeekends':{'cincinnati':{'startDate':'2026-10-09','endDate':'2026-10-11'}},'startedAt':'2026-10-10T22:00:00Z','leaseExpiresAt':'2026-10-10T23:00:00Z','nextAllowedAt':'2026-10-10T23:00:00Z','publication':{'commitSha':'a'*40,'deployId':'deploy1','verifiedAt':'2026-10-10T22:00:20Z','editions':{'cincinnati':{'editionId':'test-edition','startDate':'2026-10-09','endDate':'2026-10-11','updatedAt':'2026-10-10T22:00:20Z'}}}})
 x.route('**/test-status.json?check=*',st)
 def form(r):
  if r.request.method=='POST':posts.append(r.request.post_data);r.fulfill(status=200,body='accepted')
  else:r.continue_()
 x.route(base+'/',form)
 x.route('**/data/cincinnati/current-weekend.json?check=*',lambda r:r.fulfill(json=fresh))
 x.goto(base);x.wait_for_selector('.event-card');x.locator('#refresh-button').click();x.wait_for_function("document.querySelector('#refresh-status').textContent.includes('Research is running')");assert len(posts)==1;assert x.locator('#refresh-button').is_disabled();checks.append('real refresh submits exactly one fixed form and shows evidenced research')
 x.clock.fast_forward(11000);x.wait_for_function("document.querySelector('#refresh-status').textContent.includes('Fresh research is published')");assert not x.locator('#refresh-button').is_disabled();assert x.locator('html').get_attribute('data-edition-status')=='current';checks.append('publication success requires newly loaded live data')
 x.screenshot(path=str(root/'ui-desktop.png'),full_page=False);ctx.close();browser.close()
print(json.dumps({'passed':checks},indent=2))
