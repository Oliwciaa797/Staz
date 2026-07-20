import { Resend } from "npm:resend";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const { email, inviterEmail } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(
        JSON.stringify({ error: "Nieprawidłowy adres email" }),
        { status: 400, headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" } }
      );
    }

    const { data, error } = await resend.emails.send({
      from: "WiseUp <noreply@WiseUp>",
      to: [email],
      subject: "Dołacz do nas!",
      html: `
        <!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Zaproszenie do społeczności</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f4f7; font-family: Arial, Helvetica, sans-serif;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7; padding:40px 0;">
    <tr>
      <td align="center">

        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 16px rgba(0,0,0,0.06);">

          <!-- Nagłówek -->
          <tr>
            <td style="background-color:#5d7337; padding:32px; text-align:center;">
              <h1 style="margin:0; color:#ffffff; font-size:22px; font-weight:600;">
                Dołącz do naszej społeczności!
              </h1>
            </td>
          </tr>

          <!-- Treść -->
          <tr>
            <td style="padding:36px 32px 24px 32px;">
              <p style="margin:0 0 16px 0; color:#333333; font-size:15px; line-height:1.6;">
                Cześć,
              </p>
              <p style="margin:0 0 24px 0; color:#333333; font-size:15px; line-height:1.6;">
                Ktoś zaprosił Cię do dołączenia do naszej społeczności! To miejsce, gdzie możesz uczyć się, wymieniać doświadczeniami i rozwijać się razem z innymi. Kliknij przycisk poniżej, aby dołączyć.
              </p>

              <!-- Przycisk -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="border-radius:8px; background-color:#5d7337;">
                    <a href=""
                       target="_blank"
                       style="display:inline-block; padding:14px 32px; font-size:15px; font-weight:600; color:#ffffff; text-decoration:none; border-radius:8px;">
                      Dołącz teraz
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:28px 0 0 0; color:#888888; font-size:13px; line-height:1.5;">
                Jeśli przycisk nie działa, skopiuj i wklej poniższy link do przeglądarki:
              </p>
              <p style="margin:8px 0 0 0; font-size:13px; word-break:break-all;">
                <a href="" style="color:#4f46e5;"></a>
              </p>
            </td>
          </tr>

          <!-- Ostrzeżenie -->
          <tr>
            <td style="padding:0 32px 32px 32px;">
              <p style="margin:0; color:#999999; font-size:13px; line-height:1.5;">
                Jeśli nie spodziewałeś się tej wiadomości lub nie chcesz dołączać, możesz ją po prostu zignorować.
              </p>
            </td>
          </tr>

          <!-- Stopka -->
          <tr>
            <td style="background-color:#f4f4f7; padding:20px 32px; text-align:center;">
              <p style="margin:0; color:#aaaaaa; font-size:12px;">
                Wiadomość wygenerowana automatycznie — prosimy na nią nie odpowiadać.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
      `,
    });

    if (error) {
      return new Response(JSON.stringify({ error }), {
        status: 500,
        headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ data }), {
      status: 200,
      headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" },
    });
  }
});