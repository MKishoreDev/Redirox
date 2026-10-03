/**
 * Cloudflare Pages Functions Router for Redirox
 * Handles /shorten, /info/:code, /verify/:code, and /:code redirects on Cloudflare Pages.
 */

// Edge in-memory fallback cache across warm worker isolates
if (!globalThis.__REDIROX_CACHE__) {
    globalThis.__REDIROX_CACHE__ = new Map();
}
const cache = globalThis.__REDIROX_CACHE__;

// Generate 6-char alphanumeric code
function generateCode() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Simple hash for password protection using Web Crypto
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + "redirox_salt");
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// Helper to get link data from KV or in-memory cache
async function getLink(code, env) {
    if (!code) return null;
    
    // 1. Check in-memory isolate cache
    if (cache.has(code)) {
        return cache.get(code);
    }

    // 2. Check Cloudflare KV if bound
    const kv = env ? (env.REDIROX_KV || env.KV) : null;
    if (kv) {
        try {
            const raw = await kv.get(`link:${code}`);
            if (raw) {
                const data = JSON.parse(raw);
                cache.set(code, data);
                return data;
            }
        } catch (e) {
            console.error("KV read error:", e);
        }
    }

    return null;
}

// Helper to save link data to KV and in-memory cache
async function saveLink(code, linkData, env) {
    cache.set(code, linkData);
    
    const kv = env ? (env.REDIROX_KV || env.KV) : null;
    if (kv) {
        try {
            await kv.put(`link:${code}`, JSON.stringify(linkData));
        } catch (e) {
            console.error("KV write error:", e);
        }
    }
}

export async function onRequest(context) {
    const { request, env, params } = context;
    const url = new URL(request.url);
    const pathname = url.pathname;
    const method = request.method;

    // Static asset passthrough
    const staticExtensions = [".css", ".js", ".png", ".jpg", ".jpeg", ".ico", ".svg", ".woff2", ".map", ".json", ".txt"];
    if (
        pathname === "/" ||
        pathname === "/docs" ||
        pathname === "/docs.html" ||
        pathname === "/password" ||
        pathname === "/password.html" ||
        pathname === "/404" ||
        pathname === "/404.html" ||
        pathname.startsWith("/static/") ||
        staticExtensions.some(ext => pathname.endsWith(ext))
    ) {
        return context.next();
    }

    // CORS headers
    const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
    };

    if (method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    // If an external backend URL is configured in Pages environment variables, proxy API calls
    if (env && env.BACKEND_URL) {
        const backendBase = env.BACKEND_URL.replace(/\/$/, "");
        const targetUrl = new URL(pathname + url.search, backendBase);
        const headers = new Headers(request.headers);
        headers.set("Host", targetUrl.host);
        
        try {
            const resp = await fetch(targetUrl.toString(), {
                method: request.method,
                headers: headers,
                body: request.body,
                redirect: "manual",
            });
            if (resp.status !== 404 && resp.status !== 405) {
                return resp;
            }
        } catch (proxyErr) {
            console.error("Backend proxy error:", proxyErr);
        }
    }

    // 1. POST /shorten
    if (pathname === "/shorten" && method === "POST") {
        let body = {};
        try {
            body = await request.json();
        } catch (e) {
            return new Response(JSON.stringify({ error: "Invalid JSON payload" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        const rawUrl = (body.url || "").trim();
        const password = (body.password || "").trim();
        const expiresAt = (body.expires_at || "").trim();
        const generateQr = Boolean(body.generate_qr);

        if (!rawUrl) {
            return new Response(JSON.stringify({ error: "URL is required" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        if (!rawUrl.startsWith("http://") && !rawUrl.startsWith("https://")) {
            return new Response(JSON.stringify({ error: "URL must start with http:// or https://" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        let expirationDate = null;
        if (expiresAt) {
            const d = new Date(expiresAt);
            if (isNaN(d.getTime())) {
                return new Response(JSON.stringify({ error: "Invalid expiration date format" }), {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }
            if (d <= new Date()) {
                return new Response(JSON.stringify({ error: "Expiration date must be in the future" }), {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" }
                });
            }
            expirationDate = d.toISOString();
        }

        const code = generateCode();
        const passwordHash = password ? await hashPassword(password) : null;
        const shortUrl = `${url.origin}/${code}`;

        const linkData = {
            code,
            short_url: shortUrl,
            url: rawUrl,
            has_password: Boolean(password),
            password_hash: passwordHash,
            expires_at: expirationDate,
            created_at: new Date().toISOString(),
            visits: 0,
        };

        await saveLink(code, linkData, env);

        // QR Code generation
        let qrCodeData = null;
        if (generateQr) {
            qrCodeData = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(shortUrl)}`;
        }

        return new Response(JSON.stringify({
            code: linkData.code,
            short_url: linkData.short_url,
            url: linkData.url,
            qr_code: qrCodeData,
            expires_at: linkData.expires_at,
            has_password: linkData.has_password,
        }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }

    // 2. GET /info/:code
    if (pathname.startsWith("/info/") && method === "GET") {
        const code = pathname.replace("/info/", "").trim().split("/")[0];
        if (!code) {
            return new Response(JSON.stringify({ error: "Code is required" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        const linkData = await getLink(code, env);
        if (!linkData) {
            return new Response(JSON.stringify({ error: "Link not found" }), {
                status: 404,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        return new Response(JSON.stringify({
            code: linkData.code,
            url: linkData.url,
            visits: linkData.visits || 0,
            created_at: linkData.created_at,
            expires_at: linkData.expires_at,
            has_password: Boolean(linkData.has_password),
        }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }

    // 3. POST /verify/:code
    if (pathname.startsWith("/verify/") && method === "POST") {
        const code = pathname.replace("/verify/", "").trim().split("/")[0];
        let body = {};
        try {
            body = await request.json();
        } catch (e) {
            body = {};
        }

        const password = (body.password || "").trim();
        const linkData = await getLink(code, env);

        if (!linkData) {
            return new Response(JSON.stringify({ error: "Link not found" }), {
                status: 404,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        if (!linkData.has_password) {
            return new Response(JSON.stringify({ success: true, url: linkData.url }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        const hash = await hashPassword(password);
        if (hash !== linkData.password_hash) {
            return new Response(JSON.stringify({ error: "Invalid password" }), {
                status: 401,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        return new Response(JSON.stringify({ success: true, url: linkData.url }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }

    // 4. GET /:code (Redirect)
    if (method === "GET") {
        const code = pathname.replace(/^\//, "").split("/")[0];
        if (code && code.length >= 4 && !code.includes(".")) {
            const linkData = await getLink(code, env);

            if (linkData) {
                // Check expiration
                if (linkData.expires_at && new Date(linkData.expires_at) <= new Date()) {
                    const kv = env ? (env.REDIROX_KV || env.KV) : null;
                    if (kv) await kv.delete(`link:${code}`);
                    cache.delete(code);
                    return Response.redirect(`${url.origin}/404.html`, 302);
                }

                // Check password
                if (linkData.has_password) {
                    const providedPassword = url.searchParams.get("password");
                    if (!providedPassword) {
                        return Response.redirect(`${url.origin}/password.html?code=${code}`, 302);
                    }
                    const hash = await hashPassword(providedPassword);
                    if (hash !== linkData.password_hash) {
                        return Response.redirect(`${url.origin}/password.html?code=${code}`, 302);
                    }
                }

                // Increment visit count
                linkData.visits = (linkData.visits || 0) + 1;
                await saveLink(code, linkData, env);

                return Response.redirect(linkData.url, 302);
            }
        }
    }

    return context.next();
}
