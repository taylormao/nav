// ============================================================
// Cloudflare Worker — R2 sync proxy
// 部署方式: wrangler deploy
// 需要先创建 R2 bucket: wrangler r2 bucket create nav-data
// 配置 wrangler.toml 中的 bindings
// ============================================================

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const key = 'nav-data.json';

    // Simple shared-secret auth
    const auth = request.headers.get('X-Auth-Token');
    if (!auth || auth !== env.AUTH_TOKEN) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, PUT, HEAD, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
        },
      });
    }

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
          'ETag': obj.httpEtag,
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
