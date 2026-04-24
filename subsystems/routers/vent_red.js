// --- 1. NATIVE ROUTER CORE ---
class SimpleRouter {
    constructor() {
        this.routes = [];
    }

    add(method, path, handler) {
        const paramNames = [];
        const regexPath = path.replace(/:([^\/]+)/g, (_, paramName) => {
            paramNames.push(paramName);
            return '([^/]+)';
        });
        this.routes.push({ method, regex: new RegExp(`^${regexPath}$`), handler, paramNames });
    }

    get(path, handler) { this.add('GET', path, handler); }
    post(path, handler) { this.add('POST', path, handler); }
    delete(path, handler) { this.add('DELETE', path, handler); }

    async handle(request, env) {
        const url = new URL(request.url);

        // Define CORS dynamically based on the incoming request
        const allowedOrigins = ['http://localhost:8787', 'https://vent.inqupa.workers.dev'];
        const origin = request.headers.get('Origin');
        const isAllowedOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
        
        const corsHeaders = {
            "Access-Control-Allow-Origin": isAllowedOrigin,
            "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, X-CSRF-Token, Cookie",
            "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;"
        };

        if (request.method === "OPTIONS") {
            return new Response(null, { status: 204, headers: corsHeaders });
        }

        for (const route of this.routes) {
            if (route.method === request.method) {
                const match = url.pathname.match(route.regex);
                if (match) {
                    request.params = {};
                    route.paramNames.forEach((name, i) => {
                        request.params[name] = match[i + 1];
                    });

                    try {
                        const response = await route.handler(request, env, url);
                        const newResponse = new Response(response.body, response);
                        Object.entries(corsHeaders).forEach(([k, v]) => newResponse.headers.set(k, v));
                        return newResponse;
                    } catch (error) {
                        console.error("Route Error:", error);
                        return new Response(JSON.stringify({ error: "Internal Server Error" }), { 
                            status: 500, 
                            headers: { ...corsHeaders, "Content-Type": "application/json" } 
                        });
                    }
                }
            }
        }
        return new Response("Not Found", { status: 404, headers: corsHeaders });
    }
}

const router = new SimpleRouter();

// --- 2. API ENDPOINTS ---

// Developer God Mode Toggle
router.get('/api/dev/godmode', (request, env, url) => {
    const enable = url.searchParams.get('enable') === 'true';
    let headers = new Headers();
    headers.set("Set-Cookie", enable ? "vent_godmode=true; Path=/; Max-Age=31536000; SameSite=Lax" : "vent_godmode=; Path=/; Max-Age=0; SameSite=Lax");
    return new Response(enable ? "God mode enabled." : "God mode disabled.", { status: 200, headers });
});

// Handle New Vent Submission
router.post('/api/vent', async (request, env) => {
    const payload = await request.json();
    if (!payload.content || typeof payload.content !== 'string' || payload.content.trim().length === 0) {
        return new Response(JSON.stringify({ error: "Vent content cannot be empty." }), { status: 400 });
    }
    if (payload.content.length > 10000) {
        return new Response(JSON.stringify({ error: "Vent is too long (max 10000 characters)." }), { status: 400 });
    }
    
    const ventTrackingId = crypto.randomUUID(); 
    let solverId = null;
    let isTest = 0;
    const cookieHeader = request.headers.get('Cookie');

    if (cookieHeader) {
        if (cookieHeader.includes('vent_session=')) solverId = cookieHeader.split('vent_session=')[1].split(';')[0];
        if (cookieHeader.includes('vent_godmode=true')) isTest = 1; 
    }
    
    await env.vent_black.prepare(
        "INSERT INTO vents (id, content, vent_month_year, solver_id, is_test) VALUES (?, ?, ?, ?, ?)"
    ).bind(ventTrackingId, payload.content, payload.vent_month_year, solverId, isTest).run();

    return new Response(JSON.stringify({ success: true, trackingId: ventTrackingId, message: "Vent submitted securely." }), { status: 200 });
});

