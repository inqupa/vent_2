export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/api/vent") {
      const payload = await request.json();
      const id = crypto.randomUUID();
      
      await env.vent_black.prepare(
        "INSERT INTO vents (id, content, vent_month_year) VALUES (?, ?, ?)"
      ).bind(id, payload.content, payload.vent_month_year).run();

      return new Response(JSON.stringify({ success: true, id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Handle Magic Link Generation (Login & Register)
    if (request.method === 'POST' && url.pathname === '/api/auth/magic-link') {
      try {
        const data = await request.json();
        const { email } = data;

        if (!email) {
            return new Response(JSON.stringify({ error: 'Email required' }), { status: 400 });
        }

        // 1. Ensure user exists (Register if new)
        const userCheck = await env.vent_black.prepare("SELECT id FROM solvers WHERE email = ?").bind(email).first();
        if (!userCheck) {
            const newId = crypto.randomUUID();
            await env.vent_black.prepare("INSERT INTO solvers (id, email) VALUES (?, ?)").bind(newId, email).run();
        }

        // 2. Generate a secure token and set expiration (15 minutes from now)
        // Using two UUIDs combined makes it harder to brute-force
        const token = crypto.randomUUID() + crypto.randomUUID(); 
        const expiresAt = new Date(Date.now() + 15 * 60000).toISOString();

        // 3. Save the token to the database
        await env.vent_black.prepare(
            "INSERT INTO magic_links (token, email, expires_at) VALUES (?, ?, ?)"
        ).bind(token, email, expiresAt).run();

        // 4. "Send" the email (For local development, we output it directly)
        const magicLink = `http://localhost:8787/api/auth/verify?token=${token}`;
        console.log(`[EMAIL SIMULATOR] Send to ${email}: ${magicLink}`);

        return new Response(JSON.stringify({ 
            message: "Check your email for the login link!",
            dev_link: magicLink // Included for easy local testing
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error("Auth Error:", error.message);
        return new Response(JSON.stringify({ error: 'Failed to generate link' }), { status: 500 });
      }
    }

    // Handle Magic Link Verification
    if (request.method === 'GET' && url.pathname === '/api/auth/verify') {
      try {
          const token = url.searchParams.get('token');
          if (!token) return new Response("Missing token", { status: 400 });

          // 1. Verify token exists
          const linkRecord = await env.vent_black.prepare(
              "SELECT email, expires_at FROM magic_links WHERE token = ?"
          ).bind(token).first();

          if (!linkRecord) {
              return new Response("Invalid or already used link.", { status: 401 });
          }

          // 2. Check if expired
          if (new Date(linkRecord.expires_at) < new Date()) {
              await env.vent_black.prepare("DELETE FROM magic_links WHERE token = ?").bind(token).run();
              return new Response("Link expired. Please request a new one.", { status: 401 });
          }

          // 3. Get the user ID
          const user = await env.vent_black.prepare(
              "SELECT id FROM solvers WHERE email = ?"
          ).bind(linkRecord.email).first();

          // 4. Burn the token (Single-use security)
          await env.vent_black.prepare("DELETE FROM magic_links WHERE token = ?").bind(token).run();

          // 5. Log the user in via a secure HTTP-Only cookie and redirect to profile
          const cookie = `vent_session=${user.id}; HttpOnly; Path=/; Max-Age=604800; SameSite=Lax`;
          
          return new Response(null, {
              status: 302,
              headers: {
                  'Location': '/skeleton/profile_placeholder.html',
                  'Set-Cookie': cookie
              }
          });
      } catch (error) {
          console.error("Verification Error:", error.message);
          return new Response("Server error during verification", { status: 500 });
      }
    }

    // Handle Fetching Current User
    if (request.method === 'GET' && url.pathname === '/api/user/me') {
        const cookieHeader = request.headers.get('Cookie');
        if (!cookieHeader || !cookieHeader.includes('vent_session=')) {
            return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401 });
        }

        const sessionId = cookieHeader.split('vent_session=')[1].split(';')[0];

        try {
            const user = await env.vent_black.prepare(
                "SELECT id, email, created_at FROM solvers WHERE id = ?"
            ).bind(sessionId).first();

            if (!user) return new Response(JSON.stringify({ error: "User not found" }), { status: 404 });

            return new Response(JSON.stringify({
                name: user.email.split('@')[0],
                email: user.email,
                joined: user.created_at
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        } catch (error) {
            return new Response(JSON.stringify({ error: "Server error" }), { status: 500 });
        }
    }

    return new Response("Not Found", { status: 404 });
  }
};