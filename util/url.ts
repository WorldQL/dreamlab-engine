type URLLike = string | URL;
function coerceToURL(url: URLLike) {
  if (typeof url === "string") {
    return new URL(url);
  }
  return url;
}

export function urlWithParams(url: URLLike, params: Record<string, string | undefined>): URL {
  url = coerceToURL(url);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, value);
  }
  return url;
}

export function urlToWebSocket(url: URLLike): URL {
  url = coerceToURL(url);
  if (url.protocol === "https:") url.protocol = "wss:";
  if (url.protocol === "http:") url.protocol = "ws:";
  return url;
}

export function urlToHTTP(url: URLLike): URL {
  url = coerceToURL(url);
  if (url.protocol === "wss:") url.protocol = "https:";
  if (url.protocol === "ws:") url.protocol = "http:";
  return url;
}
