/* Mocked server cannot inherit any remote host exception from backend config. */
const http = require('node:http');
const https = require('node:https');
const { createNetworkGuard } = require('../shared/no-external-network.cjs');
const guard = createNetworkGuard({ supabaseUrl: '', fetchImpl: globalThis.fetch.bind(globalThis), httpRequest: http.request, httpGet: http.get, httpsRequest: https.request, httpsGet: https.get });
globalThis.fetch = guard.fetch;
http.request = guard.httpRequest; http.get = guard.httpGet;
https.request = guard.httpsRequest; https.get = guard.httpsGet;
