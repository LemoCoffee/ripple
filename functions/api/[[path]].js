export async function onRequest(context) {
    const url = new URL(context.request.url);

    const target =
        "https://resonance.flatgrass.net/" +
        url.pathname.replace(/^\/api\//, "") +
        url.search;

    const response = await fetch(target, {
        method: context.request.method,
        headers: {
            "User-Agent": "Valve/Steam HTTP Client 1.0 GMod/13",
            "Authorization":
                context.request.headers.get("Authorization") ?? "",
        },
    });

    return new Response(response.body, {
        status: response.status,
        headers: response.headers,
    });
}