/* eslint-disable @typescript-eslint/no-require-imports */
const http = require("node:http");
const https = require("node:https");

function destinationUrl(input, options, defaultProtocol) {
  if (input instanceof URL) return input;
  if (typeof input === "string") return new URL(input);

  const value = input && typeof input === "object" ? input : options;
  if (!value || typeof value !== "object") {
    throw new Error("Outbound network blocked: destination is not inspectable");
  }

  const protocol = value.protocol || defaultProtocol;
  const hostname = value.hostname || value.host;
  const port = value.port ? `:${value.port}` : "";
  const path = value.path || value.pathname || "/";
  return new URL(`${protocol}//${hostname}${port}${path}`);
}

function isAllowedDestination(input, supabaseUrl) {
  let destination;
  try {
    destination = destinationUrl(input, undefined, "https:");
  } catch {
    return false;
  }

  const hostname = destination.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (
    hostname === "localhost" ||
    hostname.endsWith(".localhost") ||
    hostname === "127.0.0.1" ||
    hostname === "::1"
  ) {
    return true;
  }

  if (!supabaseUrl) return false;
  try {
    return hostname === new URL(supabaseUrl).hostname.toLowerCase();
  } catch {
    return false;
  }
}

function blocked(destination) {
  const value = destination instanceof URL ? destination.href : String(destination);
  return new Error(`Outbound network blocked by test guard: ${value}`);
}

function createNetworkGuard(dependencies) {
  const {
    supabaseUrl,
    fetchImpl,
    httpRequest,
    httpGet,
    httpsRequest,
    httpsGet,
  } = dependencies;

  function guardedFetch(input, init) {
    const destination = input && typeof input === "object" && "url" in input
      ? input.url
      : input;
    if (!isAllowedDestination(destination, supabaseUrl)) {
      return Promise.reject(blocked(destination));
    }
    return fetchImpl(input, init);
  }

  function wrapRequest(transport, defaultProtocol) {
    return function guardedRequest(input, options) {
      const destination = destinationUrl(input, options, defaultProtocol);
      if (!isAllowedDestination(destination, supabaseUrl)) {
        throw blocked(destination);
      }
      return transport.apply(this, arguments);
    };
  }

  function wrapGet(transport, defaultProtocol) {
    return function guardedGet(input, options) {
      const destination = destinationUrl(input, options, defaultProtocol);
      if (!isAllowedDestination(destination, supabaseUrl)) {
        throw blocked(destination);
      }
      return transport.apply(this, arguments);
    };
  }

  return {
    fetch: guardedFetch,
    httpRequest: wrapRequest(httpRequest, "http:"),
    httpGet: wrapGet(httpGet, "http:"),
    httpsRequest: wrapRequest(httpsRequest, "https:"),
    httpsGet: wrapGet(httpsGet, "https:"),
  };
}

function installNetworkGuard() {
  const fetchImpl = globalThis.fetch;
  if (typeof fetchImpl !== "function") {
    throw new Error("No global fetch implementation available for network guard");
  }

  const guard = createNetworkGuard({
    supabaseUrl:
      process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "",
    fetchImpl: fetchImpl.bind(globalThis),
    httpRequest: http.request,
    httpGet: http.get,
    httpsRequest: https.request,
    httpsGet: https.get,
  });

  globalThis.fetch = guard.fetch;
  http.request = guard.httpRequest;
  http.get = guard.httpGet;
  https.request = guard.httpsRequest;
  https.get = guard.httpsGet;
}

if (process.env.BACKEND_NO_EXTERNAL_NETWORK === "1") {
  installNetworkGuard();
}

module.exports = {
  createNetworkGuard,
  installNetworkGuard,
  isAllowedDestination,
};
