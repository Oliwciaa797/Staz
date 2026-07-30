import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders() });
    }

    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return jsonResponse({ error: 'Brak emaila lub hasła.' }, 400);
        }
        if (password.length < 8) {
            return jsonResponse({ error: 'Hasło musi mieć co najmniej 8 znaków.' }, 400);
        }

        const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

        // Znajdź użytkownika po emailu (generateLink zwraca dane usera, ale nie wysyła nic)
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'recovery',
            email: email,
        });

        if (linkError || !linkData?.user) {
            return jsonResponse({ error: 'Nie znaleziono użytkownika o podanym emailu.' }, 404);
        }

        const userId = linkData.user.id;

        // Ustaw nowe hasło bezpośrednio
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
            password: password,
        });

        if (updateError) {
            return jsonResponse({ error: updateError.message }, 500);
        }

        return jsonResponse({ success: true }, 200);

    } catch (err) {
        return jsonResponse({ error: String(err) }, 500);
    }
});

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