// Enforce Problem Page Limit
router.get('/api/problems/access', async (request, env, url) => {
    const cookieHeader = request.headers.get('Cookie') || "";
    const isPeek = url.searchParams.get('peek') === 'true';
    
    if (cookieHeader.includes('vent_godmode=true')) {
        return new Response(JSON.stringify({ access: "granted", viewsLeft: "Infinite" }), { status: 200 });
    }

    if (cookieHeader.includes('vent_session=')) {
        return new Response(JSON.stringify({ access: "granted" }), { status: 200 });
    }

    let anonToken = null;
    if (cookieHeader.includes('anon_shadow=')) {
        anonToken = cookieHeader.split('anon_shadow=')[1].split(';')[0];
    }

    let headers = new Headers({ "Content-Type": "application/json" });

    if (!anonToken) {
        if (isPeek) return new Response(JSON.stringify({ access: "granted", viewsLeft: 10 }), { status: 200, headers });
        anonToken = crypto.randomUUID();
        await env.vent_black.prepare("INSERT INTO anonymous_visitors (id, problem_views) VALUES (?, 1)").bind(anonToken).run();
        headers.set("Set-Cookie", `anon_shadow=${anonToken}; HttpOnly; Path=/; Max-Age=31536000; SameSite=Lax`);
        return new Response(JSON.stringify({ access: "granted", viewsLeft: 9 }), { status: 200, headers });
    } else {
        const visitor = await env.vent_black.prepare("SELECT problem_views FROM anonymous_visitors WHERE id = ?").bind(anonToken).first();
        if (!visitor) {
            if (isPeek) return new Response(JSON.stringify({ access: "granted", viewsLeft: 10 }), { status: 200, headers });
            await env.vent_black.prepare("INSERT INTO anonymous_visitors (id, problem_views) VALUES (?, 1)").bind(anonToken).run();
            return new Response(JSON.stringify({ access: "granted", viewsLeft: 9 }), { status: 200, headers });
        }
        if (visitor.problem_views >= 10) {
            return new Response(JSON.stringify({ error: "Limit reached", requireAuth: true }), { status: 403, headers });
        }
        if (!isPeek) {
            await env.vent_black.prepare("UPDATE anonymous_visitors SET problem_views = problem_views + 1 WHERE id = ?").bind(anonToken).run();
            return new Response(JSON.stringify({ access: "granted", viewsLeft: 9 - visitor.problem_views }), { status: 200, headers });
        } else {
            return new Response(JSON.stringify({ access: "granted", viewsLeft: 10 - visitor.problem_views }), { status: 200, headers });
        }
    }
});

// Fetch All Vents
router.get('/api/vents', async (request, env) => {
    const { results } = await env.vent_black.prepare("SELECT id, content, vent_month_year, created_at, is_test FROM vents ORDER BY created_at DESC").all();
    return new Response(JSON.stringify(results), { status: 200 });
});

// CSRF Token Generation
router.get('/api/csrf-token', () => {
    const token = crypto.randomUUID();
    let headers = new Headers({ "Content-Type": "application/json" });
    headers.set("Set-Cookie", `csrf_token=${token}; Path=/; SameSite=Strict; Max-Age=86400`);
    return new Response(JSON.stringify({ csrfToken: token }), { status: 200, headers });
});

// Handle Magic Link Generation
router.post('/api/auth/magic-link', async (request, env) => {
    const data = await request.json();
    const { email } = data;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email) || email.length > 100) {
        return new Response(JSON.stringify({ error: 'Valid email required' }), { status: 400 });
    }

    const recentLink = await env.vent_black.prepare("SELECT created_at FROM magic_links WHERE email = ? ORDER BY created_at DESC LIMIT 1").bind(email).first();
    if (recentLink) {
        const dbTimeUTC = new Date(recentLink.created_at + 'Z').getTime();
        const timeSinceLastLink = Date.now() - dbTimeUTC;
        if (timeSinceLastLink < 60000) { 
            return new Response(JSON.stringify({ error: 'Please wait 60 seconds before requesting another link.' }), { status: 429 });
        }
    }

    const userCheck = await env.vent_black.prepare("SELECT id FROM solvers WHERE email = ?").bind(email).first();
    if (!userCheck) {
        const newId = crypto.randomUUID();
        await env.vent_black.prepare("INSERT INTO solvers (id, email) VALUES (?, ?)").bind(newId, email).run();
    }

    const token = crypto.randomUUID() + crypto.randomUUID(); 
    const expiresAt = new Date(Date.now() + 15 * 60000).toISOString();
    await env.vent_black.prepare("INSERT INTO magic_links (token, email, expires_at) VALUES (?, ?, ?)").bind(token, email, expiresAt).run();

    const magicLink = `http://localhost:8787/api/auth/verify?token=${token}`;
    console.log(`[EMAIL SIMULATOR] Send to ${email}: ${magicLink}`);
    return new Response(JSON.stringify({ message: "Check your email for the login link!", dev_link: magicLink }), { status: 200, headers: { 'Content-Type': 'application/json' } });
});

