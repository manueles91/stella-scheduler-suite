import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteLookupRequest {
  token: string;
}

export const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Invites-lookup function called, method:", req.method);
    console.log("Request headers:", Object.fromEntries(req.headers.entries()));
    
    const requestBody = await req.json();
    console.log("Request body:", requestBody);
    
    const { token } = requestBody as InviteLookupRequest;
    if (!token || typeof token !== "string") {
      return new Response(JSON.stringify({ error: "Missing token" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Missing Supabase env variables");
      return new Response(JSON.stringify({ error: "Server misconfiguration" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data, error } = await supabase
      .from("invited_users")
      .select("id, email, full_name, role, claimed_at, expires_at, invited_at")
      .eq("invite_token", token)
      .maybeSingle();

    if (error) {
      console.error("DB error:", error);
      return new Response(JSON.stringify({ error: "Invite not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    if (!data) {
      return new Response(JSON.stringify({ error: "Invite not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const now = new Date();
    const isExpired = data.expires_at ? new Date(data.expires_at) < now : false;
    const isClaimed = !!data.claimed_at;

    return new Response(
      JSON.stringify({
        email: data.email,
        full_name: data.full_name,
        role: data.role,
        invited_at: data.invited_at,
        expires_at: data.expires_at,
        claimed_at: data.claimed_at,
        status: isClaimed ? "claimed" : isExpired ? "expired" : "valid",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (e) {
    console.error("Unhandled error in invites-lookup:", e);
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);