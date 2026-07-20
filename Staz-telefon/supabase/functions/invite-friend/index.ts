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
      from: "Nazwa strony <onboarding@resend.dev>",
      to: [email],
      subject: "Zaproszenie do społeczności",
      html: `
        <p>Cześć,</p>
        <p>${inviterEmail || "Ktoś"} zaprosił Cię do dołączenia do naszej społeczności!</p>
        <p><a href="https://twojastrona.pl/rejestracja">Dołącz teraz</a></p>
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