// Handle Magic Link Verification
router.get('/api/auth/verify', async (request, env, url) => {
    const token = url.searchParams.get('token');
    if (!token) return new Response("Missing token", { status: 400 });

    const linkRecord = await env.vent_black.prepare("SELECT email, expires_at FROM magic_links WHERE token = ?").bind(token).first();
    if (!linkRecord) return new Response("Invalid or already used link.", { status: 401 });

    if (new Date(linkRecord.expires_at) < new Date()) {
        await env.vent_black.prepare("DELETE FROM magic_links WHERE token = ?").bind(token).run();
        return new Response("Link expired. Please request a new one.", { status: 401 });
    }

    const user = await env.vent_black.prepare("SELECT id FROM solvers WHERE email = ?").bind(linkRecord.email).first();
    await env.vent_black.prepare("DELETE FROM magic_links WHERE token = ?").bind(token).run();

    const cookie = `vent_session=${user.id}; HttpOnly; Path=/; Max-Age=604800; SameSite=Lax`;
    return new Response(null, { status: 302, headers: { 'Location': '/skeleton/profile_placeholder.html', 'Set-Cookie': cookie } });
});

// Fetch Current User
router.get('/api/user/me', async (request, env) => {
    const cookieHeader = request.headers.get('Cookie');
    if (!cookieHeader || !cookieHeader.includes('vent_session=')) return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401 });

    const sessionId = cookieHeader.split('vent_session=')[1].split(';')[0];
    const user = await env.vent_black.prepare("SELECT id, email, created_at FROM solvers WHERE id = ?").bind(sessionId).first();
    
    if (!user) return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });
    return new Response(JSON.stringify({ name: user.email.split('@')[0], email: user.email, joined: user.created_at }), { status: 200, headers: { 'Content-Type': 'application/json' } });
});

// Fetch Current User's Vents
router.get('/api/user/vents', async (request, env) => {
    const cookieHeader = request.headers.get('Cookie');
    if (!cookieHeader || !cookieHeader.includes('vent_session=')) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    const solverId = cookieHeader.split('vent_session=')[1].split(';')[0];
    const { results } = await env.vent_black.prepare("SELECT id, content, vent_month_year, created_at FROM vents WHERE solver_id = ? ORDER BY created_at DESC").bind(solverId).all();
    return new Response(JSON.stringify(results), { status: 200, headers: { 'Content-Type': 'application/json' } });
});

// Delete a Vent
router.delete('/api/vent/:id', async (request, env) => {
    const cookieHeader = request.headers.get('Cookie');
    if (!cookieHeader || !cookieHeader.includes('vent_session=')) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    
    const csrfHeader = request.headers.get('X-CSRF-Token');
    const csrfCookieMatch = cookieHeader.match(/csrf_token=([^;]+)/);
    if (!csrfHeader || !csrfCookieMatch || csrfHeader !== csrfCookieMatch[1]) {
        return new Response(JSON.stringify({ error: "Forbidden: CSRF token missing" }), { status: 403 });
    }

    const solverId = cookieHeader.split('vent_session=')[1].split(';')[0];
    const ventId = request.params.id; 

    const targetVent = await env.vent_black.prepare("SELECT solver_id FROM vents WHERE id = ?").bind(ventId).first();
    if (!targetVent || targetVent.solver_id !== solverId) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403 });

    await env.vent_black.prepare("DELETE FROM vents WHERE id = ?").bind(ventId).run();
    return new Response(JSON.stringify({ success: true, message: "Vent deleted." }), { status: 200 });
});

// --- 3. EXPORT HANDLER ---
export default {
    fetch: (request, env) => router.handle(request, env)
};