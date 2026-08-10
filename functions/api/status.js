const KV_KEY = 'offline_mode';

const NO_STORE_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store, max-age=0',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: NO_STORE_HEADERS,
  });
}

function defaultStatus() {
  return {
    offline: false,
    updatedAt: null,
  };
}

async function readStatus(env) {
  if (!env.STATUS_KV) {
    return { error: 'Service unavailable', status: 503 };
  }

  const raw = await env.STATUS_KV.get(KV_KEY);
  if (!raw) {
    return { data: defaultStatus() };
  }

  try {
    const parsed = JSON.parse(raw);
    return {
      data: {
        offline: Boolean(parsed.offline),
        updatedAt: parsed.updatedAt || null,
      },
    };
  } catch {
    return { data: defaultStatus() };
  }
}

function passwordsMatch(provided, expected) {
  if (typeof provided !== 'string' || typeof expected !== 'string') {
    return false;
  }
  if (provided.length !== expected.length) {
    return false;
  }

  let mismatch = 0;
  for (let i = 0; i < provided.length; i++) {
    mismatch |= provided.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function onRequestGet(context) {
  const result = await readStatus(context.env);
  if (result.error) {
    return json({ error: result.error }, result.status);
  }
  return json(result.data);
}

export async function onRequestPost(context) {
  const { env } = context;

  if (!env.STATUS_PASSWORD) {
    return json({ error: 'Service unavailable' }, 503);
  }
  if (!env.STATUS_KV) {
    return json({ error: 'Service unavailable' }, 503);
  }

  let body;
  try {
    body = await context.request.json();
  } catch {
    return json({ error: 'Invalid request' }, 400);
  }

  if (!passwordsMatch(body && body.password, env.STATUS_PASSWORD)) {
    return json({ error: 'Unauthorized' }, 401);
  }

  if (typeof (body && body.offline) !== 'boolean') {
    return json({ error: 'Invalid request' }, 400);
  }

  const next = {
    offline: body.offline,
    updatedAt: new Date().toISOString(),
  };

  await env.STATUS_KV.put(KV_KEY, JSON.stringify(next));
  return json(next);
}
