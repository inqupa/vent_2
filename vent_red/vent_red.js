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

    return new Response("Not Found", { status: 404 });
  }
};