import { buildFrontendReport, summarizePerformance, classifyBrowserOutcome } from '../frontend/report';
import { sanitizeFrontendAttachments } from '../frontend/action-evidence';
import { assertVisualApproval } from '../frontend/visual-approval';
const { verifyFrontendArtifact } = require('../frontend/source-identity.cjs');
const { runFrontendCommand, localFrontendExitCode } = require('../frontend/runner-policy.cjs');
const { finishFrontendPhase, parseBrowserPhaseArtifact } = require('../frontend/browser-artifacts.cjs');
const { serveOwnedFrontendProcesses } = require('../../scripts/frontend-start-server.cjs');
const { cleanupFrontendResources } = require('../frontend/runner-cleanup.cjs');
function injectedRunner(options:any={}) {
  const phases:any[]=[];const signal=new AbortController();
  const phase=jest.fn(async(name:string)=>{const result={name,outcome:options.childCode?'failed':'passed',exitCode:options.childCode??0};phases.push(result);if(options.cancel)signal.abort();return result;});
  return {phases,begin:jest.fn(),phase,play:phase,signal:signal.signal,prepareBuild:jest.fn(),buildEnv:{},record:(result:any)=>phases.push(result),
    cleanup:jest.fn(async()=>{const result={name:'cleanup',outcome:options.cleanupCode?'failed':'passed',exitCode:options.cleanupCode??0,reason:options.cleanupCode?'Server record not proven owned; left intact':undefined};phases.push(result);return result;}),
    report:jest.fn(()=>options.report??{exitCode:2,phases})};
}
test.each(['mocked','performance','smoke','crossbrowser','typecheck'])('standalone %s fails when successful child cleanup is unverified',async command=>{
  const ops=injectedRunner({cleanupCode:1});expect(await runFrontendCommand(command,[],ops)).not.toBe(0);expect(ops.cleanup).toHaveBeenCalledTimes(1);expect(ops.phases.at(-1).reason).toContain('left intact');
});
test.each(['mocked','performance','smoke','crossbrowser','typecheck'])('standalone %s preserves child failure and cancellation after cleanup',async command=>{
  const failure=injectedRunner({childCode:1});expect(await runFrontendCommand(command,[],failure)).not.toBe(0);expect(failure.cleanup).toHaveBeenCalledTimes(1);
  const cancelled=injectedRunner({cancel:true});expect(await runFrontendCommand(command,[],cancelled)).not.toBe(0);expect(cancelled.cleanup).toHaveBeenCalledTimes(1);
});
test('dirty source digest includes repository-qualified frontend and CSS file bytes',()=>{
  const {execFileSync}=require('node:child_process');const {readFileSync,existsSync}=require('node:fs');const path=require('node:path');const {createHash}=require('node:crypto');
  const appRoot=path.resolve(__dirname,'../..');const repository=execFileSync('git',['rev-parse','--show-toplevel'],{cwd:appRoot,encoding:'utf8'}).trim();
  const files=execFileSync('git',['ls-files','--full-name','--cached','--others','--exclude-standard','-z'],{cwd:repository,encoding:'utf8'}).split('\0').filter((file:string)=>/\.(ts|tsx|js|jsx|cjs|mjs|json|yml|yaml|css)$/.test(file)&&!file.includes('/docs/')&&!file.includes('/__tests__/reports/')&&!file.startsWith('.superpowers/')).sort();
  const stylesheet = path.relative(repository, path.join(appRoot, 'app', 'globals.css')).split(path.sep).join('/');
  expect(files).toContain(stylesheet);
  const hash=createHash('sha256');for(const file of files){hash.update(file+'\0');const absolute=path.resolve(repository,file);hash.update(existsSync(absolute)?readFileSync(absolute):'<deleted>');hash.update('\0');}
  expect(require('../frontend/source-identity.cjs').collectFrontendIdentity(appRoot,'suite-a').sourceDigest).toBe(hash.digest('hex'));
});
test('generated frontend run reports do not mutate the verified source identity',()=>{
  const {execFileSync}=require('node:child_process');
  const {mkdtempSync,mkdirSync,writeFileSync,rmSync}=require('node:fs');
  const os=require('node:os');const path=require('node:path');
  const tempRoot=mkdtempSync(path.join(os.tmpdir(),'frontend-source-identity-'));
  const appRoot=path.join(tempRoot,'antropologia-backend');
  const reportFile=path.join(appRoot,'__tests__/reports/frontend/latest-run.json');
  const identify=require('../frontend/source-identity.cjs').collectFrontendIdentity;
  try {
    mkdirSync(path.dirname(reportFile),{recursive:true});
    writeFileSync(path.join(appRoot,'app.ts'),'export const stable = true;\\n');
    writeFileSync(reportFile,'{"runId":"first"}\\n');
    execFileSync('git',['init','--quiet'],{cwd:tempRoot});
    execFileSync('git',['-c','user.name=Frontend Tests','-c','user.email=frontend-tests@example.invalid','add','.'],{cwd:tempRoot});
    execFileSync('git',['-c','user.name=Frontend Tests','-c','user.email=frontend-tests@example.invalid','commit','--quiet','-m','fixture'],{cwd:tempRoot});
    const before=identify(appRoot,'run-before').sourceDigest;
    writeFileSync(reportFile,'{"runId":"second"}\\n');
    expect(identify(appRoot,'run-after').sourceDigest).toBe(before);
  } finally { rmSync(tempRoot,{recursive:true,force:true}); }
});
const identity = { runId: 'suite-a', commit: 'head-a', sourceDigest: 'source-a' };
const contract = { id: 'create', route: '/dashboard', source: 'features/Create.jsx', roles: ['owner'], states: ['success'], backendActionIds: ['projects.modal-create'], persistence: 'live', disposition: 'new', kind: 'mutation', critical: true };
const proof = { controlId: 'create', testId: 'test-a', ...identity, mode: 'live', outcome: 'passed', interaction: 'click', visibleAssertion: 'card', requestAssertion: 'POST correct project', readbackAssertion: 'GET+reload', cleanup: 'passed', roles: ['owner'], states: ['success'], backendActionIds: ['projects.modal-create'] };
const phaseNames = ['build','unit','mocked','accessibility','layout','visual','firefox','webkit','critical-smoke','performance','live','cleanup'];
test.each(['all','changed','missing'])('runtime snapshot update %s cannot bypass approval', updateSnapshots => { expect(()=>assertVisualApproval({updateSnapshots,expectedDigest:'approved',beforeDigest:'approved',afterDigest:'approved'})).toThrow('BASELINE'); });
test('approved baseline replacement during comparison blocks certification',()=>{expect(()=>assertVisualApproval({updateSnapshots:'none',expectedDigest:'approved',beforeDigest:'approved',afterDigest:'replaced'})).toThrow('BASELINE');});
function input(): any { return { expected: identity, actual: identity, manifestComplete: true, contracts: [contract], evidence: [proof], phases: phaseNames.map(name => ({ name, outcome: 'passed', exitCode: 0 })), tests: [{ testId: 'test-a', outcome: 'passed', critical: true }], visualApproved: true, liveAuthorized: true }; }
test.each([
  ['empty evidence',(x: any) => { x.evidence = []; }],
  ['wrong run',(x: any) => { x.evidence[0] = { ...proof, runId: 'suite-b' }; }],
  ['wrong commit',(x: any) => { x.actual = { ...identity, commit: 'head-b' }; }],
  ['dirty source changed',(x: any) => { x.actual = { ...identity, sourceDigest: 'source-b' }; }],
  ['unknown contract',(x: any) => { x.evidence[0] = { ...proof, controlId: 'absent' }; }],
  ['critical skip',(x: any) => { x.tests[0].outcome = 'skipped'; }],
  ['mock is not live',(x: any) => { x.evidence[0] = { ...proof, mode: 'mocked' }; }],
  ['failed cleanup',(x: any) => { x.evidence[0] = { ...proof, cleanup: 'failed' }; }],
  ['aborted phase',(x: any) => { x.phases[0].outcome = 'aborted'; x.phases[0].exitCode = 1; }],
  ['open inventory',(x: any) => { x.manifestComplete = false; }],
  ['unapproved visual',(x: any) => { x.visualApproved = false; }],
  ['unauthorized live',(x: any) => { x.liveAuthorized = false; }],
])('%s blocks full certification', (_name, mutate) => { const data=input(); mutate(data); const result=buildFrontendReport(data); expect(result.exitCode).not.toBe(0); expect(result.certified).toBe(false); });
test('complete current independently attributed evidence certifies only demonstrated requirements', () => { expect(buildFrontendReport(input())).toMatchObject({ exitCode: 0, certified: true }); });
test('assertion descriptions without a matching executed test cannot certify', () => { const data=input(); data.tests=[]; expect(buildFrontendReport(data).exitCode).not.toBe(0); });
test('wrong source evidence cannot label its control passed even when certification is blocked',()=>{const data=input();data.evidence=[{...proof,sourceDigest:'stale'}];expect(buildFrontendReport(data).controls[0].outcome).toBe('not-demonstrated');});
test.each(['visibleAssertion','requestAssertion','readbackAssertion'])('missing %s excludes invalid proof from control credit',field=>{
  const data=input();data.contracts=[{...contract,persistence:'mocked'}];data.evidence=[{...proof,[field]:''}];const report=buildFrontendReport(data);
  expect(report.exitCode).not.toBe(0);expect(report.controls[0].outcome).toBe('not-demonstrated');expect(report.inventory.percent).toBe(0);
});
test('modified or unbound raw artifact cannot be consumed as suite evidence',()=>{
  const {createHash}=require('node:crypto');const contents=Buffer.from('current');const sha256=createHash('sha256').update(contents).digest('hex');
  expect(()=>verifyFrontendArtifact(contents,{sha256,runId:identity.runId},identity.runId)).not.toThrow();
  expect(()=>verifyFrontendArtifact(Buffer.from('changed'),{sha256,runId:identity.runId},identity.runId)).toThrow();
  expect(()=>verifyFrontendArtifact(contents,{sha256,runId:'stale'},identity.runId)).toThrow();
});
test('redaction includes base64 textual attachments and drops unverified binaries', () => {
  const value={ attachments: [{ name: 'safe', contentType: 'text/plain', body: Buffer.from('TOKEN_SENTINEL').toString('base64') }, { name: 'binary', contentType: 'image/png', path: '/secret/file.png' }], diagnostic:'TOKEN_SENTINEL' };
  const safe=sanitizeFrontendAttachments(value,{ TEST_SECRET: 'TOKEN_SENTINEL' });
  expect(JSON.stringify(safe)).not.toContain('TOKEN_SENTINEL');
  expect(Buffer.from(safe.attachments[0].body,'base64').toString()).toBe('[REDACTED]');
  expect(safe.attachments[1]).not.toHaveProperty('path');
});
test('installed frontend reporter sanitizes attachments before its sole publication',async()=>{
  const Reporter=require('../frontend/safe-playwright-json.cjs');const path=require('node:path');const promises=require('node:fs').promises;
  const outputFile=path.join(require('node:os').tmpdir(),'frontend-redaction-'+require('node:crypto').randomUUID()+'.json');const publications:string[]=[];
  const original=process.env.TEST_SECRET;process.env.TEST_SECRET='FRONTEND_ATTACHMENT_SENTINEL';
  const write=jest.spyOn(promises,'writeFile').mockImplementation(async(file:any,bytes:any)=>{if(file===outputFile)publications.push(String(bytes));});
  try{
    const reporter=new Reporter({outputFile});reporter.onConfigure({rootDir:path.dirname(outputFile),projects:[]});
    const result={status:'passed',duration:1,errors:[],stdout:[],stderr:[],steps:[],attachments:[{name:'proof',contentType:'application/json',body:Buffer.from(JSON.stringify({diagnostic:process.env.TEST_SECRET}))},{name:'binary',contentType:'image/png',path:'/not-approved/screenshot.png'}],startTime:new Date(),retry:0};
    const test={title:'synthetic reporter case',id:'reporter-proof',location:{file:path.join(path.dirname(outputFile),'fixture.spec.ts'),line:1,column:1},tags:[],annotations:[],timeout:1000,expectedStatus:'passed',results:[result],ok:()=>true,outcome:()=>'expected'};
    const suite={title:'synthetic',location:test.location,tests:[test],suites:[],allTests:()=>[test]};reporter.onBegin({suites:[{project:()=>({name:'mocked'}),suites:[suite]}],allTests:()=>[test]});
    await reporter.onEnd({status:'passed',startTime:new Date(),duration:1});
    expect(publications).toHaveLength(1);expect(publications[0]).not.toContain('/not-approved');const raw=JSON.parse(publications[0]);const attachments=raw.suites[0].specs[0].tests[0].results[0].attachments;
    expect(Buffer.from(attachments[0].body,'base64').toString()).not.toContain('FRONTEND_ATTACHMENT_SENTINEL');expect(attachments[1]).not.toHaveProperty('path');expect(raw.stats.expected).toBe(1);
  }finally{write.mockRestore();if(original===undefined)delete process.env.TEST_SECRET;else process.env.TEST_SECRET=original;}
});
test('five cold and warm repetitions report observed percentiles and request counts, not DB latency', () => {
  const samples=['cold','warm'].flatMap(mode => [100,200,300,400,500].map((durationMs,index) => ({ scenario:'filter',mode,durationMs,requests:index+1 })));
  expect(summarizePerformance(samples)).toEqual([{ scenario:'filter', mode:'cold', count:5, p50:300, p95:500, requests:[1,2,3,4,5], budgetMs:1500, budgetApproved:false }, { scenario:'filter', mode:'warm', count:5, p50:300, p95:500, requests:[1,2,3,4,5], budgetMs:1500, budgetApproved:false }]);
});
test('absent or incomplete performance repetitions never claim a measured baseline',()=>{expect(()=>summarizePerformance([])).toThrow();expect(()=>summarizePerformance([{scenario:'filter',mode:'cold',durationMs:1,requests:1}])).toThrow();});
test('explicit absent approval is blocked, while real assertion or mixed errors remain failures',()=>{
  expect(classifyBrowserOutcome('unexpected',[{status:'failed',errors:[{message:'BASELINE_APPROVAL_REQUIRED: absent'}]}])).toBe('blocked');
  expect(classifyBrowserOutcome('unexpected',[{status:'failed',errors:[{message:'Expected visible'}]}])).toBe('failed');
  expect(classifyBrowserOutcome('unexpected',[{status:'failed',errors:[{message:'BASELINE_APPROVAL_REQUIRED'},{message:'Unexpected mocked request'}]}])).toBe('failed');
});
function localReport():any {
  const data=input();data.manifestComplete=false;data.liveAuthorized=false;data.visualApproved=false;
  data.phases=data.phases.map((phase:any)=>phase.name==='live'?{...phase,outcome:'blocked',exitCode:2,reason:'User local-only authorization'}:phase);
  return buildFrontendReport(data);
}
test('actual local gate permits only explicit policy blocks, never full certification',async()=>{
  const result=localReport();const ops=injectedRunner({report:result});
  expect(await runFrontendCommand('gate',['--mocked-only'],ops)).toBe(0);expect(result.certified).toBe(false);expect(result.exitCode).not.toBe(0);
});
test.each(['visual assertion','mixed visual errors','critical skip','critical flaky','identity','invalid proof','cleanup'])('actual local gate refuses %s despite other passing phases',async kind=>{
  const result=localReport();
  if(kind.startsWith('visual')||kind==='mixed visual errors'){result.phases=result.phases.map((phase:any)=>phase.name==='visual'?{...phase,outcome:'failed',exitCode:1}:phase);result.tests.push({testId:'visual-bug',phase:'visual',critical:true,outcome:'failed',errors:kind==='mixed visual errors'?['BASELINE_APPROVAL_REQUIRED','Expected screenshot equality']:['Expected screenshot equality']});result.issues.push('Required phase not passed: visual','Critical test not demonstrated: visual-bug/failed');}
  else if(kind==='critical skip'||kind==='critical flaky'){result.tests[0]={...result.tests[0],outcome:kind.endsWith('skip')?'skipped':'flaky'};result.issues.push(`Critical test not demonstrated: test-a/${result.tests[0].outcome}`);}
  else if(kind==='identity')result.issues.push('Current source identity mismatch: sourceDigest');
  else if(kind==='invalid proof')result.issues.push('UI proof incomplete: create');
  else {result.phases=result.phases.map((phase:any)=>phase.name==='cleanup'?{...phase,outcome:'failed',exitCode:1}:phase);result.issues.push('Required phase not passed: cleanup');}
  expect(await runFrontendCommand('gate',['--mocked-only'],injectedRunner({report:result}))).not.toBe(0);
});
test('actual local gate can waive a visual phase only when every executed error is absent approval',async()=>{
  const result=localReport();result.phases=result.phases.map((phase:any)=>phase.name==='visual'?{...phase,outcome:'failed',exitCode:1}:phase);
  result.tests.push({testId:'visual-policy',phase:'visual',critical:true,outcome:'blocked',errors:['BASELINE_APPROVAL_REQUIRED: absent']});
  result.issues.push('Required phase not passed: visual','Critical test not demonstrated: visual-policy/blocked');
  expect(await runFrontendCommand('gate',['--mocked-only'],injectedRunner({report:result}))).toBe(0);
});
function canonicalBrowserArtifact():any {
  const attachment={name:'frontend-ui-proof',contentType:'application/json',body:Buffer.from(JSON.stringify([proof])).toString('base64')};
  const test={projectName:'frontend-mocked',status:'expected',results:[{status:'passed',errors:[],attachments:[attachment]}]};
  const spec={id:'test-a',title:'accessibility actual control',file:'fixture.spec.ts',line:1,tags:[],tests:[test]};
  return {config:{projects:[{name:'frontend-mocked'}]},suites:[{title:'fixture.spec.ts',specs:[spec]}],errors:[],stats:{expected:1,unexpected:0,skipped:0,flaky:0}};
}
function browserArtifactInput(raw:any=canonicalBrowserArtifact()):any {const path=require('node:path'),{createHash}=require('node:crypto');const contents=Buffer.from(JSON.stringify(raw)),directory=path.join(require('node:os').tmpdir(),'frontend-synthetic-run');return {name:'accessibility',directory,runId:identity.runId,selection:{project:'frontend-mocked',grep:'accessibility'},artifacts:[{name:'accessibility',path:path.join(directory,'accessibility.json'),runId:identity.runId,sha256:createHash('sha256').update(contents).digest('hex')}],readFile:()=>contents};}
test.each(['missing','empty object','empty suites','wrong project','wrong selection','wrong phase','duplicate artifact','no execution','wrong counters'])('actual phase producer/parser refuses %s despite valid proof in another phase',async kind=>{
  const raw=canonicalBrowserArtifact(),data=browserArtifactInput(raw);
  if(kind==='missing')data.artifacts=[];
  if(kind==='empty object')Object.assign(data,browserArtifactInput({}));
  if(kind==='empty suites')Object.assign(data,browserArtifactInput({...raw,suites:[]}));
  if(kind==='wrong project'){raw.suites[0].specs[0].tests[0].projectName='frontend-firefox-smoke';Object.assign(data,browserArtifactInput(raw));}
  if(kind==='wrong selection'){raw.suites[0].specs[0].title='layout not accessibility?';Object.assign(data,browserArtifactInput(raw));data.selection.grep='^required accessibility$';}
  if(kind==='wrong phase')data.artifacts[0].name='layout';
  if(kind==='duplicate artifact')data.artifacts.push({...data.artifacts[0]});
  if(kind==='no execution'){raw.suites[0].specs[0].tests[0].results=[];Object.assign(data,browserArtifactInput(raw));}
  if(kind==='wrong counters'){raw.stats.expected=99;Object.assign(data,browserArtifactInput(raw));}
  const phase=finishFrontendPhase({name:'accessibility',outcome:'passed',exitCode:0},data);
  expect(phase.exitCode).not.toBe(0);expect(phase.outcome).not.toBe('passed');expect(phase.reason).toMatch(/artifact/i);
  const parsed=parseBrowserPhaseArtifact(data);expect(parsed.issues.length).toBeGreaterThan(0);expect(parsed.entries).toHaveLength(0);
  const report=localReport();report.phases=report.phases.map((item:any)=>item.name==='accessibility'?phase:item);report.issues.push(...parsed.issues);
  expect(report.tests.some((test:any)=>test.testId===proof.testId&&test.outcome==='passed')).toBe(true);
  expect(await runFrontendCommand('gate',['--mocked-only'],injectedRunner({report}))).not.toBe(0);
});
test('canonical browser artifact binds selected executed tests to its exact phase',()=>{const data=browserArtifactInput();expect(finishFrontendPhase({name:'accessibility',outcome:'passed',exitCode:0},data)).toMatchObject({exitCode:0,outcome:'passed'});const parsed=parseBrowserPhaseArtifact(data);expect(parsed.issues).toEqual([]);expect(parsed.entries[0]).toMatchObject({phase:'accessibility',spec:{id:'test-a'},test:{projectName:'frontend-mocked'}});});
test.each([1,2,3])('repeatEach3 header requires exactly three actual executions, not %s claims',count=>{
  const raw=canonicalBrowserArtifact(),spec=raw.suites[0].specs[0];raw.config.projects[0].repeatEach=3;raw.suites[0].specs=Array.from({length:count},(_,index)=>({...spec,id:`test-repeat-${index}`}));raw.stats.expected=count;
  const data=browserArtifactInput(raw);data.selection.repeatEach=3;const parsed=parseBrowserPhaseArtifact(data);
  if(count===3){expect(parsed.issues).toEqual([]);expect(parsed.entries).toHaveLength(3);}else{expect(parsed.issues.length).toBeGreaterThan(0);expect(finishFrontendPhase({name:'accessibility',outcome:'passed',exitCode:0},data).exitCode).not.toBe(0);}
});
test('canonical JSON tag names reconcile the actual @tag grep selection',()=>{const raw=canonicalBrowserArtifact();raw.suites[0].specs[0].tags=['critical-smoke'];const data=browserArtifactInput(raw);data.selection.grep='@critical-smoke';expect(parseBrowserPhaseArtifact(data).issues).toEqual([]);});
test.each(['skipped','flaky','unexpected'])('child exit zero cannot demonstrate canonical %s browser outcomes',status=>{
  const raw=canonicalBrowserArtifact();raw.suites[0].specs[0].tests[0].status=status;raw.suites[0].specs[0].tests[0].results[0].status=status==='skipped'?'skipped':'failed';raw.stats.expected=0;raw.stats[status]=1;
  const data=browserArtifactInput(raw);expect(parseBrowserPhaseArtifact(data).issues).toEqual([]);expect(finishFrontendPhase({name:'accessibility',outcome:'passed',exitCode:0},data)).toMatchObject({outcome:'failed',exitCode:2});
});
function syntheticService(outcome:any={stopped:false,code:0,groupGone:true}) {return {result:Promise.resolve(outcome),stop:jest.fn(async()=>({stopped:true,code:0,groupGone:true}))};}
test('actual server launcher stops its Next sibling when TLS startup fails',async()=>{
  const next=syntheticService();const controller=new AbortController();
  await expect(serveOwnedFrontendProcesses({startNext:async()=>next,startTls:async()=>{throw new Error('TLS startup denied');},controller})).rejects.toThrow('TLS startup denied');
  expect(next.stop).toHaveBeenCalledTimes(1);expect(controller.signal.aborted).toBe(true);
});
test('actual server launcher treats any unexpected service exit as failure and verifies both stops',async()=>{
  const next=syntheticService(),tls=syntheticService();const controller=new AbortController();
  await expect(serveOwnedFrontendProcesses({startNext:async()=>next,startTls:async()=>tls,controller})).rejects.toThrow('unexpected');
  expect(next.stop).toHaveBeenCalledTimes(1);expect(tls.stop).toHaveBeenCalledTimes(1);expect(controller.signal.aborted).toBe(true);
});
function injectedResourceCleanup():any {
  const path=require('node:path'),directory=path.join(require('node:os').tmpdir(),'frontend-injected-records'),startedAt=Date.now()-1000,startedAtIso=new Date().toISOString();
  const tlsFile=path.join(directory,'tls-process.json'),resourceFile=tlsFile+'.resources.json',httpOrigin='http://127.0.0.1:4317',origin='https://127.0.0.1:4318',certificateDirectory='/synthetic-owned-certificate';
  const common={runId:'cleanup-current',startedAt:startedAtIso};
  const rows=new Map([[path.join(directory,'server-process.json'),{...common,groupId:100,origin:httpOrigin}],
    [tlsFile,{...common,groupId:200,kind:'frontend-local-tls',origin,upstreamOrigin:httpOrigin,certificateDirectory,resourceRecordFile:resourceFile}],
    [resourceFile,{...common,origin,upstreamOrigin:httpOrigin,certificateDirectory,processes:[{kind:'certificate',pid:201,groupId:201,groupGone:true},{kind:'proxy',pid:200,groupId:200,groupGone:true}]}]]);
  const alive=new Set([100,200,201]);const signalGroup=jest.fn((id:number)=>alive.delete(id));
  return {rows,alive,tlsFile,resourceFile,directory,startedAt,httpOrigin,runId:common.runId,browserAttempted:true,tlsRequired:true,
    io:{existsSync:(file:string)=>rows.has(file),readFileSync:(file:string)=>JSON.stringify(rows.get(file)),unlinkSync:(file:string)=>rows.delete(file)},
    groupExists:(id:number)=>alive.has(id),signalGroup,removeCertificate:jest.fn(),checkPort:jest.fn(async()=>{})};
}
test('actual fallback cleanup verifies Next TLS and OpenSSL groups plus both listeners, ignoring stored groupGone',async()=>{
  const deps=injectedResourceCleanup();expect(await cleanupFrontendResources(deps)).toMatchObject({outcome:'passed',exitCode:0});
  expect(deps.signalGroup.mock.calls.map((call:any)=>call[0]).sort()).toEqual([100,200,201]);expect(deps.alive.size).toBe(0);expect(deps.rows.size).toBe(0);
  expect(deps.removeCertificate).toHaveBeenCalledWith('/synthetic-owned-certificate','cleanup-current');expect(deps.checkPort.mock.calls).toEqual([[4317,'127.0.0.1'],[4318,'127.0.0.1']]);
});
test.each(['unowned server','stale TLS sidecar','certificate cleanup','listener cleanup'])('actual fallback %s cannot yield standalone success or widen ownership',async kind=>{
  const deps=injectedResourceCleanup();
  if(kind==='unowned server')deps.rows.get(require('node:path').join(deps.directory,'server-process.json')).runId='someone-else';
  if(kind==='stale TLS sidecar')deps.rows.get(deps.resourceFile).startedAt='2000-01-01T00:00:00Z';
  if(kind==='certificate cleanup')deps.removeCertificate.mockImplementation(()=>{throw new Error('Certificate owner mismatch');});
  if(kind==='listener cleanup')deps.checkPort.mockRejectedValue(new Error('Foreign listener remains'));
  const cleanup=await cleanupFrontendResources(deps);expect(cleanup.exitCode).not.toBe(0);
  const ops=injectedRunner();ops.cleanup=jest.fn(async()=>cleanup);expect(await runFrontendCommand('mocked',[],ops)).not.toBe(0);
  if(kind==='unowned server'){expect(deps.alive.has(100)).toBe(true);expect(deps.signalGroup.mock.calls.some((call:any)=>call[0]===100)).toBe(false);}
  if(kind==='stale TLS sidecar'){expect(deps.alive.has(200)).toBe(true);expect(deps.alive.has(201)).toBe(true);expect(deps.removeCertificate).not.toHaveBeenCalled();}
});
test('actual server launcher gracefully verifies both services on cancellation',async()=>{
  const controller=new AbortController();controller.abort();const next=syntheticService({stopped:true,groupGone:true}),tls=syntheticService({stopped:true,groupGone:true});
  expect(await serveOwnedFrontendProcesses({startNext:async()=>next,startTls:async()=>tls,controller})).toBe(0);expect(next.stop).toHaveBeenCalledTimes(1);expect(tls.stop).toHaveBeenCalledTimes(1);
});
test.each(['proxy','resources'])('fallback retains %s ownership when certificate directory is missing',async kind=>{
  const deps=injectedResourceCleanup();delete deps.rows.get(kind==='proxy'?deps.tlsFile:deps.resourceFile).certificateDirectory;
  if(kind==='proxy')deps.rows.delete(deps.resourceFile);else deps.rows.delete(deps.tlsFile);
  expect(await cleanupFrontendResources(deps)).toMatchObject({outcome:'failed',exitCode:1});expect(deps.rows.has(kind==='proxy'?deps.tlsFile:deps.resourceFile)).toBe(true);expect(deps.removeCertificate).not.toHaveBeenCalled();
});
test('fallback compares canonical loopback origins with trailing slash',async()=>{const deps=injectedResourceCleanup();deps.httpOrigin+='/' ;expect(await cleanupFrontendResources(deps)).toMatchObject({outcome:'passed',exitCode:0});});
