// ============================================================
// Cloudflare Worker — R2 sync proxy
// 部署方式: wrangler deploy
// ============================================================

export default {
  async fetch(request, env) {
    // CORS preflight — MUST be before auth check
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, PUT, HEAD, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Auth check
    const auth = request.headers.get('X-Auth-Token');
    if (!auth || auth !== env.AUTH_TOKEN) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const key = 'nav-data.json';

    // HEAD — connectivity test
    if (request.method === 'HEAD') {
      const obj = await env.NAV_BUCKET.head(key);
      return new Response(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'X-Data-Exists': obj ? 'true' : 'false',
        },
      });
    }

    // GET — pull data
    if (request.method === 'GET') {
      const obj = await env.NAV_BUCKET.get(key);
      if (!obj) {
        return new Response(JSON.stringify({}), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }
      return new Response(obj.body, {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // PUT — push data
    if (request.method === 'PUT') {
      await env.NAV_BUCKET.put(key, request.body, {
        httpMetadata: { contentType: 'application/json' },
      });
      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    return new Response('Method not allowed', {
      status: 405,
      headers: { 'Access-Control-Allow-Origin': '*' },
    });
  },
};
