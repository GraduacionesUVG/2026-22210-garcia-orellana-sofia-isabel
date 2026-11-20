import type { BrowserContext } from '@playwright/test';
import type { createMockApi, MockHandler, MockResponse } from './mock-api';

export type FaultScenario = 'offline' | 'delayed' | 'out-of-order' | 'malformed-json' | '401' | '403' | '409' | '429' | '503' | 'committed-response-lost';
export interface FaultCase { method: string; path: string; scenario: FaultScenario; occurrence: number }
type Api = ReturnType<typeof createMockApi>;
type Observation = { occurrence: number; method: string; path: string; body: any; scenario: FaultScenario | 'normal'; completed: boolean; aborted: boolean };
function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>(done => { resolve = done; });
  return { promise, resolve };
}
type Target = {
  api: Api; method: string; path: string; respond: MockHandler; seen: number; fault?: FaultCase;
  starts: Map<number, ReturnType<typeof deferred>>; holds: Map<number, ReturnType<typeof deferred>>;
  observations: Observation[]; abortRouteInstalled: boolean;
};
const bound = new WeakMap<BrowserContext, Map<string, Target>>();
const key = (method: string, path: string) => `${method.toUpperCase()} ${path}`;

/** Register a known local API response; unknown paths remain under the fixture's deny rule. */
export function registerFaultTarget(context: BrowserContext, input: { api: Api; method: string; path: string; respond: MockHandler }): void {
  if (!/^\/api\/[A-Za-z0-9_./-]+$/.test(input.path)) throw new Error('Fault targets must be exact local API paths without queries or remote URLs.');
  if (!/^(GET|POST|PATCH|DELETE|PUT)$/.test(input.method.toUpperCase())) throw new Error('Invalid fault method.');
  const targets = bound.get(context) ?? new Map<string, Target>(); bound.set(context, targets);
  const target: Target = { ...input, method: input.method.toUpperCase(), seen: 0, starts: new Map(), holds: new Map(), observations: [], abortRouteInstalled: false };
  targets.set(key(input.method, input.path), target);
  input.api.route(input.method, input.path, async request => {
    const occurrence = ++target.seen;
    const scenario = target.fault?.occurrence === occurrence ? target.fault.scenario : 'normal';
    const observation: Observation = { occurrence, method: request.method, path: request.path, body: request.body, scenario, completed: false, aborted: false };
    target.observations.push(observation);
    (target.starts.get(occurrence) ?? setDeferred(target.starts, occurrence)).resolve();
    const hold = target.holds.get(occurrence);
    if (hold) await hold.promise;
    let response: MockResponse;
    if (scenario === 'malformed-json') response = { status: 200, body: '{malformed', headers: { 'content-type': 'application/json' } };
    else if (/^(401|403|409|429|503)$/.test(scenario)) response = { status: Number(scenario), json: { ok: false, error: `Fallo sintético (${scenario}).` } };
    else response = await target.respond(request);
    observation.completed = true;
    return response;
  });
}
function setDeferred(map: Map<number, ReturnType<typeof deferred>>, occurrence: number) { const value = deferred(); map.set(occurrence, value); return value; }
function targetFor(context: BrowserContext, method: string, path: string) {
  const target = bound.get(context)?.get(key(method, path));
  if (!target) throw new Error(`Unregistered fault target: ${key(method, path)}`);
  return target;
}

export async function installFault(context: BrowserContext, input: FaultCase): Promise<void> {
  if (!Number.isSafeInteger(input.occurrence) || input.occurrence < 1) throw new Error('Fault occurrence must be a positive integer.');
  if (!['offline','delayed','out-of-order','malformed-json','401','403','409','429','503','committed-response-lost'].includes(input.scenario)) throw new Error('Unsupported fault scenario.');
  const target = targetFor(context, input.method, input.path);
  if (input.occurrence <= target.seen) throw new Error('Fault occurrence has already been observed.');
  target.fault = { ...input, method: input.method.toUpperCase() };
  if (input.scenario === 'delayed' || input.scenario === 'out-of-order') setDeferred(target.holds, input.occurrence);
  if ((input.scenario === 'offline' || input.scenario === 'committed-response-lost') && !target.abortRouteInstalled) {
    const localPage = context.pages().find(page => /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(page.url()));
    if (!localPage) throw new Error('A hydrated local page is required before installing a transport-abort fault.');
    const origin = new URL(localPage.url()).origin;
    target.abortRouteInstalled = true;
    await context.route(url => url.origin === origin && url.pathname === input.path, async route => {
      const request = route.request();
      if (request.method() !== target.method) return route.fallback();
      const next = target.seen + 1;
      const fault = target.fault?.occurrence === next ? target.fault.scenario : 'normal';
      if (fault === 'offline') {
        target.seen++;
        let body: any = null; try { body = request.postDataJSON(); } catch { /* GET has no body. */ }
        target.observations.push({ occurrence: next, method: target.method, path: target.path, body, scenario: fault, completed: true, aborted: true });
        (target.starts.get(next) ?? setDeferred(target.starts, next)).resolve();
        return route.abort('internetdisconnected');
      }
      if (fault === 'committed-response-lost') {
        // Dispatch exactly once: commit the known mock mutation, then lose its response.
        await target.api.dispatch(target.method, request.url(), request.postDataJSON());
        target.observations.at(-1)!.aborted = true;
        return route.abort('failed');
      }
      return route.fallback();
    });
  }
}

export function faultController(context: BrowserContext, method: string, path: string) {
  const target = targetFor(context, method, path);
  return {
    observations: target.observations,
    waitFor: (occurrence: number) => (target.starts.get(occurrence) ?? setDeferred(target.starts, occurrence)).promise,
    hold: (occurrence: number) => { if (occurrence <= target.seen) throw new Error('Cannot hold an already started request.'); setDeferred(target.holds, occurrence); },
    release: (occurrence: number) => { const barrier = target.holds.get(occurrence); if (!barrier) throw new Error('No response barrier for this occurrence.'); barrier.resolve(); },
    releaseAll: () => { for (const barrier of target.holds.values()) barrier.resolve(); },
  };
}
