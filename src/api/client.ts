const ENDPOINT = 'https://graphql.anilist.co';

export class AniListError extends Error {
  status: number;
  /** Seconds to wait, present when AniList rate-limits (~90 requests/min). */
  retryAfter?: number;

  constructor(message: string, status: number, retryAfter?: number) {
    super(message);
    this.name = 'AniListError';
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

let tokenGetter: () => string | null = () => null;
let onUnauthorized: () => void = () => {};

/** Lets the auth store hand the client the current bearer token without a circular import. */
export function setTokenGetter(fn: () => string | null) {
  tokenGetter = fn;
}

/** Called when AniList rejects the token, so the session can be cleared and the user sent to sign-in. */
export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn;
}

export async function gqlRequest<T>(
  query: string,
  variables: Record<string, unknown> = {},
  { signal }: { signal?: AbortSignal } = {}
): Promise<T> {
  const token = tokenGetter();
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
    signal,
  });

  if (res.status === 429) {
    const retryAfter = Number(res.headers.get('Retry-After') ?? 60);
    throw new AniListError('Rate limited by AniList. Try again shortly.', 429, retryAfter);
  }

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    // A rejected token can never recover on its own — drop the session so the app returns to sign-in.
    if (res.status === 401 && token) onUnauthorized();
    const message = json?.errors?.[0]?.message ?? `AniList request failed (${res.status})`;
    throw new AniListError(message, res.status);
  }
  if (json?.errors?.length) {
    throw new AniListError(json.errors[0].message ?? 'AniList returned an error', 200);
  }
  return json.data as T;
}
