const SUPABASE_URL = 'https://yewyjfcrwwmftovbobwl.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlld3lqZmNyd3dtZnRvdmJvYndsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2NTk0MDYsImV4cCI6MjA5OTIzNTQwNn0.-IEcT_EfGqxjS4AAIKIbmTOonaXtF0MorQ74hEXzVrQ';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

document.addEventListener('DOMContentLoaded', async function () {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        window.location.href = '../logowanie/log.html';
        return;
    }

    document.getElementById('deleteBtn').addEventListener('click', async function () {
        const statusEl = document.getElementById('status');
        statusEl.textContent = 'Usuwanie konta...';

        // Wywołuje funkcję SQL "delete_user" (security definer) utworzoną w Supabase,
        // która usuwa konto TYLKO osoby aktualnie zalogowanej.
        const { error } = await supabaseClient.rpc('delete_user');

        if (error) {
            statusEl.textContent = 'Błąd: ' + error.message;
            return;
        }

        await supabaseClient.auth.signOut();
        window.location.href = '../logowanie/log.html';
    });
});