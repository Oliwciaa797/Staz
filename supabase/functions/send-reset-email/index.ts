// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "@supabase/server";

console.log("Hello from Functions!");

// This endpoint uses 'publishable' | 'secret' access, apiKey is required.
// Use publishable for Client-facing, key-validated endpoints
// Use secret for Server-to-server, internal calls
export default {
  fetch: withSupabase({ auth: ["publishable", "secret"] }, async (req, ctx) => {
    // Called by another service with a secret key
    // ctx.supabaseAdmin bypasses RLS — use for privileged operations
    /*
    if (ctx.authMode === "secret") {
      const { user_id } = await req.json();
      const { data } = await ctx.supabaseAdmin.auth.admin.getUserById(user_id);

      return Response.json({
        email: data?.user?.email,
      });
    }
    */

    const { name } = await req.json();

    return Response.json({
      message: `Hello ${name}!`,
    });
  }),
};

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/send-reset-email' \
    --header 'apiKey: sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH' \
    --data '{"name":"Functions"}'

*/
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders() });
    }

    try {
        const { email, redirectTo } = await req.json();

        if (!email) {
            return jsonResponse({ error: 'Brak adresu e-mail.' }, 400);
        }

        const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

        // 1. Poproś Supabase o wygenerowanie bezpiecznego linku resetującego
        const { data, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'recovery',
            email: email,
            options: {
                redirectTo: redirectTo || undefined,
            },
        });

        if (linkError) {
            return jsonResponse({ error: linkError.message }, 400);
        }

        const resetLink = data.properties.action_link;

        // 2. Wyślij ten link przez Resend, w ładnym szablonie HTML
        const emailHtml = buildEmailHtml(resetLink);

        const resendRes = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${RESEND_API_KEY}`,
            },
            body: JSON.stringify({
                from: 'onboarding@resend.dev',
                to: email,
                subject: 'Resetowanie hasła',
                html: emailHtml,
            }),
        });

        const resendData = await resendRes.json();

        if (!resendRes.ok) {
            return jsonResponse({ error: resendData }, 500);
        }

        return jsonResponse({ success: true, id: resendData.id }, 200);

    } catch (err) {
        return jsonResponse({ error: String(err) }, 500);
    }
});

function buildEmailHtml(resetLink: string) {
    return `
<!DOCTYPE html>
<html lang="pl">
<body style="margin:0; padding:0; background-color:#f4f4f7; font-family: Arial, Helvetica, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7; padding:40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:12px; overflow:hidden;">
          <tr>
            <td style="background-color:#2d4a1e; padding:32px; text-align:center;">
              <h1 style="margin:0; color:#ffffff; font-size:22px;">Resetowanie hasła</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 20px 0; color:#333; font-size:15px; line-height:1.6;">
                Kliknij przycisk poniżej, aby ustawić nowe hasło. Link jest ważny przez ograniczony czas.
              </p>
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="border-radius:8px; background-color:#2d4a1e;">
                    <a href="${resetLink}" target="_blank"
                       style="display:inline-block; padding:14px 32px; font-size:15px; font-weight:600; color:#ffffff; text-decoration:none; border-radius:8px;">
                      Zresetuj hasło
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0 0; color:#999; font-size:13px;">
                Jeśli to nie Ty prosiłeś o zmianę hasła, zignoruj tę wiadomość.
                file:///D:/Users/admin-3.AM-T-07477/Documents/staz/Staz/reset/odn.html
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    };
}

function jsonResponse(body: unknown, status: number) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
}