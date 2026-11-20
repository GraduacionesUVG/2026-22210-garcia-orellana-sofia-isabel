import { test, expect } from '../fixtures';
for (let repetition=0;repetition<5;repetition++) test(`production mocked cold and warm corpus filter baseline repetition ${repetition+1}`, { tag:'@frontend-performance' }, async ({ page, ui }, testInfo) => {
  if (process.env.FRONTEND_SERVER_MODE !== 'production') throw new Error('PERFORMANCE_PRODUCTION_BUILD_REQUIRED');
  await page.setViewportSize({width:1440,height:900});
  ui.seed({documents:[{ id:'perf-document', title:'Documento de memoria', content:'Memoria comunitaria', status:'draft', document_type:'interview', deleted_at:null }]});
  const samples=[];
  await page.goto(`/projects/${ui.projectId}/corpus`); await expect(page.getByRole('link',{name:/Abrir documento Documento de memoria/})).toBeVisible();
  // Cold = first filter in this fresh isolated browser context; warm repeats it.
  for (const mode of ['cold','warm']) {
    const search=page.getByPlaceholder(/Buscar/i).first();
    await search.fill(''); await expect(page.getByRole('link',{name:/Abrir documento Documento de memoria/})).toBeVisible();
    const before=ui.requests.length, started=performance.now();
    await search.fill('absent-filter-result');
    await expect.poll(() => ui.requests.slice(before).some(request => request.path.endsWith('/documents') && request.method==='GET')).toBe(true);
    await expect(page.getByRole('link',{name:/Abrir documento Documento de memoria/})).toHaveCount(0);
    samples.push({scenario:'corpus-filter',mode,durationMs:performance.now()-started,requests:ui.requests.length-before});
  }
  await testInfo.attach('frontend-performance', {contentType:'application/json',body:Buffer.from(JSON.stringify({browser:testInfo.project.use.browserName,viewport:{width:1440,height:900},machine:process.platform,mode:'mocked-production-no-artificial-latency',samples}))});
});
