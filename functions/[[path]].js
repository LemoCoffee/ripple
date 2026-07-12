export async function onRequest(context) {
  const { request, params } = context
  const url = new URL(request.url)
  const upstream = new URL(`https://resonance.flatgrass.net${url.pathname.replace(/^\/api/, '')}${url.search}`)

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

  const responseHeaders = new Headers(response.headers)
  responseHeaders.set('Access-Control-Allow-Origin', '*')
  responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: responseHeaders })
  }

  return new Response(response.body, {
    status: response.status,
    headers: responseHeaders,
  })
}
