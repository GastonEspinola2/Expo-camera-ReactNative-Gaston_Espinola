export type RecognizeOutcome =
  | { kind: 'ok'; cuil?: string; score?: number; raw?: any }
  | { kind: 'no_face'; raw?: any }
  | { kind: 'not_found'; raw?: any }
  | { kind: 'error'; message?: string; raw?: any };

type RegisterParams = { cuil: string; uri: string };
type RecognizeParams = { uri: string };

const BASE = 'https://ixk9cqrvwl5t.share.zrok.io';
const COMMON_HEADERS = { 'skip_zrok_interstitial': 'true' as const };

async function safeJson(res: Response) {
  try {
    const txt = await res.text();
    return txt ? JSON.parse(txt) : null;
  } catch {
    return null;
  }
}

export async function registerFace({ cuil, uri }: RegisterParams): Promise<{ success: boolean; raw?: any }> {
  const form = new FormData();
  form.append('cuil', cuil);
  form.append('image', { uri, name: 'photo.jpg', type: 'image/jpeg' } as any);

  const res = await fetch(`${BASE}/register`, {
    method: 'POST',
    headers: COMMON_HEADERS,
    body: form,
  });

  const data = await safeJson(res);

  const success =
    (data && (data.success === true || data.saved === true || data.registered === true)) ||
    (res.ok && data && (data.cuil || data.id || data.userId));

  if (!success) {
    const msg =
      (data && (data.message || data.detail)) ||
      `Registro falló (HTTP ${res.status})`;
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }

  return { success: true, raw: data };
}
export async function recognizeFace({ uri }: RecognizeParams): Promise<RecognizeOutcome> {
  const form = new FormData();
  form.append('image', { uri, name: 'photo.jpg', type: 'image/jpeg' } as any);

  let res: Response;
  try {
    res = await fetch(`${BASE}/recognize`, {
      method: 'POST',
      headers: COMMON_HEADERS,
      body: form,
    });
  } catch (e: any) {
    return { kind: 'error', message: e?.message, raw: null };
  }

  const data = await safeJson(res);
  const status = res.status;

  const msg = (v: any) => {
    if (!v) return '';
    const s =
      v.reason ||
      v.message ||
      v.detail ||
      (Array.isArray(v.detail) ? v.detail.map((d: any) => d?.msg).join(' ') : '');
    return (s || '').toString().toLowerCase();
  };

  const code = (data?.code || data?.status || '').toString().toLowerCase();
  const message = msg(data);
  if (
    status === 422 ||
    status === 400 ||
    code === 'no_face' ||
    /no\s*face|sin\s*rostro|no\s*es\s*rostro|face\s*not\s*detected/.test(message)
  ) {
    return { kind: 'no_face', raw: data };
  }

  const matches: any[] = Array.isArray(data?.matches) ? data.matches : [];
  let matchFromArray: string | undefined = undefined;
  for (const m of matches) {
    if (typeof m === 'string' || typeof m === 'number') {
      matchFromArray = String(m);
      break;
    } else if (m && typeof m === 'object') {
      const cand =
        m.cuil ?? m.dni ?? m.id ?? m.userId ?? m.label ?? m.subject ?? m.identity ?? undefined;
      if (cand) {
        matchFromArray = String(cand);
        break;
      }
    }
  }
  const success = Boolean(
    data?.success || data?.matched || data?.recognized || matches.length > 0 || (status >= 200 && status < 300)
  );
  const cuil =
    matchFromArray ??
    data?.cuil ??
    data?.dni ??
    data?.id ??
    data?.userId ??
    data?.label ??
    data?.subject ??
    data?.identity ??
    undefined;

  const scoreRaw = data?.score ?? data?.similarity ?? data?.confidence ?? undefined;
  const distance = data?.distance ?? undefined;
  const score =
    typeof scoreRaw === 'number'
      ? Number(scoreRaw)
      : typeof distance === 'number'
      ? 1 - Math.min(Math.max(distance, 0), 1)
      : undefined;

  if (success && cuil) {
    return { kind: 'ok', cuil: String(cuil), score: typeof score === 'number' ? score : undefined, raw: data };
  }

  if (success && !cuil) {
    return { kind: 'not_found', raw: data };
  }

  if (status === 404 || code === 'not_found' || /not\s*found|no\s*registrad/.test(message)) {
    return { kind: 'not_found', raw: data };
  }

  return { kind: 'error', message: message || `HTTP ${status}`, raw: data };
}
export async function isCuilRegistered(cuil: string): Promise<boolean | undefined> {
  const tryRequests = [
    { url: `${BASE}/exists/${encodeURIComponent(cuil)}`, method: 'GET' as const },
    { url: `${BASE}/exists?cuil=${encodeURIComponent(cuil)}`, method: 'GET' as const },
    { url: `${BASE}/registered?cuil=${encodeURIComponent(cuil)}`, method: 'GET' as const },
  ];

  for (const req of tryRequests) {
    try {
      const res = await fetch(req.url, { method: req.method, headers: COMMON_HEADERS });
      if (res.ok) {
        const data = await safeJson(res);
        const val =
          data?.exists ?? data?.registered ?? data?.found ?? data?.success ??
          (typeof data === 'boolean' ? data : undefined);
        if (typeof val === 'boolean') return val;
        return true;
      }
      if (res.status === 404) return false;
    } catch {
    }
  }

  return undefined;
}
