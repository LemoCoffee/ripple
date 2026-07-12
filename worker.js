export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    const path = url.pathname.replace(/^\/api/, '') || '/'
    const upstream = new URL(`https://resonance.flatgrass.net${path}${url.search}`)

    const headers = new Headers(request.headers)
    headers.set('User-Agent', 'Valve/Steam HTTP Client 1.0 GMod/13')

    if (request.headers.get('authorization')) {
      headers.set('Authorization', request.headers.get('authorization'))
    }

    const response = await fetch(upstream, {
      method: request.method,
      headers,
      body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
    })

    const newHeaders = new Headers(response.headers)
    newHeaders.set('Access-Control-Allow-Origin', '*')
    newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    newHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: newHeaders })
    }

    return new Response(response.body, {
      status: response.status,
      headers: newHeaders,
    })
  },
}
