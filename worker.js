export default {
  async fetch(request) {
    const url = new URL(request.url)

    if (!url.pathname.startsWith("/api/")) {
      return new Response("Not found", {
        status: 404
      })
    }

    const target =
      "https://resonance.flatgrass.net" +
      url.pathname.replace("/api", "") +
      url.search

    const response = await fetch(target, {
      method: request.method,
      headers: {
        "User-Agent": "Garry's Mod/13",
        "Authorization": request.headers.get("Authorization") ?? ""
      }
    })

    return new Response(response.body, {
      status: response.status,
      headers: response.headers
    })
  }
}