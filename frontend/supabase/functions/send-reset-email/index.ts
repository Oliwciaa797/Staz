import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders(),
    });
  }

  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      return jsonResponse(
        { error: "Nieprawidłowe dane wejściowe." },
        400
      );
    }

    const { email, redirectTo } = body;

    if (!email) {
      return jsonResponse(
        { error: "Brak adresu e-mail." },
        400
      );
    }

    const supabaseAdmin = createClient(
      SUPABASE_URL,
      SERVICE_ROLE_KEY
    );

    const {
      data,
      error: linkError,
    } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo,
      },
    });

    console.log("LINK ERROR:", linkError);
    console.log("LINK DATA:", JSON.stringify(data, null, 2));

    if (linkError) {
      return jsonResponse(
        { error: linkError.message },
        400
      );
    }

    const resetLink = data?.properties?.action_link;

    if (!resetLink) {
      return jsonResponse(
        { error: "Nie udało się wygenerować linku resetującego." },
        500
      );
    }

    const resendResponse = await fetch(
      "https://api.resend.com/emails",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "onboarding@resend.dev",
          to: email,
          subject: "Resetowanie hasła",
          html: buildEmailHtml(resetLink),
        }),
      }
    );

    const resendData = await resendResponse.json();

    console.log("RESEND STATUS:", resendResponse.status);
    console.log("RESEND DATA:", resendData);

    if (!resendResponse.ok) {
      return jsonResponse(
        { error: resendData },
        500
      );
    }

    return jsonResponse(
      {
        success: true,
        id: resendData.id,
      },
      200
    );
  } catch (error) {
    console.error("ERROR:", error);

    return jsonResponse(
      {
        error: String(error),
      },
      500
    );
  }
});

function buildEmailHtml(resetLink: string) {
  return `
<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="UTF-8" />
</head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="background:#2d4a1e;padding:32px;text-align:center;">
              <h1 style="margin:0;color:#fff;">
                Resetowanie hasła
              </h1>
            </td>
          </tr>

          <tr>
            <td style="padding:32px;">
              <p style="font-size:15px;color:#333;line-height:1.6;">
                Kliknij przycisk poniżej aby ustawić nowe hasło.
              </p>

              <div style="text-align:center;margin:30px 0;">
                <a
                  href="${resetLink}"
                  target="_blank"
                  style="
                    background:#2d4a1e;
                    colore prosiłeś o zmianę hasła, zignoruj tę wiadomość.
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
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
  };
}

function jsonResponse(
  body: unknown,
  status: number
) {
  return new Response(
    JSON.stringify(body),
    {
      status,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders(),
      },
    }
  );
}